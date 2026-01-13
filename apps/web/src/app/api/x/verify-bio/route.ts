import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getXProvider } from '@/lib/x-provider';
import { BIO_VERIFY_CODE_PREFIX } from '@shared/types';

/**
 * POST /api/x/verify-bio
 * Verify X account ownership via bio code
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { xUsername } = body;

  if (!xUsername) {
    return NextResponse.json(
      { success: false, error: 'X username required' },
      { status: 400 }
    );
  }

  // Check if username is already claimed
  const existing = await prisma.creatorProfile.findUnique({
    where: { xUsername: xUsername.toLowerCase().replace('@', '') },
  });

  if (existing && existing.wallet !== auth.wallet) {
    return NextResponse.json(
      { success: false, error: 'This X username is already claimed by another wallet' },
      { status: 400 }
    );
  }

  // Get or create creator profile with verify code
  let profile = await prisma.creatorProfile.findUnique({
    where: { wallet: auth.wallet },
  });

  const normalizedUsername = xUsername.toLowerCase().replace('@', '');
  const verifyCode = `${BIO_VERIFY_CODE_PREFIX}${auth.wallet.slice(0, 8)}`;

  if (!profile) {
    profile = await prisma.creatorProfile.create({
      data: {
        wallet: auth.wallet,
        xUsername: normalizedUsername,
        verifyCode,
        verified: false,
      },
    });
  } else if (!profile.verified || profile.xUsername !== normalizedUsername) {
    profile = await prisma.creatorProfile.update({
      where: { wallet: auth.wallet },
      data: {
        xUsername: normalizedUsername,
        verifyCode,
        verified: false,
      },
    });
  }

  // If already verified, return success
  if (profile.verified && profile.xUsername === normalizedUsername) {
    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        xUsername: profile.xUsername,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      },
    });
  }

  // Check if bio contains the verify code
  const xProvider = getXProvider();
  const verified = await xProvider.verifyBioCode(normalizedUsername, verifyCode);

  if (verified) {
    // Fetch full profile data
    const snapshot = await xProvider.fetchSnapshot(normalizedUsername);

    // Update profile as verified
    const updatedProfile = await prisma.creatorProfile.update({
      where: { wallet: auth.wallet },
      data: {
        verified: true,
        displayName: snapshot.displayName,
        avatarUrl: snapshot.avatarUrl,
        verifyCode: null, // Clear the code
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        xUsername: updatedProfile.xUsername,
        displayName: updatedProfile.displayName,
        avatarUrl: updatedProfile.avatarUrl,
      },
    });
  }

  // Not verified yet - return the code they need to add
  return NextResponse.json({
    success: true,
    data: {
      verified: false,
      verifyCode,
      message: `Add "${verifyCode}" to your X bio, then try again.`,
    },
  });
}
