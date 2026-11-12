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

// GET /api/admin/orders/[id]/tshirts - Fetch all individual t-shirts for an order
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const orderId = params.id;

    const tshirts = db.prepare(`
      SELECT * FROM individual_tshirts 
      WHERE order_id = ? 
      ORDER BY tshirt_number ASC
    `).all(orderId);

    const sizeCounts: Record<string, number> = {};
    let totalPrintCopies = 0;
    let totalUniquePhotos = 0;

    tshirts.forEach((t: any) => {
      sizeCounts[t.size] = (sizeCounts[t.size] || 0) + 1;
      totalPrintCopies += Number(t.required_print_copies || 1);
      if (t.main_photo_url) totalUniquePhotos += 1;
    });

    return NextResponse.json({
      success: true,
      data: tshirts,
      stats: {
        totalTshirts: tshirts.length,
        sizeCounts,
        totalPrintCopies,
        totalUniquePhotos,
      },
    });
  } catch (error: any) {
    console.error('Error fetching tshirts:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/orders/[id]/tshirts - Add individual t-shirt
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const db = getDb();
    const orderId = params.id;
    const body = await req.json();

    if (!isSafeUrl(body.main_photo_url) || !isSafeUrl(body.signature_image_url)) {
      return NextResponse.json({ success: false, error: 'Insecure URL scheme rejected' }, { status: 400 });
    }

    const order = db.prepare('SELECT id, tshirts_count, total_amount, price_per_tshirt FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const countRow = db.prepare('SELECT COUNT(*) as count FROM individual_tshirts WHERE order_id = ?').get(orderId) as { count: number };
    const nextSeq = (countRow.count + 1).toString().padStart(3, '0');
    const tshirtNumber = `${orderId}-${nextSeq}`;
    const id = `tsh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO individual_tshirts (
        id, order_id, tshirt_number, person_name, jersey_name, roll_number,
        size, colour, fabric, sleeve_type, main_photo_url, additional_photos,
        custom_text, signature_image_url, special_instructions,
        print_front, print_back, print_left_sleeve, print_right_sleeve,
        unique_photos_count, required_print_copies, production_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      id,
      orderId,
      tshirtNumber,
      body.person_name || `Member ${countRow.count + 1}`,
      body.jersey_name || body.person_name || '',
      body.roll_number || '',
      body.size || 'L',
      body.colour || 'White',
      body.fabric || '100% Bio-Washed Cotton (220 GSM)',
      body.sleeve_type || 'Half Sleeve',
      body.main_photo_url || null,
      JSON.stringify(body.additional_photos || []),
      body.custom_text || null,
      body.signature_image_url || null,
      body.special_instructions || null,
      body.print_front !== undefined ? (body.print_front ? 1 : 0) : 1,
      body.print_back !== undefined ? (body.print_back ? 1 : 0) : 1,
      body.print_left_sleeve ? 1 : 0,
      body.print_right_sleeve ? 1 : 0,
      body.unique_photos_count || (body.main_photo_url ? 1 : 0),
      body.required_print_copies || 1,
      'pending',
      now
    );

    db.prepare(`
      UPDATE orders 
      SET tshirts_count = (SELECT COUNT(*) FROM individual_tshirts WHERE order_id = ?),
          updated_at = ?
      WHERE id = ?
    `).run(orderId, now, orderId);

    db.prepare(`
      INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log_${Date.now()}`,
      auth.user.name,
      auth.user.role,
      'ADD_TSHIRT',
      'individual_tshirts',
      tshirtNumber,
      `Added T-Shirt ${tshirtNumber} (${body.person_name}, Size: ${body.size || 'L'})`,
      now
    );

    const created = db.prepare('SELECT * FROM individual_tshirts WHERE id = ?').get(id);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error adding tshirt:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/orders/[id]/tshirts - Update individual t-shirt
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const db = getDb();
    const orderId = params.id;
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'T-shirt ID required' }, { status: 400 });
    }

    if (!isSafeUrl(body.main_photo_url) || !isSafeUrl(body.signature_image_url)) {
      return NextResponse.json({ success: false, error: 'Insecure URL scheme rejected' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'person_name', 'jersey_name', 'roll_number', 'size', 'colour', 'fabric',
      'sleeve_type', 'main_photo_url', 'custom_text', 'signature_image_url',
      'special_instructions', 'print_front', 'print_back', 'print_left_sleeve',
      'print_right_sleeve', 'unique_photos_count', 'required_print_copies',
      'production_status',
    ];

    allowedFields.forEach((f) => {
      if (body[f] !== undefined) {
        updates.push(`${f} = ?`);
        if (f.startsWith('print_')) {
          values.push(body[f] ? 1 : 0);
        } else {
          values.push(body[f]);
        }
      }
    });

    if (body.additional_photos) {
      updates.push('additional_photos = ?');
      values.push(JSON.stringify(body.additional_photos));
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(body.id);
    values.push(orderId);

    db.prepare(`UPDATE individual_tshirts SET ${updates.join(', ')} WHERE id = ? AND order_id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM individual_tshirts WHERE id = ?').get(body.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating tshirt:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/orders/[id]/tshirts - Delete individual t-shirt
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const db = getDb();
    const orderId = params.id;
    const { searchParams } = new URL(req.url);
    const tshirtId = searchParams.get('tshirt_id');

    if (!tshirtId) {
      return NextResponse.json({ success: false, error: 'tshirt_id parameter is required' }, { status: 400 });
    }

    const item = db.prepare('SELECT * FROM individual_tshirts WHERE id = ? AND order_id = ?').get(tshirtId, orderId) as any;
    if (!item) {
      return NextResponse.json({ success: false, error: 'T-shirt not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM individual_tshirts WHERE id = ? AND order_id = ?').run(tshirtId, orderId);

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE orders 
      SET tshirts_count = (SELECT COUNT(*) FROM individual_tshirts WHERE order_id = ?),
          updated_at = ?
      WHERE id = ?
    `).run(orderId, now, orderId);

    db.prepare(`
      INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log_${Date.now()}`,
      auth.user.name,
      auth.user.role,
      'DELETE_TSHIRT',
      'individual_tshirts',
      item.tshirt_number,
      `Deleted T-Shirt ${item.tshirt_number} (${item.person_name})`,
      now
    );

    return NextResponse.json({ success: true, message: `T-shirt ${item.tshirt_number} removed` });
  } catch (error: any) {
    console.error('Error deleting tshirt:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
