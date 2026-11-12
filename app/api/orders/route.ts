import { NextResponse } from 'next/server';
import { queryOne, execute, checkRateLimit, logActivity } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting (10 orders per 10 minutes)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateKey = `order_submit_${ip}`;
    const rateCheck = checkRateLimit(rateKey, 10, 600);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many order submissions. Please try again in ${Math.ceil(rateCheck.resetInSeconds / 60)} minutes.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const now = new Date().toISOString();

    const collegeName = String(body.college_name || body.collegeName || '').trim();
    if (!collegeName || collegeName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'A valid college name is required' },
        { status: 400 }
      );
    }

    const department = String(body.department || body.courseSection || 'General').trim();
    const rawCount = Number(body.participants_count || body.tshirts_count || body.expectedMembers || 25);
    const participantsCount = Math.min(500, Math.max(1, rawCount));
    const tshirtsCount = participantsCount;

    // 2. Server-side package pricing rules (₹130, ₹150, ₹200)
    const rawPack = String(body.pack_name || body.pack || 'salina').toLowerCase();
    const allowedPacks: Record<string, number> = {
      basic: 130,
      salina: 150,
      top: 200,
    };
    const packName = allowedPacks[rawPack] ? rawPack : 'salina';
    const pricePerTshirt = allowedPacks[packName];

    // Compute pricing strictly server-side
    const baseTotal = tshirtsCount * pricePerTshirt;
    const gstAmount = Math.round(baseTotal * 0.05 * 100) / 100;
    const totalAmount = baseTotal + gstAmount;
    const advanceAmount = Math.round(totalAmount * 0.5);
    const remainingAmount = totalAmount - advanceAmount;

    // Security Rule: Public customers CANNOT set payment_status to 'paid'
    const paymentStatus = 'pending';
    const productionStatus = 'photos_uploading';

    // Unique Order ID
    const year = new Date().getFullYear();
    const countRow = queryOne('SELECT COUNT(*) as count FROM orders');
    const nextSeq = String((countRow?.count || 0) + 1).padStart(4, '0');
    const orderId = body.batch_id ? `JK-${year}-${body.batch_id.substring(0, 4).toUpperCase()}` : `JK-${year}-${nextSeq}`;

    const customerName = String(body.customer_name || 'Batch Coordinator').trim().slice(0, 100);
    const phone = String(body.phone || '+91 98765 00000').slice(0, 20);
    const email = String(body.email || 'customer@jkempress.com').slice(0, 100);
    const batch = String(body.batch || `Class of ${year + 1}`).slice(0, 50);
    const eventName = String(body.event_name || `${department} Signature Day`).slice(0, 100);
    const collageShape = ['honeycomb', 'square', 'chain'].includes(body.collage_shape) ? body.collage_shape : 'honeycomb';
    const backTemplate = ['jersey', 'varsity', 'minimal'].includes(body.back_template) ? body.back_template : 'jersey';

    const customerId = 'cust_' + Math.random().toString(36).substring(2, 9);
    execute(
      `INSERT INTO customers (id, name, phone, whatsapp, email, college_name, department, batch, billing_address, delivery_address, total_orders, total_spent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [customerId, customerName, phone, phone, email, collegeName, department, batch, `${collegeName}, ${department}`, `${collegeName}, ${department}`, totalAmount, now]
    );

    execute(
      `INSERT INTO orders (
        id, customer_id, customer_name, phone, whatsapp, email, college_name, department, batch,
        billing_address, delivery_address, event_name, event_category, event_date, delivery_required_date,
        participants_count, tshirts_count, collage_shape, pack_name, price_per_tshirt,
        printing_charges, customization_charges, shipping_charges, discount_amount, gst_amount,
        total_amount, advance_amount, remaining_amount, payment_status, production_status,
        delivery_status, special_instructions, back_template, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, customerId, customerName, phone, phone, email, collegeName, department, batch,
        `${collegeName}, ${department}`, `${collegeName}, ${department}`, eventName, 'Batch T-Shirts',
        `${year + 1}-03-25`, `${year + 1}-03-20`,
        participantsCount, tshirtsCount, collageShape, packName, pricePerTshirt,
        0, 0, 0, 0, gstAmount,
        totalAmount, advanceAmount, remainingAmount, paymentStatus, productionStatus,
        'packing_pending', '', backTemplate, now, now,
      ]
    );

    logActivity(
      customerName,
      'Customer',
      'Batch Created',
      'order',
      orderId,
      `New batch order submitted for ${collegeName} (${tshirtsCount} shirts @ ₹${pricePerTshirt}/shirt, Total: ₹${totalAmount})`,
      ip
    );

    return NextResponse.json({
      success: true,
      orderId,
      totalAmount,
      pricePerTshirt,
      paymentStatus,
      advanceAmount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
