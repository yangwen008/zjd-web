export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { createSession } from '@/lib/auth';

/**
 * POST /api/auth/wx/mini-login
 * 微信小程序登录：用 wx.login() 的 code 换取 openid，自动创建/匹配用户
 * body: { code: wx.login()凭证, phone_code?: getPhoneNumber凭证(可选) }
 *
 * ⚠️ 必须配置 WX_MINI_APPID / WX_MINI_APPSECRET（小程序自己的凭据）。
 *    公众号的 WX_APPID/WX_APPSECRET 与小程序不是同一个应用，
 *    拿公众号凭据兑换小程序 code 会报 errcode 40029 "invalid code"。
 */
export async function POST(request: Request) {
  try {
    const { code, phone_code } = await request.json() as { code: string; phone_code?: string };

    if (!code) {
      return NextResponse.json({ success: false, error: '缺少 code' }, { status: 400 });
    }

    // 只认小程序自己的凭据，不做公众号兜底（兜底会以 40029 invalid code 的形式暴露，极难排查）
    const env = process.env as Record<string, string>;
    const appId = env.WX_MINI_APPID || '';
    const appSecret = env.WX_MINI_APPSECRET || '';

    if (!appId || !appSecret) {
      return NextResponse.json({
        success: false,
        error: '小程序登录未配置 WX_MINI_APPID/WX_MINI_APPSECRET（须填小程序的 AppID/Secret，不是公众号的）'
      }, { status: 500 });
    }

    // 1. 用 code 换取 openid + session_key
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
    const wxRes = await fetch(wxUrl);
    const wxData = await wxRes.json() as {
      openid?: string;
      session_key?: string;
      unionid?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!wxData.openid) {
      console.error('jscode2session failed:', wxData, 'appid tail:', appId.slice(-6));
      let hint = '';
      if (wxData.errcode === 40029) {
        hint = '｜排查：①后端 WX_MINI_APPID 是否与当前小程序 AppID 一致 ②开发者工具是否用真实 AppID（非测试号）编译 ③code 仅一次有效且 5 分钟过期，勿重复提交';
      } else if (wxData.errcode === 40125) {
        hint = '｜排查：WX_MINI_APPSECRET 不正确（注意不是公众号 AppSecret）';
      }
      return NextResponse.json({
        success: false,
        error: `微信登录失败: ${wxData.errmsg || '未知错误'} (${wxData.errcode || ''})${hint}`
      }, { status: 400 });
    }

    const openid = wxData.openid;
    const unionid = wxData.unionid || null;

    // 1.5 可选：手机号快捷登录 —— 用 getPhoneNumber 的 phone_code 换手机号
    //     需要小程序 access_token；失败不阻断，降级为仅 openid 登录
    let phone: string | null = null;
    if (phone_code) {
      try {
        const tokenRes = await fetch(
          `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
        );
        const tokenData = await tokenRes.json() as { access_token?: string; errcode?: number; errmsg?: string };
        if (tokenData.access_token) {
          const phoneRes = await fetch(
            `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${tokenData.access_token}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: phone_code }),
            }
          );
          const phoneData = await phoneRes.json() as {
            errcode?: number;
            errmsg?: string;
            phone_info?: { purePhoneNumber?: string; phoneNumber?: string };
          };
          phone = phoneData.phone_info?.purePhoneNumber || phoneData.phone_info?.phoneNumber || null;
          if (!phone) console.warn('getuserphonenumber failed:', phoneData.errcode, phoneData.errmsg);
        } else {
          console.warn('mini access_token fetch failed:', tokenData.errcode, tokenData.errmsg);
        }
      } catch (e) {
        console.warn('phone_code exchange failed (non-fatal):', e);
      }
    }

    // 2. 查找已有用户（优先 wx_openid，其次 openid，手机号快捷登录时再按手机号兜底）
    let user = await queryOne<{ id: number; nickname: string; role: string; avatar_url: string | null; phone: string | null }>(
      'SELECT id, nickname, role, avatar_url, phone FROM users WHERE wx_openid = ? OR openid = ? LIMIT 1',
      openid, openid
    );
    if (!user && phone) {
      user = await queryOne<{ id: number; nickname: string; role: string; avatar_url: string | null; phone: string | null }>(
        'SELECT id, nickname, role, avatar_url, phone FROM users WHERE phone = ? LIMIT 1',
        phone
      );
      // 老手机号账号首次微信登录：回填 openid 绑定
      if (user) {
        await execute('UPDATE users SET wx_openid = ?, wx_unionid = ? WHERE id = ?', openid, unionid, user.id);
      }
    }

    // 3. 自动创建新用户
    if (!user) {
      const result = await execute(
        `INSERT INTO users (openid, wx_openid, wx_unionid, phone, phone_verified, nickname, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'buyer', 'active', datetime('now'), datetime('now'))`,
        openid, openid, unionid, phone, phone ? 1 : 0, '微信用户'
      );
      const userId = result.meta?.last_row_id || 0;
      user = { id: userId, nickname: '微信用户', role: 'buyer', avatar_url: null, phone };
    } else if (phone && !user.phone) {
      // 已有微信账号补绑手机号
      await execute('UPDATE users SET phone = ?, phone_verified = 1 WHERE id = ?', phone, user.id);
      user = { ...user, phone };
    }

    // 4. 创建 session
    const sessionId = await createSession(user.id);

    // 5. 返回 token + 用户信息
    const res = NextResponse.json({
      success: true,
      token: sessionId,
      user: {
        id: user.id,
        nickname: user.nickname,
        role: user.role,
        avatar_url: user.avatar_url,
        phone: user.phone,
      },
    });

    // 同时设置 cookie（H5 兼容）
    res.cookies.set('user_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 86400,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('mini-login error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
