export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getBrokerById } from '@/lib/data';

/**
 * GET /api/brokers/:id
 * 获取合伙人详情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const broker = await getBrokerById(id);
    if (!broker) {
      return NextResponse.json({ success: false, error: '合伙人不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: broker });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
