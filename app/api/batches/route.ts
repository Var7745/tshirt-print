import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';
import { getCustomerAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/batches - List batches for the authenticated coordinator
export async function GET(req: NextRequest) {
  try {
    const auth = getCustomerAuth(req);
    const db = (await import('@/lib/db')).getDb();

    let orders: any[] = [];

    if (auth.authenticated && auth.user) {
      orders = db.prepare(`
        SELECT id, customer_name, college_name, department, batch, event_name, collage_shape,
               pack_name, price_per_tshirt, participants_count, tshirts_count, total_amount,
               advance_amount, payment_status, production_status, invite_token, created_at
        FROM orders
        WHERE customer_id = ? OR LOWER(email) = ?
        ORDER BY created_at DESC
      `).all(auth.user.id, auth.user.email.toLowerCase());
    } else {
      // Return recent active public batches
      orders = db.prepare(`
        SELECT id, customer_name, college_name, department, batch, event_name, collage_shape,
               pack_name, price_per_tshirt, participants_count, tshirts_count, total_amount,
               advance_amount, payment_status, production_status, invite_token, created_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT 10
      `).all();
    }

    return NextResponse.json(
      {
        success: true,
        batches: orders.map((o: any) => ({
          id: o.invite_token || o.id,
          orderId: o.id,
          collegeName: o.college_name,
          courseSection: o.department,
          graduatingYear: parseInt(o.batch?.replace(/\D/g, '') || '2027', 10),
          pack: o.pack_name,
          packPrice: o.price_per_tshirt,
          collageShape: o.collage_shape,
          expectedMembers: o.tshirts_count,
          createdAt: o.created_at,
          status: o.production_status,
          paymentStatus: o.payment_status,
          totalAmount: o.total_amount,
        })),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
