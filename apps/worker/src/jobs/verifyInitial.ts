import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import {
  VERIFY_POLL_INTERVAL_MS,
  VERIFY_MAX_DURATION_MS,
  VERIFY_REQUIRED_CONSECUTIVE_MATCHES,
  DEFAULT_HASH_MAX_DISTANCE,
  KEEPALIVE_CHECKS_PER_DAY,
  KEEPALIVE_INTERVAL_MS,
  KEEPALIVE_JITTER_MS,
} from '@shared/types';
import type { VerifyInitialJobPayload, KeepAliveJobPayload } from '@shared/types';
import { verifyHeader, downloadImage, normalizeImage, computeDHash } from '../lib/verification';
import {
  notifyCampaignLive,
  notifyVerificationFailed,
} from '../lib/notifications';
import { verifyInitialQueue, keepAliveQueue, expiryQueue } from '../queues';

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
 * Initial verification job - runs after creator clicks "I applied it"
 * Polls every 60s for up to 30 minutes
 * Requires 2 consecutive matches to go LIVE
 */
export async function processVerifyInitialJob(job: Job<VerifyInitialJobPayload>) {
  const { campaignId, attempt, consecutiveMatches, startedAt } = job.data;

  console.log(`[VerifyInitial] Campaign ${campaignId} - Attempt ${attempt}, Consecutive: ${consecutiveMatches}`);

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
    console.log(`[VerifyInitial] Campaign ${campaignId} not found`);
    return { success: false, reason: 'Campaign not found' };
  }

  // Check if still in VERIFYING status
  if (campaign.status !== 'VERIFYING') {
    console.log(`[VerifyInitial] Campaign ${campaignId} no longer in VERIFYING status`);
    return { success: false, reason: 'Campaign status changed' };
  }

  // Check timeout
  const elapsed = Date.now() - startedAt;
  if (elapsed > VERIFY_MAX_DURATION_MS) {
    console.log(`[VerifyInitial] Campaign ${campaignId} verification timed out`);

    // Mark as failed
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'FAILED_VERIFICATION',
        lastCheckedAt: new Date(),
      },
    });

    // Notify both parties
    await notifyVerificationFailed(campaignId, campaign.sponsorWallet, campaign.creatorWallet);

    return { success: false, reason: 'Verification timeout' };
  }

  // Get creator's X username
  const xUsername = campaign.listing?.creator?.xUsername;
  if (!xUsername) {
    console.log(`[VerifyInitial] Campaign ${campaignId} - No X username found`);
    return { success: false, reason: 'No X username' };
  }

  // Fetch X snapshot
  let snapshot: XSnapshot;
  try {
    snapshot = await fetchXSnapshot(xUsername);
  } catch (error) {
    console.error(`[VerifyInitial] Failed to fetch X snapshot:`, error);
    // Re-enqueue for retry
    await verifyInitialQueue.add(
      'verify-initial',
      {
        campaignId,
        attempt: attempt + 1,
        consecutiveMatches: 0, // Reset on error
        startedAt,
      },
      { delay: VERIFY_POLL_INTERVAL_MS }
    );
    return { success: false, reason: 'X fetch error, retrying' };
  }

  // Verify based on slot type
  let result: { match: boolean; hashDistance: number; headerUrl: string | null; expectedHash: string; actualHash: string; notes: string };
  
  if (campaign.slotType === 'HEADER') {
    // Verify header image using perceptual hash
    const maxDistance = parseInt(process.env.HASH_MAX_DISTANCE || String(DEFAULT_HASH_MAX_DISTANCE));
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
      actualHash: snapshot.bioText.slice(0, 280), // Store first 280 chars of bio
      notes: bioMatch 
        ? `Bio contains required text: "${campaign.requiredBioSubstring}"`
        : `Bio missing required text: "${campaign.requiredBioSubstring}". Current bio: "${snapshot.bioText.slice(0, 100)}..."`,
    };
  }

  // Log verification attempt
  await prisma.verificationLog.create({
    data: {
      campaignId,
      headerOk: result.match,
      hashDistance: result.hashDistance,
      headerUrl: result.headerUrl,
      expectedHash: result.expectedHash,
      actualHash: result.actualHash,
      notes: result.notes,
    },
  });

  // Update last checked
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { lastCheckedAt: new Date() },
  });

  const newConsecutiveMatches = result.match ? consecutiveMatches + 1 : 0;

  console.log(`[VerifyInitial] Campaign ${campaignId} - Match: ${result.match}, Distance: ${result.hashDistance}, Consecutive: ${newConsecutiveMatches}`);

  // Check if we have enough consecutive matches
  if (newConsecutiveMatches >= VERIFY_REQUIRED_CONSECUTIVE_MATCHES) {
    console.log(`[VerifyInitial] Campaign ${campaignId} - VERIFICATION PASSED! Going LIVE`);

    const now = new Date();
    const endAt = new Date(now.getTime() + campaign.durationSeconds * 1000);

    // Update to LIVE
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'LIVE',
        startAt: now,
        endAt,
      },
    });

    // Notify both parties
    await notifyCampaignLive(campaignId, campaign.sponsorWallet, campaign.creatorWallet);

    // Schedule keep-alive checks
    const intervalMs = KEEPALIVE_INTERVAL_MS;
    for (let i = 1; i <= KEEPALIVE_CHECKS_PER_DAY * Math.ceil(campaign.durationSeconds / 86400); i++) {
      const jitter = Math.floor(Math.random() * KEEPALIVE_JITTER_MS);
      const delay = i * intervalMs + jitter;

      // Don't schedule past end time
      if (delay > campaign.durationSeconds * 1000) break;

      await keepAliveQueue.add(
        'keep-alive',
        { campaignId, checkNumber: i } as KeepAliveJobPayload,
        { delay, jobId: `keepalive-${campaignId}-${i}` }
      );
    }

    // Schedule expiry job
    await expiryQueue.add(
      'expiry',
      { campaignId },
      { delay: campaign.durationSeconds * 1000, jobId: `expiry-${campaignId}` }
    );

    return { success: true, status: 'LIVE' };
  }

  // Not enough matches yet - schedule next check
  await verifyInitialQueue.add(
    'verify-initial',
    {
      campaignId,
      attempt: attempt + 1,
      consecutiveMatches: newConsecutiveMatches,
      startedAt,
    },
    { delay: VERIFY_POLL_INTERVAL_MS }
  );

  return { success: true, status: 'VERIFYING', consecutiveMatches: newConsecutiveMatches };
}
