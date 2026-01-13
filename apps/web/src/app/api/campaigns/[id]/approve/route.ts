import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/campaigns/[id]/approve
 * Creator approves the campaign
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
      { success: false, error: 'Only creator can approve' },
      { status: 403 }
    );
  }

  if (campaign.status !== 'DEPOSITED') {
    return NextResponse.json(
      { success: false, error: 'Campaign must be in DEPOSITED status to approve' },
      { status: 400 }
    );
  }

  // Update campaign status
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      status: 'APPROVAL_PENDING', // Waiting for on-chain confirmation
    },
  });

  // Create notification for sponsor
  await prisma.notification.create({
    data: {
      wallet: campaign.sponsorWallet,
      type: 'CAMPAIGN_APPROVED',
      title: 'Campaign Approved',
      body: 'The creator has approved your campaign. Please upload your banner creative.',
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
