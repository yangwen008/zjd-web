export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createProfessionalOrder } from '@/lib/data';
import { checkAndEnforceRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/professionals/order
 * 预约服务商
 */
export async function POST(request: Request) {
  try {
    await checkAndEnforceRateLimit('api.general', request);

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const body = await request.json() as {
      professional_id: number;
      asset_id?: number;
      service_name: string;
      contact_name?: string;
      contact_phone?: string;
      notes?: string;
    };

    if (!body.professional_id || !body.service_name) {
      return NextResponse.json({ success: false, error: '服务商ID和服务项目不能为空' }, { status: 400 });
    }

    const orderId = await createProfessionalOrder({
      professional_id: body.professional_id,
      asset_id: body.asset_id,
      user_id: user.id,
      service_name: body.service_name,
      contact_name: body.contact_name,
      contact_phone: body.contact_phone,
      notes: body.notes,
    });

    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    if (error.message?.includes('Rate limit')) {
      return NextResponse.json({ success: false, error: '操作过于频繁，请稍后再试' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
