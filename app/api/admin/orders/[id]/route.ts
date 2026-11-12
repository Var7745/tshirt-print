import { NextResponse } from 'next/server';
import { queryOne, queryAll, execute, logActivity } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const orderId = params.id;
    const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Customer
    const customer = queryOne('SELECT * FROM customers WHERE id = ?', [order.customer_id]);

    // Individual T-shirts
    const tshirts = queryAll(
      `SELECT * FROM individual_tshirts WHERE order_id = ? ORDER BY tshirt_number ASC`,
      [orderId]
    );

    // Compute Size Breakdown
    const sizeBreakdown: Record<string, number> = {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      '3XL': 0,
    };
    let totalFrontPrints = 0;
    let totalBackPrints = 0;
    let totalLeftSleevePrints = 0;
    let totalRightSleevePrints = 0;
    let totalPrintableCopies = 0;
    const uniquePhotosSet = new Set<string>();

    tshirts.forEach((shirt: any) => {
      if (shirt.size && sizeBreakdown[shirt.size] !== undefined) {
        sizeBreakdown[shirt.size]++;
      } else if (shirt.size) {
        sizeBreakdown[shirt.size] = (sizeBreakdown[shirt.size] || 0) + 1;
      }
      if (shirt.print_front) totalFrontPrints += shirt.required_print_copies || 1;
      if (shirt.print_back) totalBackPrints += shirt.required_print_copies || 1;
      if (shirt.print_left_sleeve) totalLeftSleevePrints += shirt.required_print_copies || 1;
      if (shirt.print_right_sleeve) totalRightSleevePrints += shirt.required_print_copies || 1;
      totalPrintableCopies += shirt.required_print_copies || 1;

      if (shirt.main_photo_url) uniquePhotosSet.add(shirt.main_photo_url);
      if (shirt.additional_photos) {
        try {
          const arr = JSON.parse(shirt.additional_photos);
          if (Array.isArray(arr)) {
            arr.forEach((p) => p && uniquePhotosSet.add(p));
          }
        } catch {}
      }
    });

    // Design Files
    const designFiles = queryAll(
      `SELECT * FROM design_files WHERE order_id = ? ORDER BY side ASC`,
      [orderId]
    );

    // Production Record
    const production = queryOne('SELECT * FROM production_records WHERE order_id = ?', [orderId]);

    // Shipping Record
    const shipping = queryOne('SELECT * FROM shipping_records WHERE order_id = ?', [orderId]);

    // Payments
    const payments = queryAll('SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC', [orderId]);

    // Order Activity Logs
    const activities = queryAll(
      `SELECT * FROM activity_logs WHERE entity_id = ? OR details LIKE ? ORDER BY created_at DESC LIMIT 15`,
      [orderId, `%${orderId}%`]
    );

    return NextResponse.json({
      success: true,
      data: {
        order,
        customer,
        individualTshirts: tshirts,
        tshirts,
        sizeBreakdown,
        printSummary: {
          totalTshirts: tshirts.length || order.tshirts_count,
          totalUniquePhotos: uniquePhotosSet.size,
          totalPrintableCopies,
          totalFrontPrints,
          totalBackPrints,
          totalLeftSleevePrints,
          totalRightSleevePrints,
        },
        designFiles,
        productionRecord: production,
        production,
        shippingRecord: shipping,
        shipping,
        payments,
        activities,
      },
      order,
      customer,
      tshirts,
      individualTshirts: tshirts,
      designFiles,
      productionRecord: production,
      shippingRecord: shipping,
      payments,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const orderId = params.id;
    const body = await req.json();
    const now = new Date().toISOString();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    const existing = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const customerName = body.customer_name ?? existing.customer_name;
    const phone = body.phone ?? existing.phone;
    const email = body.email ?? existing.email;
    const collegeName = body.college_name ?? existing.college_name;
    const department = body.department ?? existing.department;
    const batch = body.batch ?? existing.batch;
    const eventName = body.event_name ?? existing.event_name;
    const eventCategory = body.event_category ?? existing.event_category;
    const eventDate = body.event_date ?? existing.event_date;
    const deliveryRequiredDate = body.delivery_required_date ?? existing.delivery_required_date;
    const participantsCount = Math.max(1, Number(body.participants_count ?? existing.participants_count));
    const tshirtsCount = Math.max(1, Number(body.tshirts_count ?? existing.tshirts_count));
    const pricePerTshirt = Number(body.price_per_tshirt ?? existing.price_per_tshirt);
    const printingCharges = Math.max(0, Number(body.printing_charges ?? existing.printing_charges));
    const customizationCharges = Math.max(0, Number(body.customization_charges ?? existing.customization_charges));
    const shippingCharges = Math.max(0, Number(body.shipping_charges ?? existing.shipping_charges));
    const discountAmount = Math.max(0, Number(body.discount_amount ?? existing.discount_amount));

    // Server-side calculation of total amount
    const baseTotal = tshirtsCount * pricePerTshirt + printingCharges + customizationCharges + shippingCharges - discountAmount;
    const gstAmount = Math.round(baseTotal * 0.05 * 100) / 100;
    const totalAmount = baseTotal + gstAmount;
    const advanceAmount = Math.max(0, Number(body.advance_amount ?? existing.advance_amount));
    const remainingAmount = Math.max(0, totalAmount - advanceAmount);

    // Payment status reconciliation: only authorized admins can adjust status
    const paymentStatus = body.payment_status ?? existing.payment_status;
    const productionStatus = body.production_status ?? existing.production_status;
    const deliveryStatus = body.delivery_status ?? existing.delivery_status;
    const specialInstructions = body.special_instructions ?? existing.special_instructions;
    const backTemplate = body.back_template ?? existing.back_template;
    const collageShape = body.collage_shape ?? existing.collage_shape;
    const billingAddress = body.billing_address ?? existing.billing_address;
    const deliveryAddress = body.delivery_address ?? existing.delivery_address;

    execute(
      `UPDATE orders SET
        customer_name = ?, phone = ?, email = ?, college_name = ?, department = ?, batch = ?,
        event_name = ?, event_category = ?, event_date = ?, delivery_required_date = ?,
        participants_count = ?, tshirts_count = ?, price_per_tshirt = ?, printing_charges = ?,
        customization_charges = ?, shipping_charges = ?, discount_amount = ?, gst_amount = ?,
        total_amount = ?, advance_amount = ?, remaining_amount = ?, payment_status = ?,
        production_status = ?, delivery_status = ?, special_instructions = ?, back_template = ?,
        collage_shape = ?, billing_address = ?, delivery_address = ?, updated_at = ?
       WHERE id = ?`,
      [
        customerName, phone, email, collegeName, department, batch,
        eventName, eventCategory, eventDate, deliveryRequiredDate,
        participantsCount, tshirtsCount, pricePerTshirt, printingCharges,
        customizationCharges, shippingCharges, discountAmount, gstAmount,
        totalAmount, advanceAmount, remainingAmount, paymentStatus,
        productionStatus, deliveryStatus, specialInstructions, backTemplate,
        collageShape, billingAddress, deliveryAddress, now, orderId,
      ]
    );

    // Update production status if changed
    if (productionStatus !== existing.production_status) {
      execute(
        `UPDATE production_records SET stage = ?, updated_at = ? WHERE order_id = ?`,
        [productionStatus, now, orderId]
      );
    }

    logActivity(
      auth.user.name,
      auth.user.role,
      'Order Updated',
      'order',
      orderId,
      `Order ${orderId} updated by ${auth.user.email} (Status: ${productionStatus}, Payment: ${paymentStatus}, Total: ₹${totalAmount})`,
      ip
    );

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} updated successfully`,
      data: {
        id: orderId,
        total_amount: totalAmount,
        remaining_amount: remainingAmount,
        payment_status: paymentStatus,
        production_status: productionStatus,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminAuth(req, 'Admin');
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const orderId = params.id;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    execute(`UPDATE orders SET production_status = 'cancelled' WHERE id = ?`, [orderId]);
    logActivity(auth.user.name, auth.user.role, 'Order Cancelled', 'order', orderId, `Order ${orderId} cancelled`, ip);
    return NextResponse.json({ success: true, message: `Order ${orderId} cancelled` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export const PATCH = PUT;
