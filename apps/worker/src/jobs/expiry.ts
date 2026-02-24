import { Job } from 'bullmq';
import type { ExpiryJobPayload } from '@shared/types';
import { notifyCampaignExpired } from '../lib/notifications';
import { prisma } from '../lib/prisma';

/**
 * Expiry job - runs when campaign duration ends
 * Marks campaign as EXPIRED so creator can claim
 */
export async function processExpiryJob(job: Job<ExpiryJobPayload>) {
  const { campaignId } = job.data;

  console.log(`[Expiry] Processing campaign ${campaignId}`);

  // Fetch campaign
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    console.log(`[Expiry] Campaign ${campaignId} not found`);
    return { success: false, reason: 'Campaign not found' };
  }

  // Only process LIVE campaigns
  if (campaign.status !== 'LIVE') {
    console.log(`[Expiry] Campaign ${campaignId} is not LIVE (status: ${campaign.status})`);
    return { success: false, reason: 'Campaign not LIVE' };
  }

  // Verify end time has passed
  if (campaign.endAt && new Date() < campaign.endAt) {
    console.log(`[Expiry] Campaign ${campaignId} has not ended yet`);
    return { success: false, reason: 'Campaign not ended' };
  }

  console.log(`[Expiry] Campaign ${campaignId} - Marking as EXPIRED`);

  // Update to EXPIRED
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'EXPIRED',
    },
  });

  // In production, would call platform_set_expired on-chain
  console.log(`[Expiry] Would call platform_set_expired for campaign ${campaign.chainCampaignId}`);

  // Notify creator they can claim
  await notifyCampaignExpired(campaignId, campaign.creatorWallet);

  // Create activity event
  await prisma.activityEvent.create({
    data: {
      type: 'CAMPAIGN_EXPIRED',
      metadataJson: JSON.stringify({
        campaignId,
        chainCampaignId: campaign.chainCampaignId?.toString(),
        creatorWallet: campaign.creatorWallet,
        sponsorWallet: campaign.sponsorWallet,
        amountLamports: campaign.amountLamports.toString(),
        startAt: campaign.startAt?.toISOString(),
        endAt: campaign.endAt?.toISOString(),
        timestamp: new Date().toISOString(),
      }),
    },
  });

  return {
    success: true,
    status: 'EXPIRED',
  };
}
