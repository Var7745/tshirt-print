import { NextResponse } from 'next/server';
import { getDb, checkRateLimit } from '@/lib/db';
import { getCustomerAuth } from '@/lib/auth';

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

    // Check for customer authentication from cookie session
    const custAuth = getCustomerAuth(req);
    if (custAuth.authenticated && custAuth.user?.id) {
      if (!body.customer_id) body.customer_id = custAuth.user.id;
      if (!body.customer_name) body.customer_name = custAuth.user.name;
      if (!body.email) body.email = custAuth.user.email;
      if (!body.phone) body.phone = custAuth.user.phone;
    }
    const db = getDb();
    const now = new Date().toISOString();

    // 2. Idempotency & Duplicate Order Prevention
    const idempotencyKey = (
      req.headers.get('idempotency-key') ||
      body.idempotency_key ||
      body.batch_id ||
      ''
    ).trim();

    if (idempotencyKey) {
      const existing = db
        .prepare(
          `SELECT id, total_amount, price_per_tshirt, payment_status, advance_amount, remaining_amount, customer_name, college_name 
           FROM orders 
           WHERE id = ? OR idempotency_key = ?`
        )
        .get(idempotencyKey, idempotencyKey) as any;

      if (existing) {
        return NextResponse.json({
          success: true,
          orderId: existing.id,
          totalAmount: existing.total_amount,
          pricePerTshirt: existing.price_per_tshirt,
          paymentStatus: existing.payment_status,
          advanceAmount: existing.advance_amount,
          remainingAmount: existing.remaining_amount,
          deduplicated: true,
          message: 'Order already recorded. Retrieved existing record.',
        });
      }
    }

    // 3. Server-Side Input Validation
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

    // 4. Server-Side Package Pricing Rules (Query products catalog or use validated tier rates)
    const rawPack = String(body.pack_name || body.pack || 'salina').toLowerCase();
    
    // Check product catalog for live active pricing
    let pricePerTshirt = 150;
    try {
      const productRow = db
        .prepare('SELECT price FROM products WHERE is_active = 1 AND (LOWER(sku) LIKE ? OR LOWER(id) LIKE ?) LIMIT 1')
        .get(`%${rawPack}%`, `%${rawPack}%`) as any;
      if (productRow && Number(productRow.price) > 0) {
        pricePerTshirt = Number(productRow.price);
      } else {
        const standardPacks: Record<string, number> = {
          basic: 130,
          salina: 150,
          top: 200,
          fest: 160,
        };
        pricePerTshirt = standardPacks[rawPack] || 150;
      }
    } catch {
      pricePerTshirt = 150;
    }

    const packName = rawPack;

    // Compute pricing strictly on the server: base + 5% GST
    const baseTotal = tshirtsCount * pricePerTshirt;
    const gstAmount = Math.round(baseTotal * 0.05 * 100) / 100;
    const totalAmount = baseTotal + gstAmount;
    const advanceAmount = Math.round(totalAmount * 0.5);
    const remainingAmount = totalAmount - advanceAmount;

    // Security Rule: Public customers CANNOT set payment_status to 'paid'
    const paymentStatus = 'pending';
    const productionStatus = 'photos_uploading';

    // Unique Order ID Generation
    const year = new Date().getFullYear();
    const countRow = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    const nextSeq = String((countRow?.count || 0) + 1).padStart(4, '0');
    const orderId = body.batch_id
      ? `JK-${year}-${body.batch_id.substring(0, 4).toUpperCase()}`
      : `JK-${year}-${nextSeq}`;

    const customerName = String(body.customer_name || 'Batch Coordinator').trim().slice(0, 100);
    const phone = String(body.phone || '+91 98765 00000').slice(0, 20);
    const email = String(body.email || 'customer@jkempress.com').slice(0, 100);
    const batch = String(body.batch || `Class of ${year + 1}`).slice(0, 50);
    const eventName = String(body.event_name || `${department} Signature Day`).slice(0, 100);
    const collageShape = ['honeycomb', 'square', 'chain'].includes(body.collage_shape)
      ? body.collage_shape
      : 'honeycomb';
    const backTemplate = ['jersey', 'varsity', 'minimal'].includes(body.back_template)
      ? body.back_template
      : 'jersey';

    let customerId = body.customer_id;
    let customerExists = false;

    if (customerId) {
      const existingCust = db.prepare('SELECT id, name, total_orders, total_spent FROM customers WHERE id = ?').get(customerId) as any;
      if (existingCust) {
        customerId = existingCust.id;
        customerExists = true;
      }
    }

    if (!customerExists && email) {
      const existingByEmail = db.prepare('SELECT id, name, total_orders, total_spent FROM customers WHERE LOWER(email) = ? OR phone = ?').get(email.toLowerCase(), phone) as any;
      if (existingByEmail) {
        customerId = existingByEmail.id;
        customerExists = true;
      }
    }

    if (!customerId) {
      customerId = 'cust_' + Math.random().toString(36).substring(2, 9);
    }

    // 5. Atomic Transaction: Customer + Order + Notification + Audit Log
    db.exec('BEGIN IMMEDIATE');
    try {
      if (customerExists) {
        // Update existing customer record with batch details
        db.prepare(`
          UPDATE customers SET
            college_name = COALESCE(?, college_name),
            department = COALESCE(?, department),
            batch = COALESCE(?, batch),
            total_orders = COALESCE(total_orders, 0) + 1,
            total_spent = COALESCE(total_spent, 0) + ?
          WHERE id = ?
        `).run(collegeName, department, batch, totalAmount, customerId);
      } else {
        // Insert Customer
        db.prepare(`
          INSERT INTO customers (
            id, name, phone, whatsapp, email, college_name, department, batch,
            billing_address, delivery_address, total_orders, total_spent, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).run(
          customerId,
          customerName,
          phone,
          phone,
          email,
          collegeName,
          department,
          batch,
          `${collegeName}, ${department}`,
          `${collegeName}, ${department}`,
          totalAmount,
          now
        );
      }

      // Insert Order with Idempotency Key
      const inviteToken = body.batch_id || body.invite_token || orderId;

      db.prepare(`
        INSERT INTO orders (
          id, customer_id, customer_name, phone, whatsapp, email, college_name, department, batch,
          billing_address, delivery_address, event_name, event_category, event_date, delivery_required_date,
          participants_count, tshirts_count, collage_shape, pack_name, price_per_tshirt,
          printing_charges, customization_charges, shipping_charges, discount_amount, gst_amount,
          total_amount, advance_amount, remaining_amount, payment_status, production_status,
          delivery_status, special_instructions, back_template, idempotency_key, invite_token, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?
        )
      `).run(
        orderId,
        customerId,
        customerName,
        phone,
        phone,
        email,
        collegeName,
        department,
        batch,
        `${collegeName}, ${department}`,
        `${collegeName}, ${department}`,
        eventName,
        'Batch T-Shirts',
        `${year + 1}-03-25`,
        `${year + 1}-03-20`,
        participantsCount,
        tshirtsCount,
        collageShape,
        packName,
        pricePerTshirt,
        0,
        0,
        0,
        0,
        gstAmount,
        totalAmount,
        advanceAmount,
        remainingAmount,
        paymentStatus,
        productionStatus,
        'packing_pending',
        body.special_instructions || '',
        backTemplate,
        idempotencyKey || null,
        inviteToken,
        now,
        now
      );

      // Admin Dashboard Notification
      db.prepare(`
        INSERT INTO notifications (id, title, message, type, link, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
      `).run(
        `notif_${Date.now()}`,
        'New Batch Order Received',
        `${collegeName} initiated a ${tshirtsCount}-shirt order (${orderId})`,
        'order',
        `/admin/orders/${orderId}`,
        now
      );

      // Activity Audit Log
      db.prepare(`
        INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `log_${Date.now()}`,
        customerName,
        'Customer',
        'Batch Created',
        'order',
        orderId,
        `New batch order submitted for ${collegeName} (${tshirtsCount} shirts @ ₹${pricePerTshirt}/shirt, Total: ₹${totalAmount})`,
        ip,
        now
      );

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    return NextResponse.json({
      success: true,
      orderId,
      totalAmount,
      pricePerTshirt,
      paymentStatus,
      advanceAmount,
      remainingAmount,
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error creating order' },
      { status: 500 }
    );
  }
}
