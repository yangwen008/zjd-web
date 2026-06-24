import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query<{ key: string; value: string }>(
      'SELECT key, value FROM homepage_config'
    );
    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: any = await request.json();
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        await execute(
          'INSERT OR REPLACE INTO homepage_config (key, value, updated_at) VALUES (?, ?, datetime("now"))',
          key, value
        );
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
