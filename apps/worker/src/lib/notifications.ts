import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface NotificationData {
  wallet: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification for a user.
 */
export async function createNotification(data: NotificationData): Promise<void> {
  await prisma.notification.create({
    data: {
      wallet: data.wallet,
      type: data.type,
      title: data.title,
      body: data.body,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    },
  });
}

/**
 * Notify both parties about a hard cancel.
 */
export async function notifyHardCancel(
  campaignId: string,
  sponsorWallet: string,
  creatorWallet: string,
  reason: string
): Promise<void> {
  await Promise.all([
    createNotification({
      wallet: sponsorWallet,
      type: 'CAMPAIGN_HARD_CANCELED',
      title: 'Campaign Hard Canceled',
      body: `Your campaign has been canceled: ${reason}. Funds will be refunded.`,
      metadata: { campaignId },
    }),
    createNotification({
      wallet: creatorWallet,
      type: 'CAMPAIGN_HARD_CANCELED',
      title: 'Campaign Hard Canceled',
      body: `Campaign has been canceled due to verification failure: ${reason}`,
      metadata: { campaignId },
    }),
  ]);
}

/**
 * Notify creator that campaign is now LIVE.
 */
export async function notifyCampaignLive(
  campaignId: string,
  sponsorWallet: string,
  creatorWallet: string
): Promise<void> {
  await Promise.all([
    createNotification({
      wallet: sponsorWallet,
      type: 'CAMPAIGN_LIVE',
      title: 'Campaign is Live!',
      body: 'Your banner has been verified and the campaign is now live.',
      metadata: { campaignId },
    }),
    createNotification({
      wallet: creatorWallet,
      type: 'CAMPAIGN_LIVE',
      title: 'Campaign is Live!',
      body: 'Banner verification passed. Keep the banner displayed until the campaign ends.',
      metadata: { campaignId },
    }),
  ]);
}

/**
 * Notify creator that campaign has expired and they can claim.
 */
export async function notifyCampaignExpired(
  campaignId: string,
  creatorWallet: string
): Promise<void> {
  await createNotification({
    wallet: creatorWallet,
    type: 'CAMPAIGN_EXPIRED',
    title: 'Campaign Completed!',
    body: 'Congratulations! Your campaign has ended successfully. You can now claim your earnings.',
    metadata: { campaignId },
  });
}

/**
 * Notify sponsor that verification failed.
 */
export async function notifyVerificationFailed(
  campaignId: string,
  sponsorWallet: string,
  creatorWallet: string
): Promise<void> {
  await Promise.all([
    createNotification({
      wallet: sponsorWallet,
      type: 'VERIFICATION_FAILED',
      title: 'Verification Failed',
      body: 'The creator did not apply the banner in time. You can request a refund.',
      metadata: { campaignId },
    }),
    createNotification({
      wallet: creatorWallet,
      type: 'VERIFICATION_FAILED',
      title: 'Verification Failed',
      body: 'Banner verification timed out. The campaign has been canceled.',
      metadata: { campaignId },
    }),
  ]);
}

export { prisma };
