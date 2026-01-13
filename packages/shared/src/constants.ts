// Duration options in seconds
export const DURATION_24H = 24 * 60 * 60; // 86400
export const DURATION_7D = 7 * 24 * 60 * 60; // 604800
export const DURATION_30D = 30 * 24 * 60 * 60; // 2592000

export const DURATION_OPTIONS = {
  '24h': DURATION_24H,
  '7d': DURATION_7D,
  '30d': DURATION_30D,
} as const;

export type DurationKey = keyof typeof DURATION_OPTIONS;

// Banner dimensions (X header standard)
export const BANNER_WIDTH = 1500;
export const BANNER_HEIGHT = 500;

// Verification constants
export const DEFAULT_HASH_MAX_DISTANCE = 10;
export const VERIFY_POLL_INTERVAL_MS = 60_000; // 1 minute
export const VERIFY_MAX_DURATION_MS = 30 * 60 * 1000; // 30 minutes
export const VERIFY_REQUIRED_CONSECUTIVE_MATCHES = 2;
export const KEEPALIVE_CHECKS_PER_DAY = 7;
export const KEEPALIVE_INTERVAL_MS = Math.floor((24 * 60 * 60 * 1000) / KEEPALIVE_CHECKS_PER_DAY); // ~3.4 hours
export const KEEPALIVE_JITTER_MS = 10 * 60 * 1000; // 10 minute jitter

// Lamports per SOL
export const LAMPORTS_PER_SOL = 1_000_000_000;

// Campaign status groups
export const ACTIVE_STATUSES = ['DEPOSITED', 'APPROVAL_PENDING', 'VERIFYING', 'LIVE'] as const;
export const TERMINAL_STATUSES = ['EXPIRED', 'FAILED_VERIFICATION', 'CANCELED_SOFT', 'CANCELED_HARD', 'REFUNDED', 'CLAIMED'] as const;
export const REFUNDABLE_STATUSES = ['DEPOSITED', 'APPROVAL_PENDING', 'VERIFYING', 'LIVE', 'FAILED_VERIFICATION', 'CANCELED_HARD'] as const;
export const CLAIMABLE_STATUSES = ['EXPIRED'] as const;

// Platform fee (optional, set to 0 for v1)
export const PLATFORM_FEE_BPS = 0; // 0% for v1, can be 250 for 2.5%

// Queue names
export const QUEUE_VERIFY_INITIAL = 'verify-initial';
export const QUEUE_KEEP_ALIVE = 'keep-alive';
export const QUEUE_EXPIRY = 'expiry';

// Redis key prefixes
export const REDIS_PREFIX = 'billboard:';
export const REDIS_LOCK_PREFIX = `${REDIS_PREFIX}lock:`;
export const REDIS_SESSION_PREFIX = `${REDIS_PREFIX}session:`;

// Auth constants
export const AUTH_MESSAGE_STATEMENT = 'Sign in to Billboard Market';
export const AUTH_MESSAGE_VALIDITY_MS = 10 * 60 * 1000; // 10 minutes
export const SESSION_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Bio verification code prefix
export const BIO_VERIFY_CODE_PREFIX = 'BILLBOARD_VERIFY_';
