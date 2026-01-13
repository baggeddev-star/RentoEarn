import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import {
  QUEUE_VERIFY_INITIAL,
  QUEUE_KEEP_ALIVE,
  QUEUE_EXPIRY,
} from '@shared/types';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queue instances
export const verifyInitialQueue = new Queue(QUEUE_VERIFY_INITIAL, { connection });
export const keepAliveQueue = new Queue(QUEUE_KEEP_ALIVE, { connection });
export const expiryQueue = new Queue(QUEUE_EXPIRY, { connection });

// Queue events for monitoring
export const verifyInitialEvents = new QueueEvents(QUEUE_VERIFY_INITIAL, { connection });
export const keepAliveEvents = new QueueEvents(QUEUE_KEEP_ALIVE, { connection });
export const expiryEvents = new QueueEvents(QUEUE_EXPIRY, { connection });

export async function closeQueues() {
  await Promise.all([
    verifyInitialQueue.close(),
    keepAliveQueue.close(),
    expiryQueue.close(),
    verifyInitialEvents.close(),
    keepAliveEvents.close(),
    expiryEvents.close(),
    connection.quit(),
  ]);
}
