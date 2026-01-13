import { Worker } from 'bullmq';
import {
  QUEUE_VERIFY_INITIAL,
  QUEUE_KEEP_ALIVE,
  QUEUE_EXPIRY,
} from '@shared/types';
import type {
  VerifyInitialJobPayload,
  KeepAliveJobPayload,
  ExpiryJobPayload,
} from '@shared/types';
import { connection, closeQueues } from './queues';
import { processVerifyInitialJob } from './jobs/verifyInitial';
import { processKeepAliveJob } from './jobs/keepAlive';
import { processExpiryJob } from './jobs/expiry';

console.log('🚀 Billboard Market Worker starting...');

// Create workers
const verifyInitialWorker = new Worker<VerifyInitialJobPayload>(
  QUEUE_VERIFY_INITIAL,
  processVerifyInitialJob,
  {
    connection,
    concurrency: 5,
  }
);

const keepAliveWorker = new Worker<KeepAliveJobPayload>(
  QUEUE_KEEP_ALIVE,
  processKeepAliveJob,
  {
    connection,
    concurrency: 10,
  }
);

const expiryWorker = new Worker<ExpiryJobPayload>(
  QUEUE_EXPIRY,
  processExpiryJob,
  {
    connection,
    concurrency: 5,
  }
);

// Event handlers
verifyInitialWorker.on('completed', (job, result) => {
  console.log(`[VerifyInitial] Job ${job.id} completed:`, result);
});

verifyInitialWorker.on('failed', (job, err) => {
  console.error(`[VerifyInitial] Job ${job?.id} failed:`, err);
});

keepAliveWorker.on('completed', (job, result) => {
  console.log(`[KeepAlive] Job ${job.id} completed:`, result);
});

keepAliveWorker.on('failed', (job, err) => {
  console.error(`[KeepAlive] Job ${job?.id} failed:`, err);
});

expiryWorker.on('completed', (job, result) => {
  console.log(`[Expiry] Job ${job.id} completed:`, result);
});

expiryWorker.on('failed', (job, err) => {
  console.error(`[Expiry] Job ${job?.id} failed:`, err);
});

console.log('✅ Workers registered:');
console.log(`   - ${QUEUE_VERIFY_INITIAL} (concurrency: 5)`);
console.log(`   - ${QUEUE_KEEP_ALIVE} (concurrency: 10)`);
console.log(`   - ${QUEUE_EXPIRY} (concurrency: 5)`);

// Graceful shutdown
async function shutdown() {
  console.log('\n🛑 Shutting down workers...');

  await Promise.all([
    verifyInitialWorker.close(),
    keepAliveWorker.close(),
    expiryWorker.close(),
  ]);

  await closeQueues();

  console.log('✅ Workers shut down gracefully');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Keep process alive
console.log('👀 Worker is running and waiting for jobs...');
