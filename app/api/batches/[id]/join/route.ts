import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { queryOne, execute, checkRateLimit, logActivity } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_SIZES = ['S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL'];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params.id;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate Limiting: 10 joins per 10 minutes per IP
    const rateKey = `join_${ip}`;
    const rateCheck = checkRateLimit(rateKey, 10, 600);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many submissions. Please wait ${Math.ceil(rateCheck.resetInSeconds)} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const order = queryOne(
      `SELECT id, college_name, department, participants_count, tshirts_count, price_per_tshirt
       FROM orders
       WHERE id = ? OR invite_token = ? OR id LIKE ?`,
      [rawId, rawId, `%${rawId}%`]
    ) as any;

    if (!order) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    const body = await req.json();
    const personName = String(body.fullName || body.person_name || '').trim();
    if (!personName || personName.length < 2) {
      return NextResponse.json({ success: false, error: 'Full Name is required (minimum 2 characters)' }, { status: 400 });
    }

    const rollNumber = String(body.rollNumber || body.roll_number || '').trim();
    if (!rollNumber) {
      return NextResponse.json({ success: false, error: 'Roll number or student ID is required' }, { status: 400 });
    }

    const size = String(body.size || 'M').toUpperCase();
    if (!VALID_SIZES.includes(size)) {
      return NextResponse.json({ success: false, error: `Invalid size. Choose from: ${VALID_SIZES.join(', ')}` }, { status: 400 });
    }

    const jerseyName = String(body.jerseyName || body.jersey_name || personName.split(' ')[0]).trim().toUpperCase().slice(0, 16);
    const photoUrl = body.photoUrl || body.main_photo_url || null;

    // Check for duplicate roll number within this specific batch
    const duplicate = queryOne(
      `SELECT id, person_name FROM individual_tshirts WHERE order_id = ? AND roll_number = ?`,
      [order.id, rollNumber]
    ) as any;

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `Roll Number '${rollNumber}' has already been registered in this batch by ${duplicate.person_name}. Please verify your roll number.`,
        },
        { status: 409 }
      );
    }

    // Generate unique shirt number
    const countRow = queryOne(
      `SELECT COUNT(*) as count FROM individual_tshirts WHERE order_id = ?`,
      [order.id]
    ) as { count: number };

    const seq = (countRow?.count || 0) + 1;
    const tshirtNumber = `${order.id}-${String(seq).padStart(3, '0')}`;
    const tshirtId = 'tsh_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    execute(
      `INSERT INTO individual_tshirts (
        id, order_id, tshirt_number, person_name, jersey_name, roll_number,
        size, colour, fabric, sleeve_type, main_photo_url, production_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'White', '100% Bio-Washed Cotton (220 GSM)', 'Half Sleeve', ?, 'confirmed', ?)`,
      [tshirtId, order.id, tshirtNumber, personName, jerseyName, rollNumber, size, photoUrl, now]
    );

    // Update order counts
    execute(
      `UPDATE orders 
       SET participants_count = MAX(participants_count, ?),
           tshirts_count = MAX(tshirts_count, ?),
           updated_at = ?
       WHERE id = ?`,
      [seq, seq, now, order.id]
    );

    logActivity(
      personName,
      'Student',
      'Joined Batch',
      'order',
      order.id,
      `Student ${personName} (Roll: ${rollNumber}, Size: ${size}) registered for batch ${order.college_name}`,
      ip
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for batch T-Shirt!',
      member: {
        id: tshirtId,
        tshirtNumber,
        fullName: personName,
        jerseyName,
        rollNumber,
        size,
        photoUrl,
        joinedAt: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit registration' },
      { status: 500 }
    );
  }
}
