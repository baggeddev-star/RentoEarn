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

interface SignInBody {
  message: string;
  signature: string;
  publicKey: string;
}

/**
 * POST /api/auth/signin
 * Verify wallet signature and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body: SignInBody = await request.json();
    const { message, signature, publicKey } = body;

    if (!message || !signature || !publicKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse and validate message
    const parsed = parseSignInMessage(message);
    if (!parsed.valid || parsed.publicKey !== publicKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid message format' },
        { status: 400 }
      );
    }

    // Verify nonce from Redis
    const storedNonce = await redis.get(`${REDIS_PREFIX}nonce:${publicKey}`);
    if (!storedNonce || storedNonce !== parsed.nonce) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired nonce' },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = verifySignature(message, signature, publicKey);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Delete used nonce
    await redis.del(`${REDIS_PREFIX}nonce:${publicKey}`);

    // Upsert user in database
    await prisma.user.upsert({
      where: { wallet: publicKey },
      update: { updatedAt: new Date() },
      create: { wallet: publicKey },
    });

    // Check if user has a creator profile
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { wallet: publicKey },
    });

    // Create session token
    const token = await createSessionToken(publicKey);

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        wallet: publicKey,
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
