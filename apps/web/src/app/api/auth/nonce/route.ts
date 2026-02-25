import { NextRequest, NextResponse } from 'next/server';
import { generateNonce, generateSignInMessage } from '@/lib/auth';
import redis from '@/lib/redis';
import { REDIS_PREFIX } from '@shared/types';

/**
 * GET /api/auth/nonce
 * Generate a nonce for wallet sign-in
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { success: false, error: 'address is required' },
      { status: 400 }
    );
  }

  const normalizedAddress = address.toLowerCase();
  const nonce = generateNonce();
  const message = generateSignInMessage(address, nonce);

  await redis.set(`${REDIS_PREFIX}nonce:${normalizedAddress}`, nonce, 'EX', 600);

  return NextResponse.json({
    success: true,
    data: {
      nonce,
      message,
    },
  });
}
