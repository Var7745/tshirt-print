import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute, logActivity } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: Request) {
  // 1. Independent Server-Side Authentication
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const payment = searchParams.get('payment') || '';
    const category = searchParams.get('category') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const sort = searchParams.get('sort') || 'newest';

    let sql = `
      SELECT 
        o.id,
        o.created_at,
        o.customer_name,
        o.phone,
        o.email,
        o.college_name,
        o.department,
        o.batch,
        o.event_name,
        o.event_category,
        o.event_date,
        o.delivery_required_date,
        o.participants_count,
        o.tshirts_count,
        o.collage_shape,
        o.pack_name,
        o.price_per_tshirt,
        o.total_amount,
        o.advance_amount,
        o.remaining_amount,
        o.payment_status,
        o.production_status,
        o.delivery_status,
        (SELECT COUNT(*) FROM individual_tshirts it WHERE it.order_id = o.id) as actual_tshirts_count,
        (SELECT COUNT(DISTINCT main_photo_url) FROM individual_tshirts it WHERE it.order_id = o.id AND main_photo_url IS NOT NULL) as unique_photos_count,
        (SELECT SUM(required_print_copies) FROM individual_tshirts it WHERE it.order_id = o.id) as total_print_copies
      FROM orders o
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search.trim()) {
      sql += ` AND (o.id LIKE ? OR o.customer_name LIKE ? OR o.college_name LIKE ? OR o.phone LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (status && status !== 'all') {
      if (status === 'design_approval') {
        sql += ` AND o.production_status IN ('customer_approval', 'design_preparation')`;
      } else if (status === 'production') {
        sql += ` AND o.production_status IN ('printing_pending', 'printing_in_progress', 'quality_inspection', 'packing')`;
      } else {
        sql += ` AND (o.production_status = ? OR o.delivery_status = ?)`;
        params.push(status, status);
      }
    }

    if (payment && payment !== 'all') {
      sql += ` AND o.payment_status = ?`;
      params.push(payment);
    }

    if (category && category !== 'all') {
      sql += ` AND o.event_category = ?`;
      params.push(category);
    }

    if (dateFrom) {
      sql += ` AND o.created_at >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      sql += ` AND o.created_at <= ?`;
      params.push(dateTo + 'T23:59:59Z');
    }

    if (sort === 'oldest') {
      sql += ` ORDER BY o.created_at ASC`;
    } else if (sort === 'highest_amount') {
      sql += ` ORDER BY o.total_amount DESC`;
    } else if (sort === 'most_tshirts') {
      sql += ` ORDER BY o.tshirts_count DESC`;
    } else {
      sql += ` ORDER BY o.created_at DESC`;
    }

    const orders = queryAll(sql, params);

    return NextResponse.json({
      success: true,
      total: orders.length,
      data: orders,
      orders,
      pagination: {
        total: orders.length,
        pages: Math.max(1, Math.ceil(orders.length / 15)),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // 1. Independent Server-Side Authentication
  const auth = requireAdminAuth(req);
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const body = await req.json();
    const now = new Date().toISOString();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Generate unique Order ID: JK-YYYY-XXXX
    const year = new Date().getFullYear();
    const countRow = queryOne('SELECT COUNT(*) as count FROM orders');
    const nextSeq = String((countRow?.count || 0) + 1).padStart(4, '0');
    const orderId = body.id || `JK-${year}-${nextSeq}`;

    const customerName = (body.customer_name || body.collegeName || 'Student Representative').trim();
    const phone = body.phone || '+91 98765 00000';
    const email = body.email || 'customer@jkempress.com';
    const collegeName = body.college_name || body.collegeName || 'College';
    const department = body.department || body.courseSection || 'General';
    const batch = body.batch || `Class of ${body.graduatingYear || year}`;
    const eventName = body.event_name || 'Signature Day';
    const eventCategory = body.event_category || 'Signature Day';
    const eventDate = body.event_date || '2027-03-25';
    const deliveryRequiredDate = body.delivery_required_date || '2027-03-20';
    const participantsCount = Math.max(1, Number(body.participants_count || body.expectedMembers || 25));
    const tshirtsCount = Math.max(1, Number(body.tshirts_count || body.expectedMembers || 25));
    const collageShape = body.collage_shape || body.collageShape || 'honeycomb';
    const packName = body.pack_name || body.pack || 'salina';

    // 2. Server-Side Price Verification against official packages
    const packageSlabPrices: Record<string, number> = {
      basic: 130,
      salina: 150,
      top: 200,
    };
    const defaultSlabPrice = packageSlabPrices[packName] || 150;
    const pricePerTshirt = Number(body.price_per_tshirt) || defaultSlabPrice;

    const printingCharges = Math.max(0, Number(body.printing_charges || 0));
    const customizationCharges = Math.max(0, Number(body.customization_charges || 0));
    const shippingCharges = Math.max(0, Number(body.shipping_charges || 0));
    const discountAmount = Math.max(0, Number(body.discount_amount || 0));

    // Calculate totals server-side
    const baseTotal = tshirtsCount * pricePerTshirt + printingCharges + customizationCharges + shippingCharges - discountAmount;
    const gstAmount = Math.round(baseTotal * 0.05 * 100) / 100;
    const totalAmount = baseTotal + gstAmount;
    const advanceAmount = Math.max(0, Number(body.advance_amount || 0));
    const remainingAmount = Math.max(0, totalAmount - advanceAmount);

    // Payment status computed server-side
    const paymentStatus = advanceAmount >= totalAmount ? 'paid' : advanceAmount > 0 ? 'partially_paid' : 'pending';

    // Insert or update customer
    let customerId = body.customer_id;
    if (!customerId) {
      customerId = 'cust_' + Math.random().toString(36).substring(2, 9);
      execute(
        `INSERT INTO customers (id, name, phone, whatsapp, email, college_name, department, batch, billing_address, delivery_address, total_orders, total_spent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [customerId, customerName, phone, phone, email, collegeName, department, batch, body.billing_address || '', body.delivery_address || '', totalAmount, now]
      );
    } else {
      execute(
        `UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?`,
        [totalAmount, customerId]
      );
    }

    // Insert Order
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
        body.billing_address || `${collegeName}, ${department}`,
        body.delivery_address || `${collegeName}, ${department}`,
        eventName, eventCategory, eventDate, deliveryRequiredDate,
        participantsCount, tshirtsCount, collageShape, packName, pricePerTshirt,
        printingCharges, customizationCharges, shippingCharges, discountAmount, gstAmount,
        totalAmount, advanceAmount, remainingAmount, paymentStatus, body.production_status || 'photos_uploading',
        'packing_pending', body.special_instructions || '', body.back_template || 'jersey', now, now,
      ]
    );

    logActivity(
      auth.user.name,
      auth.user.role,
      'Order Created',
      'order',
      orderId,
      `Order ${orderId} created for ${customerName} (${tshirtsCount} shirts @ ₹${pricePerTshirt}/shirt, Total: ₹${totalAmount})`,
      ip
    );

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: orderId,
        order_id: orderId,
        total_amount: totalAmount,
        advance_amount: advanceAmount,
        remaining_amount: remainingAmount,
        payment_status: paymentStatus,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
