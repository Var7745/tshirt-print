import { NextRequest, NextResponse } from 'next/server';
import { getDb, logActivity } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/inventory - List inventory items, logs, and stock alerts
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const itemType = searchParams.get('item_type');
    const lowStockOnly = searchParams.get('low_stock') === 'true';

    let query = 'SELECT * FROM inventory_items WHERE 1=1';
    const params: any[] = [];

    if (itemType && itemType !== 'all') {
      query += ' AND item_type = ?';
      params.push(itemType);
    }

    if (lowStockOnly) {
      query += ' AND current_stock <= low_stock_threshold';
    }

    query += ' ORDER BY item_type ASC, name ASC';

    const items = db.prepare(query).all(...params);

    const recentLogs = db.prepare(`
      SELECT * FROM inventory_logs 
      ORDER BY created_at DESC 
      LIMIT 25
    `).all();

    const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM inventory_items WHERE current_stock <= low_stock_threshold').get() as { count: number };
    const totalTshirts = db.prepare("SELECT SUM(current_stock) as sum FROM inventory_items WHERE item_type = 'tshirt'").get() as { sum: number };

    return NextResponse.json({
      success: true,
      data: items,
      recentLogs,
      summary: {
        totalItems: items.length,
        lowStockAlerts: lowStockCount.count,
        totalBlankTshirtsInStock: totalTshirts.sum || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/inventory - Adjust stock or add new inventory item
export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const now = new Date().toISOString();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Action 1: Adjust existing item stock
    if (body.action === 'adjust') {
      const { inventory_id, change_type, quantity, reason, reference_order_id } = body;

      const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(inventory_id) as any;
      if (!item) {
        return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
      }

      const qty = Number(quantity);
      let newStock = item.current_stock;

      if (change_type === 'stock_in') {
        newStock += qty;
      } else if (change_type === 'stock_out' || change_type === 'order_allocation') {
        newStock = Math.max(0, newStock - qty);
      } else if (change_type === 'adjustment') {
        newStock = qty;
      }

      db.prepare('UPDATE inventory_items SET current_stock = ?, updated_at = ? WHERE id = ?').run(newStock, now, inventory_id);

      db.prepare(`
        INSERT INTO inventory_logs (id, inventory_id, item_name, change_type, quantity, reason, reference_order_id, user_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `log_${Date.now()}`,
        inventory_id,
        item.name,
        change_type,
        qty,
        reason || 'Manual adjustment',
        reference_order_id || null,
        auth.user.name,
        now
      );

      logActivity(auth.user.name, auth.user.role, 'Stock Adjusted', 'inventory', inventory_id, `${change_type} ${qty} for ${item.name}`, ip);

      const updated = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(inventory_id);
      return NextResponse.json({ success: true, data: updated });
    }

    // Action 2: Create new inventory item
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO inventory_items (
        id, item_type, name, size, colour, fabric, current_stock, low_stock_threshold,
        unit, unit_cost, supplier_name, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.item_type || 'tshirt',
      body.name,
      body.size || null,
      body.colour || null,
      body.fabric || null,
      Number(body.current_stock || 0),
      Number(body.low_stock_threshold || 20),
      body.unit || 'pcs',
      Number(body.unit_cost || 0),
      body.supplier_name || 'JK Empress Mills',
      now
    );

    logActivity(auth.user.name, auth.user.role, 'Item Created', 'inventory', id, `Added inventory item: ${body.name}`, ip);

    const created = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error in inventory POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
