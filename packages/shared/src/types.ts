// Slot types for X profile
export type SlotType = 'HEADER' | 'BIO';

// Campaign status enum matching Prisma schema
export type CampaignStatus =
  | 'DRAFT'
  | 'DEPOSIT_PENDING'
  | 'DEPOSITED'
  | 'APPROVAL_PENDING'
  | 'VERIFYING'
  | 'LIVE'
  | 'EXPIRED'
  | 'FAILED_VERIFICATION'
  | 'CANCELED_SOFT'
  | 'CANCELED_HARD'
  | 'REFUNDED'
  | 'CLAIMED';

// Request types
export type RequestType = 'SPONSOR_BUY' | 'CREATOR_OFFER';
export type RequestStatus = 'OPEN' | 'CLOSED';
export type ApplicationStatus = 'APPLIED' | 'ACCEPTED' | 'REJECTED';

// On-chain state (subset of CampaignStatus for Anchor)
export type ChainCampaignState =
  | 'DEPOSITED'
  | 'APPROVED'
  | 'VERIFYING'
  | 'LIVE'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'CANCELED_HARD';

// X Provider types
export interface XSnapshot {
  headerImageUrl: string | null;
  bioText: string;
  displayName: string;
  avatarUrl: string | null;
  followersCount: number | null;
  verified: boolean;
}

// Verification result
export interface VerificationResult {
  match: boolean;
  hashDistance: number;
  headerUrl: string | null;
  expectedHash: string;
  actualHash: string;
  notes: string;
}

// Banner render result
export interface BannerRenderResult {
  url: string;
  sha256: string;
  perceptualHash: string;
  width: number;
  height: number;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Listing for API
export interface ListingData {
  id: string;
  creatorWallet: string;
  slotType: SlotType;
  price24hLamports: bigint;
  price7dLamports: bigint;
  price30dLamports: bigint;
  active: boolean;
  requiresApproval: boolean;
  createdAt: Date;
  creator?: {
    xUsername: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

// Request for API
export interface RequestData {
  id: string;
  type: RequestType;
  createdByWallet: string;
  title: string;
  description: string;
  slotTypes: SlotType[];
  durationSeconds: number;
  amountLamports: bigint;
  status: RequestStatus;
  maxWinners: number | null;
  createdAt: Date;
}

// Campaign for API
export interface CampaignData {
  id: string;
  chainCampaignId: bigint | null;
  listingId: string | null;
  requestId: string | null;
  sponsorWallet: string;
  creatorWallet: string;
  slotType: SlotType;
  durationSeconds: number;
  amountLamports: bigint;
  status: CampaignStatus;
  expectedBannerUrl: string | null;
  expectedSha256: string | null;
  expectedHash: string | null;
  requiredBioSubstring: string | null;
  createdAt: Date;
  applyTimeoutAt: Date | null;
  startAt: Date | null;
  endAt: Date | null;
  lastCheckedAt: Date | null;
  hardCancelAt: Date | null;
  hardCancelReason: string | null;
  depositTxSig: string | null;
  refundTxSig: string | null;
  claimTxSig: string | null;
}

// Notification types
export type NotificationType =
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_DEPOSITED'
  | 'CAMPAIGN_APPROVED'
  | 'CAMPAIGN_REJECTED'
  | 'CAMPAIGN_LIVE'
  | 'CAMPAIGN_EXPIRED'
  | 'CAMPAIGN_HARD_CANCELED'
  | 'CAMPAIGN_CLAIMED'
  | 'VERIFICATION_FAILED'
  | 'REQUEST_APPLICATION'
  | 'APPLICATION_ACCEPTED'
  | 'APPLICATION_REJECTED';

export interface NotificationData {
  id: string;
  wallet: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  metadata?: Record<string, unknown>;
}

// Job payloads
export interface VerifyInitialJobPayload {
  campaignId: string;
  attempt: number;
  consecutiveMatches: number;
  startedAt: number;
}

export interface KeepAliveJobPayload {
  campaignId: string;
  checkNumber: number;
}

export interface ExpiryJobPayload {
  campaignId: string;
}

// Auth types
export interface AuthUser {
  wallet: string;
  isCreator: boolean;
}

export interface SignInMessage {
  domain: string;
  publicKey: string;
  nonce: string;
  statement: string;
  issuedAt: string;
  expirationTime: string;
}
