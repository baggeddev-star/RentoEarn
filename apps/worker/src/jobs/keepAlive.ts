import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import { DEFAULT_HASH_MAX_DISTANCE } from '@shared/types';
import type { KeepAliveJobPayload } from '@shared/types';
import { verifyHeader } from '../lib/verification';
import { notifyHardCancel } from '../lib/notifications';
import { keepAliveQueue, expiryQueue } from '../queues';

const prisma = new PrismaClient();

// RapidAPI configuration for twitter241
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'twitter241.p.rapidapi.com';
const USE_MOCK = process.env.X_PROVIDER === 'mock';
const X_PROVIDER_URL = process.env.X_PROVIDER_URL || 'http://localhost:3000/api/dev/x-sim';

interface XSnapshot {
  headerImageUrl: string | null;
  bioText: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Twitter241Response {
  result?: {
    data?: {
      user?: {
        result?: {
          rest_id: string;
          avatar?: { image_url: string };
          core?: { name: string; screen_name: string };
          legacy?: {
            description: string;
            profile_banner_url?: string;
            profile_image_url_https?: string;
            name?: string;
          };
        };
      };
    };
  };
  error?: string;
  message?: string;
}

async function fetchXSnapshot(username: string): Promise<XSnapshot> {
  const normalizedUsername = username.replace('@', '').toLowerCase();
  
  // Use mock provider in development
  if (USE_MOCK || !RAPIDAPI_KEY) {
    const response = await fetch(`${X_PROVIDER_URL}?username=${encodeURIComponent(normalizedUsername)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch X snapshot: ${response.status}`);
    }
    const data = await response.json();
    return data.data?.state || data.data;
  }

  // Use RapidAPI in production
  const response = await fetch(
    `https://${RAPIDAPI_HOST}/user?username=${encodeURIComponent(normalizedUsername)}`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
  }

  const data: Twitter241Response = await response.json();

  if (data.error || data.message) {
    throw new Error(data.error || data.message || 'Unknown API error');
  }

  const userResult = data.result?.data?.user?.result;
  if (!userResult) {
    throw new Error(`User @${normalizedUsername} not found`);
  }

  const legacy = userResult.legacy;
  const core = userResult.core;
  const avatar = userResult.avatar;

  return {
    headerImageUrl: legacy?.profile_banner_url || null,
    bioText: legacy?.description || '',
    displayName: core?.name || legacy?.name || normalizedUsername,
    avatarUrl: avatar?.image_url?.replace('_normal', '_400x400') || 
               legacy?.profile_image_url_https?.replace('_normal', '_400x400') || 
               null,
  };
}

/**
 * Remove all scheduled jobs for a campaign after hard cancel.
 */
async function removeScheduledJobs(campaignId: string) {
  // Remove keep-alive jobs
  const keepAliveJobs = await keepAliveQueue.getJobs(['delayed', 'waiting']);
  for (const job of keepAliveJobs) {
    if (job.data.campaignId === campaignId) {
      await job.remove();
    }
  }

  // Remove expiry job
  try {
    const expiryJob = await expiryQueue.getJob(`expiry-${campaignId}`);
    if (expiryJob) {
      await expiryJob.remove();
    }
  } catch (e) {
    // Job might not exist
  }
}

/**
 * Keep-alive verification job - runs 7 times per day for LIVE campaigns
 * ONE mismatch = IMMEDIATE HARD CANCEL
 * 
 * NON-NEGOTIABLE RULE:
 * - Single mismatch triggers hard cancel
 * - No pause, no grace window, no partial payout
 * - All funds refunded to sponsor
 */
