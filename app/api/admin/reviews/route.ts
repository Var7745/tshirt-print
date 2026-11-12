import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/reviews - List all customer reviews
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/reviews - Toggle approved / featured
export async function PATCH(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const { id, is_approved, is_published_testimonial } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (is_approved !== undefined) {
      updates.push('is_approved = ?');
      values.push(is_approved ? 1 : 0);
    }
    if (is_published_testimonial !== undefined) {
      updates.push('is_published_testimonial = ?');
      values.push(is_published_testimonial ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
