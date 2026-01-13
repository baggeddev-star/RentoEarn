import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/campaigns/[id]/reject
 * Creator rejects the campaign - triggers refund
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
      { success: false, error: 'Only creator can reject' },
      { status: 403 }
    );
  }

  if (campaign.status !== 'DEPOSITED') {
    return NextResponse.json(
      { success: false, error: 'Campaign must be in DEPOSITED status to reject' },
      { status: 400 }
    );
  }

  // Update campaign status - will trigger on-chain refund
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      status: 'CANCELED_HARD',
      hardCancelAt: new Date(),
      hardCancelReason: 'Creator rejected the campaign',
    },
  });

  // Create notification for sponsor
  await prisma.notification.create({
    data: {
      wallet: campaign.sponsorWallet,
      type: 'CAMPAIGN_REJECTED',
      title: 'Campaign Rejected',
      body: 'The creator has rejected your campaign. Your funds will be refunded.',
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
