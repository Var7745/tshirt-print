import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public auth endpoints
  if (
    pathname === '/api/admin/auth/login' ||
    pathname === '/api/admin/auth/forgot-password'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('jkempress_admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = sessionCookie || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null);

  // A valid session token is a 3-part signed JWT: header.payload.signature
  const hasValidTokenFormat = Boolean(token && token.split('.').length === 3);

  // 2. Protect /api/admin/* endpoints
  if (pathname.startsWith('/api/admin')) {
    if (!hasValidTokenFormat) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin authentication required' },
        { status: 401 }
      );
    }
  }

  // 3. Protect /admin/* frontend pages
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';

    if (!hasValidTokenFormat && !isLoginPage) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (hasValidTokenFormat && isLoginPage) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
