import { NextRequest, NextResponse } from 'next/server';
import { createLogoutCookie } from '@/lib/auth';

/**
 * POST /api/auth/signout
 * Sign out and clear session
 */
export async function POST(_request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    data: { message: 'Signed out successfully' },
  });

  response.headers.set('Set-Cookie', createLogoutCookie());

  return response;
}
