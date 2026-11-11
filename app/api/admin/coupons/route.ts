import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/coupons - List coupons
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
    return NextResponse.json({ success: true, data: coupons });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/coupons - Create coupon or toggle active
export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req, 'Admin');
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const now = new Date().toISOString();

    if (body.action === 'toggle') {
      db.prepare('UPDATE coupons SET is_active = (1 - is_active) WHERE id = ?').run(body.id);
      return NextResponse.json({ success: true, message: 'Status toggled' });
    }

    if (body.action === 'delete') {
      db.prepare('DELETE FROM coupons WHERE id = ?').run(body.id);
      return NextResponse.json({ success: true, message: 'Coupon deleted' });
    }

    const id = `cpn_${Date.now()}`;
    db.prepare(`
      INSERT INTO coupons (
        id, code, discount_type, discount_value, min_order_amount,
        max_discount, start_date, expiry_date, usage_limit, used_count, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.code.trim().toUpperCase(),
      body.discount_type || 'percentage',
      Number(body.discount_value),
      Number(body.min_order_amount || 0),
      Number(body.max_discount || 0),
      body.start_date || now.split('T')[0],
      body.expiry_date || null,
      Number(body.usage_limit || 100),
      0,
      1,
      now
    );

    const created = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error in coupons POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
