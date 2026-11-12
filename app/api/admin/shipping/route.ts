import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/shipping - List shipments with tracking info
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const shipments = db.prepare(`
      SELECT s.*, o.college_name, o.phone, o.email, o.event_name
      FROM shipping_records s
      JOIN orders o ON s.order_id = o.id
      ORDER BY s.updated_at DESC
    `).all();

    return NextResponse.json({ success: true, data: shipments });
  } catch (error: any) {
    console.error('Error fetching shipping:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/shipping - Update courier, tracking, status
export async function PATCH(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const { order_id, courier_name, tracking_number, status, shipment_date, expected_delivery_date, actual_delivery_date, delivery_notes } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (courier_name !== undefined) { updates.push('courier_name = ?'); values.push(courier_name); }
    if (tracking_number !== undefined) { updates.push('tracking_number = ?'); values.push(tracking_number); }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
      db.prepare('UPDATE orders SET delivery_status = ?, updated_at = ? WHERE id = ?').run(status, now, order_id);
    }
    if (shipment_date !== undefined) { updates.push('shipment_date = ?'); values.push(shipment_date); }
    if (expected_delivery_date !== undefined) { updates.push('expected_delivery_date = ?'); values.push(expected_delivery_date); }
    if (actual_delivery_date !== undefined) { updates.push('actual_delivery_date = ?'); values.push(actual_delivery_date); }
    if (delivery_notes !== undefined) { updates.push('delivery_notes = ?'); values.push(delivery_notes); }

    values.push(order_id);
    db.prepare(`UPDATE shipping_records SET ${updates.join(', ')} WHERE order_id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM shipping_records WHERE order_id = ?').get(order_id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error in shipping PATCH:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
