import { NextRequest, NextResponse } from 'next/server';
import { getDb, logActivity } from '@/lib/db';
import { requireAdminAuth, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/staff - Get staff members and audit activity logs
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req, 'Admin');
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');

    if (view === 'logs') {
      const logs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100').all();
      return NextResponse.json({ success: true, data: logs });
    }

    const staff = db.prepare(`
      SELECT id, email, name, role, phone, avatar_url, status, created_at, last_login_at
      FROM admin_users
      ORDER BY 
        CASE role
          WHEN 'Admin' THEN 1
          WHEN 'Super Admin' THEN 1
          WHEN 'Order Manager' THEN 2
          WHEN 'Designer' THEN 3
          WHEN 'Production Manager' THEN 4
          WHEN 'Finance Manager' THEN 5
          ELSE 6
        END
    `).all();

    const recentLogs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 20').all();

    return NextResponse.json({
      success: true,
      data: {
        staff,
        logs: recentLogs,
      },
    });
  } catch (error: any) {
    console.error('Error in staff API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/staff - Add new staff member
export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req, 'Admin');
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const now = new Date().toISOString();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    if (!body.email || !body.name) {
      return NextResponse.json({ success: false, error: 'Email and name are required' }, { status: 400 });
    }

    const rawPassword = body.password || 'TemporaryPass123!';
    const passwordHash = hashPassword(rawPassword);

    const id = `usr_${Date.now()}`;
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, name, role, phone, avatar_url, status, created_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(
      id,
      body.email.trim().toLowerCase(),
      passwordHash,
      body.name.trim(),
      body.role || 'Admin',
      body.phone || null,
      body.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      now,
      null
    );

    logActivity(
      auth.user.name,
      auth.user.role,
      'CREATE_STAFF',
      'admin_users',
      id,
      `Created staff account for ${body.name} (${body.role})`,
      ip
    );

    const created = db.prepare('SELECT id, email, name, role, phone, status FROM admin_users WHERE id = ?').get(id);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error adding staff:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
