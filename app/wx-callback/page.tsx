export const runtime = 'edge';

import { getOAuthToken, getWxUserInfo } from '@/lib/wechat';
import { queryOne, execute } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export default async function WxCallbackPage({ searchParams }: { searchParams: Promise<{ code?: string; error?: string; redirect?: string }> }) {
  const params = await searchParams;
  const code = params.code;
  const redirect = params.redirect || '/';

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">微信登录失败</h1>
          <p className="text-gray-500 mb-4">未收到授权码，请重试</p>
          <a href="/login" className="text-brand-green hover:underline">返回登录页</a>
        </div>
      </div>
    );
  }

  // 详细错误收集
  const errors: string[] = [];
  let step = '开始';

  try {
    step = '用code换token';
    const tokenData = await getOAuthToken(code);
    errors.push(`✅ ${step}成功: openid=${tokenData.openid?.slice(0,6)}***`);

    step = '获取用户信息';
    let wxUser = null;
    try {
      wxUser = await getWxUserInfo(tokenData.access_token, tokenData.openid);
      errors.push(`✅ 获取用户信息成功: ${wxUser.nickname}`);
    } catch (e: any) {
      errors.push(`⚠️ 获取用户信息失败(可忽略): ${e.message}`);
    }

    step = '查找已有用户';
    let user = await queryOne<{ id: number; nickname: string; role: string; status: string }>(
      'SELECT id, nickname, role, status FROM users WHERE wx_openid = ?',
      tokenData.openid
    );
    errors.push(user ? `✅ 找到已有用户: id=${user.id}` : '⚠️ 未找到已有用户，将自动注册');

    if (!user && tokenData.unionid) {
      user = await queryOne<{ id: number; nickname: string; role: string; status: string }>(
        'SELECT id, nickname, role, status FROM users WHERE wx_unionid = ?',
        tokenData.unionid
      );
      if (user) {
        await execute('UPDATE users SET wx_openid = ? WHERE id = ?', tokenData.openid, user.id);
        errors.push(`✅ 通过unionid找到用户: id=${user.id}`);
      }
    }

    if (!user) {
      step = '自动注册新用户';
      const nickname = wxUser?.nickname || `微信用户${tokenData.openid.slice(-6)}`;
      const avatarUrl = wxUser?.headimgurl || null;

      const result = await execute(
        `INSERT INTO users (wx_openid, wx_unionid, nickname, avatar_url, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'buyer', 'active', datetime('now'), datetime('now'))`,
        tokenData.openid,
        tokenData.unionid || null,
        nickname,
        avatarUrl
      );

      user = {
        id: result.meta?.last_row_id || 0,
        nickname,
        role: 'buyer',
        status: 'active',
      };
      errors.push(`✅ 注册成功: id=${user.id}, 昵称=${nickname}`);
    }

    step = '创建session';
    const sessionId = await createSession(user.id);
    errors.push(`✅ Session创建成功: ${sessionId.slice(0,8)}***`);

    // 设置 cookie
    const cookieStore = await cookies();
    cookieStore.set('user_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 86400,
      path: '/',
    });

    // 成功，显示跳转
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">微信登录成功！</h1>
          <p className="text-gray-500 mb-2">欢迎，{user.nickname}</p>
          <div className="text-xs text-left bg-gray-50 rounded-lg p-3 mb-4 text-gray-400">
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
          <a href={redirect} className="inline-block bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-brand-light">
            进入首页 →
          </a>
        </div>
      </div>
    );

  } catch (error: any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <div className="text-4xl mb-4 text-center">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">微信登录失败</h1>
          <div className="text-xs bg-red-50 rounded-lg p-3 mb-4 text-red-600">
            <div className="font-bold mb-1">失败步骤: {step}</div>
            <div className="mb-2">错误: {error.message}</div>
            <div className="text-gray-400">
              {errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          </div>
          <div className="text-center">
            <a href="/login" className="text-brand-green hover:underline">返回登录页</a>
          </div>
        </div>
      </div>
    );
  }
}
