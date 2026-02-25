import { NextRequest, NextResponse } from 'next/server';
import {
  verifySignature,
  parseSignInMessage,
  createSessionToken,
  createSessionCookie,
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis';
import { REDIS_PREFIX } from '@shared/types';
import { getAddress } from 'viem';

interface SignInBody {
  message: string;
  signature: string;
  address: string;
}

/**
 * POST /api/auth/signin
 * Verify wallet signature and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body: SignInBody = await request.json();
    const { message, signature, address } = body;

    if (!message || !signature || !address) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const checksumAddress = getAddress(address);
    const normalizedAddress = address.toLowerCase();

    const parsed = parseSignInMessage(message);
    if (!parsed.valid || getAddress(parsed.address || '').toLowerCase() !== normalizedAddress) {
      return NextResponse.json(
        { success: false, error: 'Invalid message format' },
        { status: 400 }
      );
    }

    const storedNonce = await redis.get(`${REDIS_PREFIX}nonce:${normalizedAddress}`);
    if (!storedNonce || storedNonce !== parsed.nonce) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired nonce' },
        { status: 400 }
      );
    }

    const isValid = await verifySignature(message, signature as `0x${string}`, checksumAddress);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    await redis.del(`${REDIS_PREFIX}nonce:${normalizedAddress}`);

    await prisma.user.upsert({
      where: { wallet: checksumAddress },
      update: { updatedAt: new Date() },
      create: { wallet: checksumAddress },
    });

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { wallet: checksumAddress },
    });

    const token = await createSessionToken(checksumAddress);

    const response = NextResponse.json({
      success: true,
      data: {
        wallet: checksumAddress,
        isCreator: !!creatorProfile,
        creatorProfile: creatorProfile
          ? {
              xUsername: creatorProfile.xUsername,
              displayName: creatorProfile.displayName,
              avatarUrl: creatorProfile.avatarUrl,
              verified: creatorProfile.verified,
            }
          : null,
      },
    });

    response.headers.set('Set-Cookie', createSessionCookie(token));

    return response;
  } catch (error) {
    console.error('Sign-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
