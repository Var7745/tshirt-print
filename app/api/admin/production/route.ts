import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/production - Get production orders, stages, and stats
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');

    let query = `
      SELECT 
        pr.*,
        o.customer_name,
        o.college_name,
        o.event_name,
        o.tshirts_count,
        o.delivery_required_date,
        o.production_status as order_production_status
      FROM production_records pr
      JOIN orders o ON pr.order_id = o.id
    `;
    const params: any[] = [];

    if (stage && stage !== 'all') {
      query += ' WHERE pr.stage = ?';
      params.push(stage);
    }

    query += " ORDER BY CASE pr.priority WHEN 'express' THEN 1 WHEN 'urgent' THEN 2 ELSE 3 END, o.delivery_required_date ASC";

    const records = db.prepare(query).all(...params);

    const stagesSummary = db.prepare(`
      SELECT stage, COUNT(*) as count, SUM(tshirts_pending) as total_pending_tees
      FROM production_records
      GROUP BY stage
    `).all();

    return NextResponse.json({
      success: true,
      data: records,
      summary: stagesSummary,
    });
  } catch (error: any) {
    console.error('Error in production API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/production - Update stage, checklist, staff, or report defects
export async function PATCH(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const { order_id, stage, assigned_staff_name, priority, checklist_json, defective_increment, notes } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 });
    }

    const current = db.prepare('SELECT * FROM production_records WHERE order_id = ?').get(order_id) as any;
    if (!current) {
      return NextResponse.json({ success: false, error: 'Production record not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (stage !== undefined) {
      updates.push('stage = ?');
      values.push(stage);

      db.prepare('UPDATE orders SET production_status = ?, updated_at = ? WHERE id = ?').run(stage, now, order_id);

      if (stage === 'completed' || stage === 'ready_for_dispatch') {
        updates.push('completed_date = ?');
        values.push(now);
      }
    }

    if (assigned_staff_name !== undefined) {
      updates.push('assigned_staff_name = ?');
      values.push(assigned_staff_name);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (checklist_json !== undefined) {
      updates.push('checklist_json = ?');
      values.push(typeof checklist_json === 'string' ? checklist_json : JSON.stringify(checklist_json));
    }
    if (defective_increment) {
      updates.push('defective_count = defective_count + ?');
      values.push(Number(defective_increment));
      updates.push('reprint_requests = reprint_requests + ?');
      values.push(Number(defective_increment));
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    values.push(order_id);
    db.prepare(`UPDATE production_records SET ${updates.join(', ')} WHERE order_id = ?`).run(...values);

    db.prepare(`
      INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log_${Date.now()}`,
      auth.user.name,
      auth.user.role,
      'UPDATE_PRODUCTION_STAGE',
      'production_records',
      order_id,
      `Updated order ${order_id} production stage to '${stage || current.stage}'`,
      now
    );

    const updated = db.prepare('SELECT * FROM production_records WHERE order_id = ?').get(order_id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating production:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
