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
  const publicKey = searchParams.get('publicKey');

  if (!publicKey) {
    return NextResponse.json(
      { success: false, error: 'publicKey is required' },
      { status: 400 }
    );
  }

  const nonce = generateNonce();
  const message = generateSignInMessage(publicKey, nonce);

  // Store nonce in Redis with 10 minute expiry
  await redis.set(`${REDIS_PREFIX}nonce:${publicKey}`, nonce, 'EX', 600);

  return NextResponse.json({
    success: true,
    data: {
      nonce,
      message,
    },
  });
}
