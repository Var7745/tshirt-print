import { NextResponse } from 'next/server';
import { queryOne, execute, logActivity, checkRateLimit } from '@/lib/db';
import { verifyPassword, hashPassword, createSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting (5 attempts per 15 minutes)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimitKey = `login_${ip}`;
    const limitCheck = checkRateLimit(rateLimitKey, 5, 900);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many login attempts. Please try again in ${Math.ceil(limitCheck.resetInSeconds / 60)} minutes.`,
        },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both email and password' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = queryOne(
      'SELECT id, email, password_hash, name, role, phone, avatar_url, status FROM admin_users WHERE email = ?',
      [cleanEmail]
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Your admin account has been suspended' },
        { status: 403 }
      );
    }

    // 2. Cryptographic Password Verification
    const isPasswordValid = verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. Automatic Migration: If stored password was plaintext, upgrade to scrypt hash immediately
    if (!user.password_hash.startsWith('scrypt$')) {
      const newHash = hashPassword(password);
      execute('UPDATE admin_users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
    }

    // 4. Update last login timestamp
    const now = new Date().toISOString();
    execute('UPDATE admin_users SET last_login_at = ? WHERE id = ?', [now, user.id]);

    // 5. Audit Logging
    logActivity(user.name, user.role, 'Admin Login', 'auth', user.id, 'User authenticated via web console', ip);

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatar_url: user.avatar_url,
    };

    // 6. Cryptographically Signed Session Token (HMAC-SHA256)
    const token = createSessionToken(safeUser, 7);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: safeUser,
      token,
    });

    // 7. Secure HttpOnly Cookie
    response.cookies.set('jkempress_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
