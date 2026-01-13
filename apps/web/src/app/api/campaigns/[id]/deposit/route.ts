import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/campaigns/[id]/deposit
 * Record deposit transaction signature and update status
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

  if (campaign.sponsorWallet !== auth.wallet) {
    return NextResponse.json(
      { success: false, error: 'Only sponsor can deposit' },
      { status: 403 }
    );
  }

  if (campaign.status !== 'DRAFT' && campaign.status !== 'DEPOSIT_PENDING') {
    return NextResponse.json(
      { success: false, error: 'Invalid campaign status for deposit' },
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

  // Update campaign with deposit info
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      status: 'DEPOSITED',
      depositTxSig: txSignature,
    },
  });

  // Create notification for creator
  await prisma.notification.create({
    data: {
      wallet: campaign.creatorWallet,
      type: 'CAMPAIGN_DEPOSITED',
      title: 'Campaign Funded',
      body: 'A sponsor has deposited funds for your slot. Please review and approve.',
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
