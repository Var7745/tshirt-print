import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

function isSafeUrl(url?: string | null): boolean {
  if (!url) return true;
  const lower = url.trim().toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:text/html')) {
    return false;
  }
  return true;
}

// GET /api/admin/orders/[id]/designs - Get 4-side designs and mockup previews
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const orderId = params.id;

    // Fetch design files for the order
    const designs = db.prepare(`
      SELECT * FROM design_files 
      WHERE order_id = ? 
      ORDER BY 
        CASE side
          WHEN 'front' THEN 1
          WHEN 'back' THEN 2
          WHEN 'left_sleeve' THEN 3
          WHEN 'right_sleeve' THEN 4
          ELSE 5
        END
    `).all(orderId);

    const sides = ['front', 'back', 'left_sleeve', 'right_sleeve'];
    const existingSides = designs.map((d: any) => d.side);

    return NextResponse.json({
      success: true,
      data: designs,
      availableSides: sides,
      configuredSides: existingSides,
    });
  } catch (error: any) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/orders/[id]/designs - Update design file, approval status, artwork
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const db = getDb();
    const orderId = params.id;
    const body = await req.json();

    const { design_id, side, status, artwork_url, mockup_url, print_width_in, print_height_in, dpi, approval_notes } = body;

    if (!isSafeUrl(artwork_url) || !isSafeUrl(mockup_url)) {
      return NextResponse.json({ success: false, error: 'Insecure URL scheme rejected' }, { status: 400 });
    }

    let targetId = design_id;
    const now = new Date().toISOString();

    if (!targetId && side) {
      const existing = db.prepare('SELECT id, version FROM design_files WHERE order_id = ? AND side = ?').get(orderId, side) as any;
      if (existing) {
        targetId = existing.id;
      } else {
        targetId = `dsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        db.prepare(`
          INSERT INTO design_files (
            id, order_id, side, artwork_url, mockup_url, print_width_in, print_height_in,
            dpi, format, status, approval_notes, approved_by, approved_at, version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          targetId, orderId, side, artwork_url || null, mockup_url || null,
          print_width_in || 10, print_height_in || 12, dpi || 300, 'PNG',
          status || 'pending', approval_notes || null,
          status === 'approved' ? auth.user.name : null,
          status === 'approved' ? now : null,
          1, now, now
        );
      }
    }

    if (targetId) {
      const current = db.prepare('SELECT * FROM design_files WHERE id = ?').get(targetId) as any;
      if (!current) {
        return NextResponse.json({ success: false, error: 'Design file not found' }, { status: 404 });
      }

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

      if (artwork_url !== undefined) {
        updates.push('artwork_url = ?');
        values.push(artwork_url);

        if (artwork_url !== current.artwork_url) {
          const nextVersion = (current.version || 1) + 1;
          updates.push('version = ?');
          values.push(nextVersion);

          db.prepare(`
            INSERT INTO design_versions (id, design_file_id, version_number, artwork_url, changes_note, uploaded_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            `ver_${Date.now()}`, targetId, nextVersion, artwork_url,
            body.changes_note || 'Artwork replaced by Admin',
            auth.user.name, now
          );
        }
      }

      if (mockup_url !== undefined) {
        updates.push('mockup_url = ?');
        values.push(mockup_url);
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
      if (approval_notes !== undefined) {
        updates.push('approval_notes = ?');
        values.push(approval_notes);
      }

      values.push(targetId);
      db.prepare(`UPDATE design_files SET ${updates.join(', ')} WHERE id = ?`).run(...values);

      db.prepare(`
        INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `log_${Date.now()}`,
        auth.user.name,
        auth.user.role,
        status === 'approved' ? 'APPROVE_DESIGN' : 'UPDATE_DESIGN',
        'design_files',
        orderId,
        `Updated ${current.side} design status to '${status || current.status}' for ${orderId}`,
        now
      );
    }

    const updatedDesigns = db.prepare('SELECT * FROM design_files WHERE order_id = ?').all(orderId);
    return NextResponse.json({ success: true, data: updatedDesigns });
  } catch (error: any) {
    console.error('Error updating design:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
