import { NextRequest, NextResponse } from 'next/server';
import { getDb, logActivity } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/finance - Payments, expenses, and profit summary
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const db = getDb();

    // 1. All Payments
    const payments = db.prepare(`
      SELECT p.*, o.college_name, o.customer_name, o.total_amount as order_total
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      ORDER BY p.payment_date DESC
    `).all();

    // 2. All Expenses
    const expenses = db.prepare('SELECT * FROM expenses ORDER BY expense_date DESC').all();

    // 3. Totals
    const totalPayments = db.prepare("SELECT SUM(amount) as sum FROM payments WHERE status = 'paid'").get() as { sum: number };
    const totalExpenses = db.prepare('SELECT SUM(amount) as sum FROM expenses').get() as { sum: number };
    const totalOrderValue = db.prepare("SELECT SUM(total_amount) as sum, SUM(advance_amount) as advance, SUM(remaining_amount) as balance FROM orders WHERE production_status != 'cancelled'").get() as any;

    const collected = totalPayments?.sum || 0;
    const expenseTotal = totalExpenses?.sum || 0;
    const profit = collected - expenseTotal;

    return NextResponse.json({
      success: true,
      data: {
        payments,
        expenses,
        summary: {
          totalBilled: totalOrderValue?.sum || 0,
          totalCollected: collected,
          totalPending: totalOrderValue?.balance || 0,
          totalExpenses: expenseTotal,
          netProfit: profit,
          profitMarginPct: collected > 0 ? Math.round((profit / collected) * 100) : 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching finance:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/finance - Record new payment or expense
export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const db = getDb();
    const body = await req.json();
    const now = new Date().toISOString();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    if (body.type === 'expense') {
      const id = `exp_${Date.now()}`;
      db.prepare(`
        INSERT INTO expenses (id, category, title, amount, expense_date, payment_method, vendor_name, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        body.category || 'Operations',
        body.title,
        Number(body.amount),
        body.expense_date || now.split('T')[0],
        body.payment_method || 'UPI',
        body.vendor_name || null,
        body.notes || null,
        now
      );

      logActivity(auth.user.name, auth.user.role, 'Expense Recorded', 'finance', id, `Recorded expense: ${body.title} (₹${body.amount})`, ip);

      return NextResponse.json({ success: true, message: 'Expense recorded' });
    }

    // Payment reconciliation
    const id = `pay_${Date.now()}`;
    const orderId = body.order_id;
    const amount = Number(body.amount);

    db.prepare(`
      INSERT INTO payments (id, order_id, amount, payment_date, payment_method, transaction_ref, status, invoice_number, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      orderId,
      amount,
      body.payment_date || now.split('T')[0],
      body.payment_method || 'UPI',
      body.transaction_ref || `TXN${Date.now()}`,
      'paid',
      `INV-${orderId}`,
      body.notes || null,
      now
    );

    // Update order advance and remaining
    const order = db.prepare('SELECT total_amount, advance_amount FROM orders WHERE id = ?').get(orderId) as any;
    if (order) {
      const newAdvance = (order.advance_amount || 0) + amount;
      const newRemaining = Math.max(0, order.total_amount - newAdvance);
      const paymentStatus = newRemaining === 0 ? 'fully_paid' : 'advance_paid';

      db.prepare(`
        UPDATE orders 
        SET advance_amount = ?, remaining_amount = ?, payment_status = ?, updated_at = ?
        WHERE id = ?
      `).run(newAdvance, newRemaining, paymentStatus, now, orderId);
    }

    logActivity(auth.user.name, auth.user.role, 'Payment Reconciled', 'payment', id, `Reconciled payment of ₹${amount} for order ${orderId}`, ip);

    return NextResponse.json({ success: true, message: 'Payment recorded and order updated' });
  } catch (error: any) {
    console.error('Error in finance POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
