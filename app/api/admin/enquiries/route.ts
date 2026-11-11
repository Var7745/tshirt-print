import { NextRequest, NextResponse } from 'next/server';
import { getDb, checkRateLimit } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/enquiries - List inquiries
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const enquiries = db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC').all();
    return NextResponse.json({ success: true, data: enquiries });
  } catch (error: any) {
    console.error('Error fetching enquiries:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/enquiries - Update status or follow up date
export async function PATCH(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const { id, status, follow_up_date, internal_notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (follow_up_date !== undefined) { updates.push('follow_up_date = ?'); values.push(follow_up_date); }
    if (internal_notes !== undefined) { updates.push('internal_notes = ?'); values.push(internal_notes); }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE enquiries SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error in enquiries PATCH:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/enquiries - Create new enquiry
export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const now = new Date().toISOString();
    const id = `enq_${Date.now()}`;

    const customerName = String(body.customer_name || '').trim().slice(0, 100);
    const phone = String(body.phone || '').trim().slice(0, 20);

    if (!customerName || !phone) {
      return NextResponse.json({ success: false, error: 'Customer name and phone are required' }, { status: 400 });
    }

    db.prepare(`
      INSERT INTO enquiries (id, customer_name, phone, email, college_name, subject, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)
    `).run(
      id,
      customerName,
      phone,
      body.email ? String(body.email).slice(0, 100) : null,
      body.college_name ? String(body.college_name).slice(0, 100) : null,
      body.subject ? String(body.subject).slice(0, 150) : 'Bulk T-Shirt Enquiry',
      body.message ? String(body.message).slice(0, 1000) : '',
      now
    );

    // Also trigger notification
    db.prepare(`
      INSERT INTO notifications (id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, 'enquiry', '/admin/enquiries', 0, ?)
    `).run(
      `notif_${Date.now()}`,
      `New Lead: ${customerName}`,
      `From ${body.college_name || 'Customer'}: "${body.subject || 'New Enquiry'}"`,
      now
    );

    const created = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error creating enquiry:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
