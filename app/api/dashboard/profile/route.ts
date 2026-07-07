export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getUserFromRequest, getUserPermissions, ROLE_LABELS } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const permissions = await getUserPermissions(user.id);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname,
        phone: user.phone,
        role: user.role,
        role_label: ROLE_LABELS[user.role] || user.role,
        avatar_url: user.avatar_url,
        verified: user.verified,
        real_name: user.real_name,
        permissions,
        broker_region: user.broker_region,
        broker_specialties: user.broker_specialties,
        broker_bio: user.broker_bio,
        bio: user.bio,
        org_name: user.org_name,
        org_license: user.org_license,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as {
      nickname?: string;
      avatar_url?: string;
      real_name?: string;
      broker_region?: string;
      broker_specialties?: string;
      broker_bio?: string;
      bio?: string;
      org_name?: string;
      org_license?: string;
    };

    const updates: string[] = [];
    const args: unknown[] = [];

    if (body.nickname !== undefined) { updates.push('nickname = ?'); args.push(body.nickname); }
    if (body.avatar_url !== undefined) { updates.push('avatar_url = ?'); args.push(body.avatar_url); }
    if (body.real_name !== undefined) { updates.push('real_name = ?'); args.push(body.real_name || null); }
    if (body.broker_region !== undefined) { updates.push('broker_region = ?'); args.push(body.broker_region); }
    if (body.broker_specialties !== undefined) { updates.push('broker_specialties = ?'); args.push(body.broker_specialties); }
    if (body.broker_bio !== undefined) { updates.push('broker_bio = ?'); args.push(body.broker_bio); }
    if (body.bio !== undefined) { updates.push('bio = ?'); args.push(body.bio); }
    if (body.org_name !== undefined) { updates.push('org_name = ?'); args.push(body.org_name); }
    if (body.org_license !== undefined) { updates.push('org_license = ?'); args.push(body.org_license); }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: '没有要更新的内容' }, { status: 400 });
    }

    updates.push('updated_at = datetime("now")');
    args.push(user.id);

    await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, ...args);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
