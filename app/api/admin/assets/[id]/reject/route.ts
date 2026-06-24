import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await execute(
      'UPDATE assets SET status = ?, updated_at = datetime("now") WHERE id = ?',
      'rejected', params.id
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
