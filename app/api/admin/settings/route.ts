import { NextRequest, NextResponse } from 'next/server';
import { getDb, logActivity, checkRateLimit } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/settings - Retrieve settings or download backup
export async function GET(req: NextRequest) {
  // Defense in Depth: Independently require Admin role
  const auth = requireAdminAuth(req, 'Admin');
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const exportFormat = searchParams.get('export');

    if (exportFormat === 'json') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

      // Rate limit database exports to 3 per hour per admin
      const rateLimitKey = `db_export_${auth.user.id}`;
      const rateCheck = checkRateLimit(rateLimitKey, 3, 3600);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { success: false, error: 'Database export rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      // Record export activity audit log
      logActivity(
        auth.user.name,
        auth.user.role,
        'Database Export',
        'system',
        'database',
        `Full database snapshot exported as JSON by ${auth.user.email}`,
        ip
      );

      // Export full database snapshot as JSON backup
      const orders = db.prepare('SELECT * FROM orders').all();
      const tshirts = db.prepare('SELECT * FROM individual_tshirts').all();
      const designs = db.prepare('SELECT * FROM design_files').all();
      const customers = db.prepare('SELECT * FROM customers').all();
      const products = db.prepare('SELECT * FROM products').all();
      const inventory = db.prepare('SELECT * FROM inventory_items').all();
      const payments = db.prepare('SELECT * FROM payments').all();
      const settings = db.prepare('SELECT * FROM business_settings').all();

      const backup = {
        exportedAt: new Date().toISOString(),
        exportedBy: {
          id: auth.user.id,
          name: auth.user.name,
          email: auth.user.email,
        },
        business: 'JK Empress',
        tables: {
          orders,
          tshirts,
          designs,
          customers,
          products,
          inventory,
          payments,
          settings,
        },
      };

      return new Response(JSON.stringify(backup, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="JK_Empress_Backup_${Date.now()}.json"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      });
    }

    const rows = db.prepare('SELECT * FROM business_settings').all();
    const settingsMap: Record<string, string> = {};
    rows.forEach((r: any) => {
      settingsMap[r.key] = r.value;
    });

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/settings - Update business settings
export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req, 'Admin');
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  try {
    const db = getDb();
    const body = await req.json();
    const now = new Date().toISOString();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    const insertOrReplace = db.prepare('INSERT OR REPLACE INTO business_settings (key, value, updated_at) VALUES (?, ?, ?)');

    Object.entries(body).forEach(([key, val]) => {
      insertOrReplace.run(key, typeof val === 'string' ? val : JSON.stringify(val), now);
    });

    logActivity(
      auth.user.name,
      auth.user.role,
      'Settings Updated',
      'settings',
      'business_settings',
      `Updated settings keys: ${Object.keys(body).join(', ')}`,
      ip
    );

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
