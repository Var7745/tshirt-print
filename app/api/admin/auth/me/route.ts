import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const result = verifyAdminSession(req);

  if (!result.valid || !result.user) {
    return NextResponse.json(
      { authenticated: false, user: null, error: result.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({ authenticated: true, user: result.user });
}
