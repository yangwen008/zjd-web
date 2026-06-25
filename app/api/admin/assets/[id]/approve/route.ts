export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await execute(
      'UPDATE assets SET status = ?, updated_at = datetime("now") WHERE id = ?',
      'approved', id
    );

    // 审计日志
    await execute(
      'INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, detail, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
      0, 'approve', 'asset', parseInt(id, 10), `Asset #${id} approved`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
