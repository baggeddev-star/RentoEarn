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
 * POST /api/campaigns/[id]/retry-verify
 * Re-trigger verification for campaigns stuck in VERIFYING status
 * Can be called by either sponsor or creator
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

  // Only sponsor or creator can retry
  if (campaign.creatorWallet !== auth.wallet && campaign.sponsorWallet !== auth.wallet) {
    return NextResponse.json(
      { success: false, error: 'Only sponsor or creator can retry verification' },
      { status: 403 }
    );
  }

  if (campaign.status !== 'VERIFYING') {
    return NextResponse.json(
      { success: false, error: 'Campaign must be in VERIFYING status to retry' },
      { status: 400 }
    );
  }

  // Reset timeout and re-enqueue job
  await prisma.campaign.update({
    where: { id },
    data: {
      applyTimeoutAt: new Date(Date.now() + 30 * 60 * 1000), // Reset 30 minute timeout
    },
  });

  // Enqueue verification job
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
        attempts: 1,
        removeOnComplete: 100,
        removeOnFail: 100,
      }
    );

    await verifyQueue.close();

    console.log(`[RetryVerify] Re-queued verification for campaign ${id}`);
  } catch (error) {
    console.error('Failed to enqueue verification job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to queue verification job' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      message: 'Verification job re-queued. Check back in a minute.',
      campaignId: id,
    },
  });
}
