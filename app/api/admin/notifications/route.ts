import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/notifications - Get all notifications
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all();
    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get() as { count: number };

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount: unreadCount.count,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/notifications - Mark as read (single or all)
export async function PATCH(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();

    if (body.all) {
      db.prepare('UPDATE notifications SET is_read = 1').run();
      return NextResponse.json({ success: true, message: 'All marked as read' });
    }

    if (body.id) {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(body.id);
      return NextResponse.json({ success: true, message: 'Marked as read' });
    }

    return NextResponse.json({ success: false, error: 'id or all required' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in notifications PATCH:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
