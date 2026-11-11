import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/content - Get settings and CMS items
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM business_settings').all();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error: any) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/content - Update CMS items
export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req, 'Admin');
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const now = new Date().toISOString();

    const insertOrReplace = db.prepare('INSERT OR REPLACE INTO business_settings (key, value, updated_at) VALUES (?, ?, ?)');

    Object.entries(body).forEach(([k, v]) => {
      insertOrReplace.run(k, typeof v === 'string' ? v : JSON.stringify(v), now);
    });

    return NextResponse.json({ success: true, message: 'Content updated successfully' });
  } catch (error: any) {
    console.error('Error updating content:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
