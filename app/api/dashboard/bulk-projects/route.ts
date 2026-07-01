export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET: 获取当前用户的大宗项目列表
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    // admin/superadmin 可看全部，其他角色只看自己的
    const isAdmin = ['admin', 'superadmin'].includes(user.role);
    const sql = isAdmin
      ? 'SELECT * FROM bulk_projects ORDER BY created_at DESC LIMIT 50'
      : 'SELECT * FROM bulk_projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 50';

    const results = isAdmin
      ? await query(sql)
      : await query(sql, user.id);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// DELETE: 删除大宗项目（仅自己的或管理员）
export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const { id } = await request.json() as { id: number };
    if (!id) return NextResponse.json({ success: false, error: '缺少项目ID' }, { status: 400 });

    const isAdmin = ['admin', 'superadmin'].includes(user.role);
    if (isAdmin) {
      await execute('DELETE FROM bulk_projects WHERE id = ?', id);
    } else {
      await execute('DELETE FROM bulk_projects WHERE id = ? AND user_id = ?', id, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
