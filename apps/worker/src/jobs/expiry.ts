import { Job } from 'bullmq';
import type { ExpiryJobPayload } from '@shared/types';
import { notifyCampaignExpired } from '../lib/notifications';
import { getWorkerEVMClient } from '../lib/evm';
import { prisma } from '../lib/prisma';

/**
 * Expiry job - runs when campaign duration ends
 * Marks campaign as EXPIRED so creator can claim
 */
export async function processExpiryJob(job: Job<ExpiryJobPayload>) {
  const { campaignId } = job.data;

  console.log(`[Expiry] Processing campaign ${campaignId}`);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    console.log(`[Expiry] Campaign ${campaignId} not found`);
    return { success: false, reason: 'Campaign not found' };
  }

  if (campaign.status !== 'LIVE') {
    console.log(`[Expiry] Campaign ${campaignId} is not LIVE (status: ${campaign.status})`);
    return { success: false, reason: 'Campaign not LIVE' };
  }

  if (campaign.endAt && new Date() < campaign.endAt) {
    console.log(`[Expiry] Campaign ${campaignId} has not ended yet`);
    return { success: false, reason: 'Campaign not ended' };
  }

  console.log(`[Expiry] Campaign ${campaignId} - Marking as EXPIRED`);

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'EXPIRED',
    },
  });

  try {
    const evmClient = getWorkerEVMClient();
    const chainCampaignId = BigInt(campaign.chainCampaignId || '0');
    
    console.log(`[Expiry] Calling platformSetExpired on-chain...`);
    const txHash = await evmClient.setExpired(chainCampaignId);
    console.log(`[Expiry] On-chain setExpired successful: ${txHash}`);
  } catch (onChainError) {
    console.error(`[Expiry] On-chain setExpired failed:`, onChainError);
  }

  await notifyCampaignExpired(campaignId, campaign.creatorWallet);

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
