import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/campaigns/[id]/bio
 * Sponsor sets the required bio text for a BIO campaign
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
      { success: false, error: 'Only sponsor can set bio text' },
      { status: 403 }
    );
  }

  if (campaign.slotType !== 'BIO') {
    return NextResponse.json(
      { success: false, error: 'This is not a BIO campaign' },
      { status: 400 }
    );
  }

  if (campaign.status !== 'APPROVAL_PENDING') {
    return NextResponse.json(
      { success: false, error: 'Campaign must be in APPROVAL_PENDING status' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { bioText } = body;

  if (!bioText || typeof bioText !== 'string' || bioText.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'Bio text is required' },
      { status: 400 }
    );
  }

  if (bioText.trim().length > 280) {
    return NextResponse.json(
      { success: false, error: 'Bio text must be 280 characters or less' },
      { status: 400 }
    );
  }

  // Update campaign with bio text
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      requiredBioSubstring: bioText.trim(),
    },
  });

  // Create notification for creator
  await prisma.notification.create({
    data: {
      wallet: campaign.creatorWallet,
      type: 'CAMPAIGN_APPROVED',
      title: 'Bio Text Set',
      body: 'The sponsor has set the required bio text. Please add it to your X bio.',
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
