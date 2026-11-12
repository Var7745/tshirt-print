import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getDb, checkRateLimit, logActivity } from '@/lib/db';
import { hashPassword, verifyPassword, createCustomerToken, getCustomerAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/auth/customer - Check current logged-in customer session
export async function GET(req: NextRequest) {
  try {
    const auth = getCustomerAuth(req);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ authenticated: false });
    }

    const db = getDb();
    const customer = db.prepare('SELECT id, name, phone, whatsapp, email, college_name, department, batch, total_orders FROM customers WHERE id = ?').get(auth.user.id) as any;

    if (!customer) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        college_name: customer.college_name,
        department: customer.department,
        batch: customer.batch,
        total_orders: customer.total_orders,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}

// POST /api/auth/customer - Customer Sign Up or Login
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateKey = `cust_auth_${ip}`;
    const rateCheck = checkRateLimit(rateKey, 20, 300);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many authentication attempts. Please wait a few minutes.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const action = String(body.action || 'signup').toLowerCase();
    const db = getDb();
    const now = new Date().toISOString();

    if (action === 'signup') {
      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const collegeName = String(body.college_name || body.collegeName || '').trim();
      const department = String(body.department || body.courseSection || '').trim();
      const batch = String(body.batch || '').trim();

      if (!name || name.length < 2) {
        return NextResponse.json({ success: false, error: 'Full name is required (min 2 characters)' }, { status: 400 });
      }
      if (!phone || phone.length < 8) {
        return NextResponse.json({ success: false, error: 'Valid phone/WhatsApp number is required' }, { status: 400 });
      }
      if (!email || !email.includes('@')) {
        return NextResponse.json({ success: false, error: 'Valid email address is required' }, { status: 400 });
      }
      if (!password || password.length < 6) {
        return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      // Check if user already exists
      const existing = db.prepare('SELECT * FROM customers WHERE email = ? OR phone = ?').get(email, phone) as any;

      let customerId = '';
      if (existing) {
        if (existing.password_hash) {
          return NextResponse.json(
            { success: false, error: 'An account with this email or phone already exists. Please select "Log In".' },
            { status: 409 }
          );
        }

        // Account exists from previous order without password: claim and attach password
        customerId = existing.id;
        const passwordHash = hashPassword(password);
        db.prepare(`
          UPDATE customers SET 
            password_hash = ?, 
            name = ?, 
            college_name = COALESCE(?, college_name),
            department = COALESCE(?, department),
            batch = COALESCE(?, batch)
          WHERE id = ?
        `).run(passwordHash, name, collegeName || null, department || null, batch || null, customerId);
      } else {
        // Create brand new customer
        customerId = 'cust_' + crypto.randomBytes(6).toString('hex');
        const passwordHash = hashPassword(password);
        db.prepare(`
          INSERT INTO customers (
            id, name, phone, whatsapp, email, password_hash, college_name, department, batch,
            billing_address, delivery_address, total_orders, total_spent, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
        `).run(
          customerId,
          name,
          phone,
          phone,
          email,
          passwordHash,
          collegeName || null,
          department || null,
          batch || null,
          collegeName ? `${collegeName}, ${department}` : null,
          collegeName ? `${collegeName}, ${department}` : null,
          now
        );
      }

      const payload = {
        id: customerId,
        name,
        email,
        phone,
        college_name: collegeName,
        department,
        batch,
        role: 'customer' as const,
      };

      const token = createCustomerToken(payload, 30);

      logActivity(
        name,
        'Customer',
        'Customer Account Created',
        'customer',
        customerId,
        `New coordinator account registered: ${email} (${collegeName})`,
        ip
      );

      const response = NextResponse.json({
        success: true,
        user: payload,
        token,
        message: 'Account created successfully',
      });

      // Secure Session Cookie (30 days)
      response.cookies.set({
        name: 'jkempress_customer_session',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    if (action === 'login') {
      const identifier = String(body.identifier || body.email || body.phone || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!identifier) {
        return NextResponse.json({ success: false, error: 'Email or phone number is required' }, { status: 400 });
      }
      if (!password) {
        return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
      }

      const customer = db.prepare('SELECT * FROM customers WHERE LOWER(email) = ? OR phone = ?').get(identifier, identifier) as any;

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'No account found with this email/phone. Please create an account.' },
          { status: 404 }
        );
      }

      if (!customer.password_hash) {
        return NextResponse.json(
          { success: false, error: 'Account has no password set yet. Please switch to "Create Account" to activate your password.' },
          { status: 400 }
        );
      }

      const passwordValid = verifyPassword(password, customer.password_hash);
      if (!passwordValid) {
        return NextResponse.json({ success: false, error: 'Incorrect password. Please try again.' }, { status: 401 });
      }

      const payload = {
        id: customer.id,
        name: customer.name,
        email: customer.email || identifier,
        phone: customer.phone,
        college_name: customer.college_name,
        department: customer.department,
        batch: customer.batch,
        role: 'customer' as const,
      };

      const token = createCustomerToken(payload, 30);

      logActivity(
        customer.name,
        'Customer',
        'Customer Logged In',
        'customer',
        customer.id,
        `Coordinator logged in: ${customer.email}`,
        ip
      );

      const response = NextResponse.json({
        success: true,
        user: payload,
        token,
        message: 'Logged in successfully',
      });

      response.cookies.set({
        name: 'jkempress_customer_session',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Choose signup or login.' }, { status: 400 });
  } catch (err: any) {
    console.error('Customer auth error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Authentication error' }, { status: 500 });
  }
}

// DELETE /api/auth/customer - Logout customer
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set({
    name: 'jkempress_customer_session',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
