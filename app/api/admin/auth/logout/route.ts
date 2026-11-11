import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { logActivity } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = verifyAdminSession(req);
  if (session.valid && session.user) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    logActivity(session.user.name, session.user.role, 'Admin Logout', 'auth', session.user.id, 'User logged out', ip);
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.set('jkempress_admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
