import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getAuthFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getXProvider } from '@/lib/x-provider';

/**
 * POST /api/x/link-twitter
 * Link Twitter account (from NextAuth session) with EVM wallet
 * This creates/updates the CreatorProfile with verified status
 */
export async function POST(request: NextRequest) {
  // 1. Check wallet auth (EVM signature)
  const walletAuth = await getAuthFromRequest(request);
  if (!walletAuth) {
    return NextResponse.json(
      { success: false, error: 'Wallet authentication required. Please sign in with your wallet first.' },
      { status: 401 }
    );
  }

  // 2. Check Twitter session (NextAuth)
  const twitterSession = await getServerSession(authOptions);
  if (!twitterSession?.twitterUsername || !twitterSession?.twitterId) {
    return NextResponse.json(
      { success: false, error: 'Twitter authentication required. Please sign in with Twitter first.' },
      { status: 401 }
    );
  }

  const { twitterUsername, twitterId, twitterName, twitterImage } = twitterSession;
  const normalizedUsername = twitterUsername.toLowerCase();

  try {
    // 3. Check if this Twitter account is already linked to another wallet
    const existingProfile = await prisma.creatorProfile.findFirst({
      where: {
        OR: [
          { xUsername: normalizedUsername },
          { xUserId: twitterId },
        ],
      },
    });

    if (existingProfile && existingProfile.wallet !== walletAuth.wallet) {
      return NextResponse.json(
        { 
          success: false, 
          error: `This Twitter account (@${normalizedUsername}) is already linked to another wallet.` 
        },
        { status: 400 }
      );
    }

    // 4. Fetch additional profile data from RapidAPI (for header image, full bio)
    let avatarUrl = twitterImage?.replace('_normal', '_400x400') || null;
    let displayName = twitterName || normalizedUsername;
    let followersCount: number | null = null;
    
    try {
      const xProvider = getXProvider();
      const snapshot = await xProvider.fetchSnapshot(normalizedUsername);
      avatarUrl = snapshot.avatarUrl || avatarUrl;
      displayName = snapshot.displayName || displayName;
      followersCount = snapshot.followersCount ?? null;
    } catch (error) {
      console.warn('[LinkTwitter] Failed to fetch additional profile data:', error);
      // Continue with data from Twitter OAuth
    }

    // 5. Create or update CreatorProfile
    const profile = await prisma.creatorProfile.upsert({
      where: { wallet: walletAuth.wallet },
      update: {
        xUsername: normalizedUsername,
        xUserId: twitterId,
        displayName,
        avatarUrl,
        followersCount,
        verified: true, // Twitter OAuth = verified
        verifyCode: null, // Clear any old verification code
      },
      create: {
        wallet: walletAuth.wallet,
        xUsername: normalizedUsername,
        xUserId: twitterId,
        displayName,
        avatarUrl,
        followersCount,
        verified: true,
      },
    });

    // 6. Log the verification event
    await prisma.activityEvent.create({
      data: {
        type: 'TWITTER_VERIFIED',
        metadataJson: JSON.stringify({
          wallet: walletAuth.wallet,
          xUsername: normalizedUsername,
          xUserId: twitterId,
          method: 'oauth',
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        xUsername: profile.xUsername,
        xUserId: profile.xUserId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        followersCount: profile.followersCount,
      },
    });
  } catch (error) {
    console.error('[LinkTwitter] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to link Twitter account. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/x/link-twitter
 * Check current link status
 */
export async function GET(request: NextRequest) {
  const walletAuth = await getAuthFromRequest(request);
  const twitterSession = await getServerSession(authOptions);

  return NextResponse.json({
    success: true,
    data: {
      walletConnected: !!walletAuth,
      wallet: walletAuth?.wallet || null,
      twitterConnected: !!twitterSession?.twitterUsername,
      twitterUsername: twitterSession?.twitterUsername || null,
      twitterId: twitterSession?.twitterId || null,
    },
  });
}
