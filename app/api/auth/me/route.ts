export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getUserFromRequest, getUserPermissions, ROLE_LABELS } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const permissions = await getUserPermissions(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nickname: user.nickname,
        phone: user.phone,
        role: user.role,
        role_label: ROLE_LABELS[user.role] || user.role,
        status: user.status,
        avatar_url: user.avatar_url,
        verified: user.verified,
        permissions,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
}
