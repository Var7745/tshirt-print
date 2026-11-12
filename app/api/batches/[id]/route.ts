import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params.id;
    if (!rawId) {
      return NextResponse.json({ success: false, error: 'Batch ID is required' }, { status: 400 });
    }

    // Check if the request is from the batch creator dashboard or public join page
    const viewMode = req.nextUrl.searchParams.get('view') || 'public';
    const isCreatorView = viewMode === 'creator';

    // Lookup order by either order ID or unique invite token
    const order = queryOne(
      `SELECT id, college_name, department, batch, event_name, collage_shape, pack_name,
              back_template, participants_count, tshirts_count, price_per_tshirt,
              payment_status, production_status, invite_token, created_at
       FROM orders
       WHERE id = ? OR invite_token = ? OR id LIKE ?`,
      [rawId, rawId, `%${rawId}%`]
    ) as any;

    if (!order) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    // Fetch all registered individual tshirts
    const tshirts = queryAll(
      `SELECT id, tshirt_number, person_name, jersey_name, roll_number, size,
              colour, fabric, main_photo_url, production_status, created_at
       FROM individual_tshirts
       WHERE order_id = ?
       ORDER BY created_at ASC`,
      [order.id]
    ) as any[];

    // Calculate standardized size breakdown (S, M, L, XL, XXL, XXXL)
    const sizeBreakdown: Record<string, number> = {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      XXXL: 0,
    };

    tshirts.forEach(t => {
      let sz = (t.size || 'M').toUpperCase();
      if (sz === '2XL') sz = 'XXL';
      if (sz === '3XL') sz = 'XXXL';
      if (sizeBreakdown[sz] !== undefined) {
        sizeBreakdown[sz]++;
      }
    });

    return NextResponse.json(
      {
        success: true,
        batch: {
          id: order.id,
          collegeName: order.college_name,
          courseSection: order.department,
          graduatingYear: parseInt(order.batch?.replace(/\D/g, '') || '2027', 10),
          pack: order.pack_name || 'salina',
          packPrice: order.price_per_tshirt || 150,
          collageShape: order.collage_shape || 'honeycomb',
          backTemplate: order.back_template || 'jersey',
          expectedMembers: Math.max(order.participants_count, tshirts.length),
          totalJoined: tshirts.length,
          photosSubmitted: tshirts.filter(t => Boolean(t.main_photo_url)).length,
          inviteToken: order.invite_token,
          status: order.production_status,
          paymentStatus: order.payment_status,
          sizeBreakdown,
          // Privacy Enforcement:
          // The batch creator gets ALL uploaded photos.
          // Public join link participants CANNOT see other users' private photos (redacted to null).
          members: tshirts.map(t => ({
            id: t.id,
            fullName: t.person_name,
            jerseyName: t.jersey_name || t.person_name,
            rollNumber: t.roll_number || '',
            size: t.size === '2XL' ? 'XXL' : t.size === '3XL' ? 'XXXL' : t.size,
            photoUrl: isCreatorView ? t.main_photo_url : null,
            status: t.production_status || 'confirmed',
            joinedAt: t.created_at,
          })),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch batch details' },
      { status: 500 }
    );
  }
}
