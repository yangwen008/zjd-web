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
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
