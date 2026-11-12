import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isSafeUrl(url?: string | null): boolean {
  if (!url) return true;
  const lower = url.trim().toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:text/html')) {
    return false;
  }
  return true;
}

// GET /api/admin/designs - List design files with filters and proofing status
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const side = searchParams.get('side');
    const orderId = searchParams.get('order_id');
    const search = searchParams.get('search');

    let query = `
      SELECT 
        df.*,
        o.customer_name,
        o.college_name,
        o.event_name,
        o.status AS order_status,
        o.delivery_required_date,
        o.tshirts_count
      FROM design_files df
      LEFT JOIN orders o ON df.order_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND df.status = ?`;
      params.push(status);
    }

    if (side && side !== 'all') {
      query += ` AND df.side = ?`;
      params.push(side);
    }

    if (orderId) {
      query += ` AND df.order_id = ?`;
      params.push(orderId);
    }

    if (search && search.trim()) {
      query += ` AND (
        df.order_id LIKE ? OR 
        o.customer_name LIKE ? OR 
        o.college_name LIKE ? OR 
        o.event_name LIKE ?
      )`;
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    query += ` ORDER BY df.updated_at DESC, df.created_at DESC`;

    const designs = db.prepare(query).all(...params);

    // Compute stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) as in_review,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status IN ('rejected', 'revision_requested') THEN 1 ELSE 0 END) as rejected
      FROM design_files
    `;
    const stats = db.prepare(statsQuery).get() as any;

    return NextResponse.json({
      success: true,
      data: designs,
      stats: {
        total: Number(stats?.total || 0),
        pending: Number(stats?.pending || 0),
        in_review: Number(stats?.in_review || 0),
        approved: Number(stats?.approved || 0),
        rejected: Number(stats?.rejected || 0),
      }
    });
  } catch (error: any) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/designs - Update design approval status or specifications
export async function PATCH(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const { id, status, approval_notes, print_width_in, print_height_in, dpi, artwork_url, mockup_url } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Design ID is required' }, { status: 400 });
    }

    if (!isSafeUrl(artwork_url) || !isSafeUrl(mockup_url)) {
      return NextResponse.json({ success: false, error: 'Insecure URL scheme rejected' }, { status: 400 });
    }

    const current = db.prepare('SELECT * FROM design_files WHERE id = ?').get(id) as any;
    if (!current) {
      return NextResponse.json({ success: false, error: 'Design file not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
      if (status === 'approved') {
        updates.push('approved_by = ?', 'approved_at = ?');
        values.push(auth.user.name, now);
      }
    }

    if (approval_notes !== undefined) {
      updates.push('approval_notes = ?');
      values.push(approval_notes);
    }
    if (print_width_in !== undefined) {
      updates.push('print_width_in = ?');
      values.push(Number(print_width_in));
    }
    if (print_height_in !== undefined) {
      updates.push('print_height_in = ?');
      values.push(Number(print_height_in));
    }
    if (dpi !== undefined) {
      updates.push('dpi = ?');
      values.push(Number(dpi));
    }
    if (artwork_url !== undefined) {
      updates.push('artwork_url = ?');
      values.push(artwork_url);
    }
    if (mockup_url !== undefined) {
      updates.push('mockup_url = ?');
      values.push(mockup_url);
    }

    values.push(id);
    db.prepare(`UPDATE design_files SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Audit log
    db.prepare(`
      INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log_${Date.now()}`,
      auth.user.name,
      auth.user.role,
      status === 'approved' ? 'APPROVE_DESIGN' : status === 'rejected' ? 'REJECT_DESIGN' : 'UPDATE_DESIGN',
      'design_files',
      id,
      `Updated ${current.side} design status to '${status || current.status}' for order ${current.order_id}`,
      now
    );

    const updated = db.prepare(`
      SELECT df.*, o.customer_name, o.college_name, o.event_name, o.status AS order_status
      FROM design_files df
      LEFT JOIN orders o ON df.order_id = o.id
      WHERE df.id = ?
    `).get(id);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating design:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
