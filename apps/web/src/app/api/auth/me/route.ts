import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/me
 * Get current user session
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json({
      success: true,
      data: { authenticated: false },
    });
  }

  // Get user and creator profile
  const user = await prisma.user.findUnique({
    where: { wallet: auth.wallet },
    include: {
      creatorProfile: true,
    },
  });

  if (!user) {
    return NextResponse.json({
      success: true,
      data: { authenticated: false },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      authenticated: true,
      wallet: auth.wallet,
      isCreator: !!user.creatorProfile,
      creatorProfile: user.creatorProfile
        ? {
            xUsername: user.creatorProfile.xUsername,
            displayName: user.creatorProfile.displayName,
            avatarUrl: user.creatorProfile.avatarUrl,
            verified: user.creatorProfile.verified,
          }
        : null,
    },
  });
}