export async function processKeepAliveJob(job: Job<KeepAliveJobPayload>) {
  const { campaignId, checkNumber } = job.data;

  console.log(`[KeepAlive] Campaign ${campaignId} - Check #${checkNumber}`);

  // Fetch campaign
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      listing: {
        include: {
          creator: true,
        },
      },
    },
  });

  if (!campaign) {
    console.log(`[KeepAlive] Campaign ${campaignId} not found`);
    return { success: false, reason: 'Campaign not found' };
  }

  // Only run for LIVE campaigns
  if (campaign.status !== 'LIVE') {
    console.log(`[KeepAlive] Campaign ${campaignId} is not LIVE (status: ${campaign.status})`);
    return { success: false, reason: 'Campaign not LIVE' };
  }

  // Check if campaign has expired
  if (campaign.endAt && new Date() > campaign.endAt) {
    console.log(`[KeepAlive] Campaign ${campaignId} has expired, skipping check`);
    return { success: false, reason: 'Campaign expired' };
  }

  // Get creator's X username
  const xUsername = campaign.listing?.creator?.xUsername;
  if (!xUsername) {
    console.log(`[KeepAlive] Campaign ${campaignId} - No X username found`);
    return { success: false, reason: 'No X username' };
  }

  // Fetch X snapshot
  let snapshot: XSnapshot;
  try {
    snapshot = await fetchXSnapshot(xUsername);
  } catch (error) {
    console.error(`[KeepAlive] Failed to fetch X snapshot:`, error);
    // On fetch error, we still need to be strict - treat as potential mismatch
    // But give one more chance by not hard canceling on network errors
    // In production, you might want to retry or have a separate error handling strategy
    return { success: false, reason: 'X fetch error' };
  }

  // Verify based on slot type
  let result: { match: boolean; hashDistance: number; headerUrl: string | null; expectedHash: string; actualHash: string; notes: string };
  const maxDistance = parseInt(process.env.HASH_MAX_DISTANCE || String(DEFAULT_HASH_MAX_DISTANCE));
  
  if (campaign.slotType === 'HEADER') {
    // Verify header image using perceptual hash
    result = await verifyHeader(snapshot.headerImageUrl, campaign.expectedHash!, maxDistance);
  } else {
    // Verify bio text using substring match
    const bioMatch = campaign.requiredBioSubstring 
      ? snapshot.bioText.toLowerCase().includes(campaign.requiredBioSubstring.toLowerCase())
      : false;
    
    result = {
      match: bioMatch,
      hashDistance: bioMatch ? 0 : -1,
      headerUrl: null,
      expectedHash: campaign.requiredBioSubstring || '',
      actualHash: snapshot.bioText.slice(0, 280),
      notes: bioMatch 
        ? `Bio contains required text: "${campaign.requiredBioSubstring}"`
        : `Bio missing required text: "${campaign.requiredBioSubstring}"`,
    };
  }

  // Log verification
  await prisma.verificationLog.create({
    data: {
      campaignId,
      headerOk: result.match,
      hashDistance: result.hashDistance,
      headerUrl: result.headerUrl,
      expectedHash: result.expectedHash,
      actualHash: result.actualHash,
      notes: `Keep-alive check #${checkNumber}: ${result.notes}`,
    },
  });

  // Update last checked
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { lastCheckedAt: new Date() },
  });

  console.log(`[KeepAlive] Campaign ${campaignId} - Match: ${result.match}, Distance: ${result.hashDistance}`);

  // ========================================
  // HARD CANCEL LOGIC - ONE STRIKE AND OUT
  // ========================================
  if (!result.match) {
    console.log(`[KeepAlive] ⚠️ HARD CANCEL TRIGGERED for campaign ${campaignId}`);
    
    const hardCancelReason = campaign.slotType === 'HEADER'
      ? `Banner mismatch detected at check #${checkNumber}. Hash distance: ${result.hashDistance} (max allowed: ${maxDistance})`
      : `Bio text mismatch detected at check #${checkNumber}. Required text not found in bio.`;

    // 1. Update DB status immediately
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'CANCELED_HARD',
        hardCancelAt: new Date(),
        hardCancelReason,
      },
    });

    // 2. Remove all scheduled jobs
    await removeScheduledJobs(campaignId);

    // 3. Trigger on-chain refund
    // In production, this would call the Anchor program
    // For now, we log and the refund would be triggered by a separate process
    console.log(`[KeepAlive] Would call platform_hard_cancel_and_refund for campaign ${campaign.chainCampaignId}`);
    console.log(`[KeepAlive] Sponsor wallet: ${campaign.sponsorWallet}`);
    console.log(`[KeepAlive] Amount to refund: ${campaign.amountLamports} lamports`);

    // 4. Notify both parties
    await notifyHardCancel(
      campaignId,
      campaign.sponsorWallet,
      campaign.creatorWallet,
      hardCancelReason
    );

    // 5. Create activity event for audit
    await prisma.activityEvent.create({
      data: {
        type: 'HARD_CANCEL',
        metadataJson: JSON.stringify({
          campaignId,
          checkNumber,
          hashDistance: result.hashDistance,
          maxDistance,
          headerUrl: result.headerUrl,
          expectedHash: result.expectedHash,
          actualHash: result.actualHash,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return {
      success: true,
      status: 'CANCELED_HARD',
      reason: hardCancelReason,
    };
  }

  // Match successful - campaign continues
  console.log(`[KeepAlive] Campaign ${campaignId} - Check #${checkNumber} PASSED`);

  return {
    success: true,
    status: 'LIVE',
    checkNumber,
    hashDistance: result.hashDistance,
  };
}
