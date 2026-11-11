import { NextRequest, NextResponse } from 'next/server';
import { getDb, logActivity } from '@/lib/db';
import { requireAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/reports - Get report summaries or CSV download
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.authorized || !auth.user) return auth.response!;

  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'orders';
    const format = searchParams.get('format'); // 'csv' or 'json'

    if (reportType === 'orders') {
      const orders = db.prepare(`
        SELECT 
          id, customer_name, college_name, event_name, event_category,
          participants_count, tshirts_count, total_amount, advance_amount, remaining_amount,
          payment_status, production_status, delivery_status, created_at
        FROM orders
        ORDER BY created_at DESC
      `).all();

      if (format === 'csv') {
        const headers = ['Order ID', 'Customer', 'College', 'Event', 'Category', 'Participants', 'Tshirts', 'Total (INR)', 'Advance', 'Balance', 'Payment', 'Production', 'Delivery', 'Date'];
        const rows = orders.map((o: any) => [
          o.id,
          `"${(o.customer_name || '').replace(/"/g, '""')}"`,
          `"${(o.college_name || '').replace(/"/g, '""')}"`,
          `"${(o.event_name || '').replace(/"/g, '""')}"`,
          o.event_category,
          o.participants_count,
          o.tshirts_count,
          o.total_amount,
          o.advance_amount,
          o.remaining_amount,
          o.payment_status,
          o.production_status,
          o.delivery_status,
          o.created_at,
        ]);

        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="JK_Empress_Orders_Report_${Date.now()}.csv"`,
          },
        });
      }

      return NextResponse.json({ success: true, data: orders });
    }

    if (reportType === 'sizes') {
      const sizes = db.prepare(`
        SELECT size, COUNT(*) as count, COUNT(DISTINCT order_id) as orders_count
        FROM individual_tshirts
        GROUP BY size
        ORDER BY count DESC
      `).all();

      if (format === 'csv') {
        const headers = ['Size', 'Total T-Shirts Ordered', 'Orders Count'];
        const rows = sizes.map((s: any) => [s.size, s.count, s.orders_count]);
        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="JK_Empress_Size_Breakdown_${Date.now()}.csv"`,
          },
        });
      }

      return NextResponse.json({ success: true, data: sizes });
    }

    if (reportType === 'revenue') {
      const revenue = db.prepare(`
        SELECT 
          substr(payment_date, 1, 7) as month,
          COUNT(*) as payment_count,
          SUM(amount) as total_collected
        FROM payments
        WHERE status = 'paid'
        GROUP BY month
        ORDER BY month DESC
      `).all();

      return NextResponse.json({ success: true, data: revenue });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
