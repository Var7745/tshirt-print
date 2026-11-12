import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export interface AdminUserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface TokenPayload extends AdminUserPayload {
  iat: number;
  exp: number;
}

/**
 * Retrieves or initializes the persistent server session secret.
 * Stored in SQLite business_settings so that restarts do not invalidate active sessions.
 */
export function getSessionSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 32) {
    return process.env.ADMIN_SESSION_SECRET;
  }

  try {
    const db = getDb();
    const row = db.prepare('SELECT value FROM business_settings WHERE key = ?').get('admin_session_secret') as { value: string } | undefined;
    if (row && row.value) {
      return row.value;
    }

    const generated = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();
    db.prepare('INSERT OR REPLACE INTO business_settings (key, value, updated_at) VALUES (?, ?, ?)')
      .run('admin_session_secret', generated, now);
    return generated;
  } catch {
    // Fallback if db is temporarily locked
    return 'jkempress_secure_fallback_secret_key_8492048102938475829102';
  }
}

/**
 * Hashes a plaintext password using Node.js scrypt with unique 16-byte random salt.
 * Format: scrypt$16384$8$1$<salt_hex>$<derived_key_hex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  });
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Constant-time password verification supporting scrypt and seamless initial migration.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 6) return false;
    const [, N, r, p, salt, hashHex] = parts;

    try {
      const derivedKey = crypto.scryptSync(password, salt, 64, {
        N: parseInt(N, 10),
        r: parseInt(r, 10),
        p: parseInt(p, 10),
        maxmem: 32 * 1024 * 1024,
      });
      const expected = Buffer.from(hashHex, 'hex');
      if (derivedKey.length !== expected.length) return false;
      return crypto.timingSafeEqual(derivedKey, expected);
    } catch {
      return false;
    }
  }

  // Fallback for initial unmigrated plaintext password during migration
  if (storedHash === password) {
    return true;
  }

  return false;
}

/**
 * Base64URL encoder/decoder
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs and generates a tamper-proof HMAC-SHA256 session token.
 */
export function createSessionToken(user: AdminUserPayload, expiresInDays: number = 7): string {
  const secret = getSessionSecret();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    ...user,
    iat: now,
    exp: now + (expiresInDays * 24 * 60 * 60),
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

/**
 * Verifies a token's HMAC-SHA256 cryptographic signature and expiry.
 */
export function verifySessionToken(token: string): { valid: boolean; payload?: TokenPayload; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token missing' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid token structure' };
  }

  const [headerB64, payloadB64, signature] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const secret = getSessionSecret();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return { valid: false, error: 'Cryptographic signature mismatch' };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as TokenPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Session expired' };
    }

    if (!payload.id || !payload.email || !payload.role) {
      return { valid: false, error: 'Malformed token payload' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Failed to decode token payload' };
  }
}

/**
 * Extracts the admin session token from cookies or Authorization Bearer header.
 */
export function extractTokenFromRequest(req: Request | NextRequest): string | null {
  // Check Authorization header first
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Check cookies
  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    const cookie = (req as any).cookies.get('jkempress_admin_session');
    if (cookie?.value) return cookie.value;
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/jkempress_admin_session=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Verifies admin session against token cryptography and live database status.
 */
export function verifyAdminSession(req: Request | NextRequest): {
  valid: boolean;
  user?: AdminUserPayload;
  error?: string;
  status: 200 | 401 | 403;
} {
  const token = extractTokenFromRequest(req);
  if (!token) {
    return { valid: false, error: 'No session token provided', status: 401 };
  }

  const tokenResult = verifySessionToken(token);
  if (!tokenResult.valid || !tokenResult.payload) {
    return { valid: false, error: tokenResult.error || 'Invalid session', status: 401 };
  }

  try {
    const db = getDb();
    const userRow = db.prepare('SELECT id, email, name, role, phone, avatar_url, status FROM admin_users WHERE id = ?')
      .get(tokenResult.payload.id) as any;

    if (!userRow) {
      return { valid: false, error: 'Admin user no longer exists', status: 401 };
    }

    if (userRow.status !== 'active') {
      return { valid: false, error: 'Account is suspended', status: 403 };
    }

    return {
      valid: true,
      user: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        role: userRow.role,
        phone: userRow.phone,
        avatar_url: userRow.avatar_url,
      },
      status: 200,
    };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Database error during auth', status: 401 };
  }
}

/**
 * Guard utility for Route Handlers. Returns an unauthorized NextResponse or authorized user.
 */
export function requireAdminAuth(req: Request | NextRequest, requiredRole?: string): {
  authorized: boolean;
  user?: AdminUserPayload;
  response?: NextResponse;
} {
  const result = verifyAdminSession(req);

  if (!result.valid || !result.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: result.error || 'Authentication required' },
        { status: result.status }
      ),
    };
  }

  if (requiredRole && result.user.role !== requiredRole && result.user.role !== 'Admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: `Forbidden: Requires ${requiredRole} privileges` },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: result.user,
  };
}
