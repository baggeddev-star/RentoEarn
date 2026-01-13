import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import { Queue } from 'bullmq';
import redis from '@/lib/redis';
import { QUEUE_VERIFY_INITIAL } from '@shared/types';
import type { VerifyInitialJobPayload } from '@shared/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/campaigns/[id]/applied
 * Creator indicates they've applied the banner - triggers verification
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
    include: {
      listing: {
        include: {
          creator: true,
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json(
      { success: false, error: 'Campaign not found' },
      { status: 404 }
    );
  }

  if (campaign.creatorWallet !== auth.wallet) {
    return NextResponse.json(
      { success: false, error: 'Only creator can mark as applied' },
      { status: 403 }
    );
  }

  if (campaign.status !== 'APPROVAL_PENDING') {
    return NextResponse.json(
      { success: false, error: 'Campaign must be in APPROVAL_PENDING status' },
      { status: 400 }
    );
  }

  // Check based on slot type - HEADER needs banner hash, BIO needs bio substring
  if (campaign.slotType === 'HEADER' && !campaign.expectedHash) {
    return NextResponse.json(
      { success: false, error: 'Banner must be uploaded first' },
      { status: 400 }
    );
  }

  if (campaign.slotType === 'BIO' && !campaign.requiredBioSubstring) {
    return NextResponse.json(
      { success: false, error: 'Bio text must be set first' },
      { status: 400 }
    );
  }

  // Update campaign status to VERIFYING
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      status: 'VERIFYING',
      applyTimeoutAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minute timeout
    },
  });

  // Enqueue initial verification job
  try {
    const verifyQueue = new Queue<VerifyInitialJobPayload>(QUEUE_VERIFY_INITIAL, {
      connection: redis,
    });

    await verifyQueue.add(
      'verify-initial',
      {
        campaignId: id,
        attempt: 1,
        consecutiveMatches: 0,
        startedAt: Date.now(),
      },
      {
        delay: 0, // Start immediately
        attempts: 1, // Each job is a single attempt
        removeOnComplete: 100,
        removeOnFail: 100,
      }
    );

    await verifyQueue.close();
  } catch (error) {
    console.error('Failed to enqueue verification job:', error);
    // Don't fail the request - the job can be manually triggered
  }

  // Create notification for sponsor
  const notificationTitle = campaign.slotType === 'HEADER' ? 'Banner Applied' : 'Bio Text Applied';
  const notificationBody = campaign.slotType === 'HEADER' 
    ? 'The creator has applied your banner. Verification in progress.'
    : 'The creator has added your text to their bio. Verification in progress.';

  await prisma.notification.create({
    data: {
      wallet: campaign.sponsorWallet,
      type: 'CAMPAIGN_APPROVED',
      title: notificationTitle,
      body: notificationBody,
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
