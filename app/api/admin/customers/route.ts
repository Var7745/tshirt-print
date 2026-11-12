import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/customers - List customers with metrics, search, and order counts
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ` AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR college_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY total_spent DESC, created_at DESC';

    const customers = db.prepare(query).all(...params);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_customers,
        SUM(total_orders) as total_orders_all,
        SUM(total_spent) as total_revenue_all
      FROM customers
    `).get() as any;

    return NextResponse.json({
      success: true,
      data: customers,
      stats: {
        totalCustomers: stats?.total_customers || 0,
        totalOrders: stats?.total_orders_all || 0,
        totalRevenue: stats?.total_revenue_all || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/customers - Add or update customer
export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const now = new Date().toISOString();

    if (body.id) {
      db.prepare(`
        UPDATE customers SET
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          whatsapp = COALESCE(?, whatsapp),
          email = COALESCE(?, email),
          college_name = COALESCE(?, college_name),
          department = COALESCE(?, department),
          batch = COALESCE(?, batch),
          billing_address = COALESCE(?, billing_address),
          delivery_address = COALESCE(?, delivery_address),
          notes = COALESCE(?, notes)
        WHERE id = ?
      `).run(
        body.name, body.phone, body.whatsapp, body.email,
        body.college_name, body.department, body.batch,
        body.billing_address, body.delivery_address, body.notes,
        body.id
      );

      const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(body.id);
      return NextResponse.json({ success: true, data: updated });
    }

    const id = `cust_${Date.now()}`;
    db.prepare(`
      INSERT INTO customers (
        id, name, phone, whatsapp, email, college_name, department, batch,
        billing_address, delivery_address, total_orders, total_spent, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.name,
      body.phone,
      body.whatsapp || body.phone,
      body.email || null,
      body.college_name || 'Individual',
      body.department || null,
      body.batch || null,
      body.billing_address || null,
      body.delivery_address || null,
      0,
      0,
      body.notes || null,
      now
    );

    const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error in customer POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
