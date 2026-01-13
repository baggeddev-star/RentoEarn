import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/campaigns/[id]/claim
 * Creator claims funds after campaign expires
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

  if (campaign.creatorWallet !== auth.wallet) {
    return NextResponse.json(
      { success: false, error: 'Only creator can claim' },
      { status: 403 }
    );
  }

  if (campaign.status !== 'EXPIRED') {
    return NextResponse.json(
      { success: false, error: 'Campaign must be EXPIRED to claim' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { txSignature } = body;

  if (!txSignature) {
    return NextResponse.json(
      { success: false, error: 'Transaction signature required' },
      { status: 400 }
    );
  }

  // Update campaign with claim info
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      status: 'CLAIMED',
      claimTxSig: txSignature,
    },
  });

  // Create notification for sponsor
  await prisma.notification.create({
    data: {
      wallet: campaign.sponsorWallet,
      type: 'CAMPAIGN_CLAIMED',
      title: 'Campaign Completed',
      body: 'The creator has claimed their earnings. Campaign is now complete.',
      metadata: JSON.stringify({ campaignId: id }),
    },
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
