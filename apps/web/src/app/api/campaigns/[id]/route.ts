import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/campaigns/[id]
 * Get a single campaign with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      listing: {
        include: {
          creator: {
            select: {
              xUsername: true,
              displayName: true,
              avatarUrl: true,
              verified: true,
            },
          },
        },
      },
      request: true,
      verificationLogs: {
        orderBy: { checkedAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!campaign) {
    return NextResponse.json(
      { success: false, error: 'Campaign not found' },
      { status: 404 }
    );
  }

  // Serialize BigInt
  const serialized = {
    ...campaign,
    chainCampaignId: campaign.chainCampaignId?.toString() || null,
    amountLamports: campaign.amountLamports.toString(),
    listing: campaign.listing
      ? {
          ...campaign.listing,
          price24hLamports: campaign.listing.price24hLamports.toString(),
          price7dLamports: campaign.listing.price7dLamports.toString(),
          price30dLamports: campaign.listing.price30dLamports.toString(),
        }
      : null,
    request: campaign.request
      ? {
          ...campaign.request,
          amountLamports: campaign.request.amountLamports.toString(),
        }
      : null,
  };

  return NextResponse.json({
    success: true,
    data: serialized,
  });
}

/**
 * PATCH /api/campaigns/[id]
 * Update campaign (limited fields, mainly for status transitions)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    return NextResponse.json(
      { success: false, error: 'Campaign not found' },
      { status: 404 }
    );
  }

  // Only sponsor or creator can update
  if (campaign.sponsorWallet !== auth.wallet && campaign.creatorWallet !== auth.wallet) {
    return NextResponse.json(
      { success: false, error: 'Not authorized' },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Limited updates allowed
  const allowedUpdates: Record<string, unknown> = {};

  if (body.expectedBannerUrl !== undefined) {
    allowedUpdates.expectedBannerUrl = body.expectedBannerUrl;
  }
  if (body.expectedSha256 !== undefined) {
    allowedUpdates.expectedSha256 = body.expectedSha256;
  }
  if (body.expectedHash !== undefined) {
    allowedUpdates.expectedHash = body.expectedHash;
  }
  if (body.depositTxSig !== undefined) {
    allowedUpdates.depositTxSig = body.depositTxSig;
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: allowedUpdates,
  });

  return NextResponse.json({
    success: true,
    data: {
      ...updated,
      chainCampaignId: updated.chainCampaignId?.toString() || null,
      amountLamports: updated.amountLamports.toString(),
    },
  });
}
