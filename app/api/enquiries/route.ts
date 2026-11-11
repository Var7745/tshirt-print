import { NextRequest, NextResponse } from 'next/server';
import { getDb, checkRateLimit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // IP Rate Limiting: 5 enquiries per 10 minutes
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(`enquiry_${ip}`, 5, 600);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many enquiries sent. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const customerName = String(body.customer_name || body.name || '').trim().slice(0, 100);
    const phone = String(body.phone || '').trim().slice(0, 20);

    if (!customerName || !phone) {
      return NextResponse.json(
        { success: false, error: 'Please provide both your name and phone number.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();
    const id = `enq_${Date.now()}`;

    db.prepare(`
      INSERT INTO enquiries (id, customer_name, phone, email, college_name, subject, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)
    `).run(
      id,
      customerName,
      phone,
      body.email ? String(body.email).slice(0, 100) : null,
      body.college_name ? String(body.college_name).slice(0, 100) : null,
      body.subject ? String(body.subject).slice(0, 150) : 'Bulk T-Shirt Enquiry',
      body.message ? String(body.message).slice(0, 1000) : '',
      now
    );

    // Create Admin notification
    db.prepare(`
      INSERT INTO notifications (id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, 'enquiry', '/admin/enquiries', 0, ?)
    `).run(
      `notif_${Date.now()}`,
      `New Lead: ${customerName}`,
      `From ${body.college_name || 'Customer'}: "${body.subject || 'New Enquiry'}"`,
      now
    );

    return NextResponse.json({ success: true, message: 'Enquiry received. Our team will contact you shortly.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
