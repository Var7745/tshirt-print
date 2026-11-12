import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/products - List products catalog
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const products = db.prepare('SELECT * FROM products ORDER BY price ASC').all();

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/products - Create or update product
export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req, 'Admin');
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const now = new Date().toISOString();

    if (body.id) {
      db.prepare(`
        UPDATE products SET
          name = COALESCE(?, name),
          sku = COALESCE(?, sku),
          category = COALESCE(?, category),
          price = COALESCE(?, price),
          description = COALESCE(?, description),
          sizes_json = COALESCE(?, sizes_json),
          colours_json = COALESCE(?, colours_json),
          fabric = COALESCE(?, fabric),
          image_url = COALESCE(?, image_url),
          stock_status = COALESCE(?, stock_status),
          is_active = COALESCE(?, is_active)
        WHERE id = ?
      `).run(
        body.name,
        body.sku,
        body.category,
        body.price !== undefined ? Number(body.price) : null,
        body.description,
        body.sizes ? JSON.stringify(body.sizes) : null,
        body.colours ? JSON.stringify(body.colours) : null,
        body.fabric,
        body.image_url,
        body.stock_status,
        body.is_active !== undefined ? (body.is_active ? 1 : 0) : null,
        body.id
      );

      const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(body.id);
      return NextResponse.json({ success: true, data: updated });
    }

    const id = `prod_${Date.now()}`;
    db.prepare(`
      INSERT INTO products (
        id, name, sku, category, price, description, sizes_json, colours_json,
        fabric, sleeve_types_json, image_url, stock_status, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.name,
      body.sku || `JK-${Math.floor(1000 + Math.random() * 9000)}`,
      body.category || 'Signature Day',
      Number(body.price || 150),
      body.description || 'Premium Custom Printed Apparel',
      JSON.stringify(body.sizes || ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']),
      JSON.stringify(body.colours || ['White', 'Off-White', 'Black', 'Navy Blue']),
      body.fabric || '100% Bio-Washed Cotton (220 GSM)',
      JSON.stringify(['Half Sleeve', 'Full Sleeve']),
      body.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
      'in_stock',
      1,
      now
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error in products POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
