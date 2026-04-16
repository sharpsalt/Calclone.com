import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import logger from '../lib/logger';
import { sendBookingConfirmation } from '../services/emailService';

const REDIS_URL = process.env.REDIS_URL;
const QUEUE_NAME = process.env.BULLMQ_QUEUE_NAME || 'calclone-jobs';

if (!REDIS_URL) {
  logger.info('emailWorker: REDIS_URL not configured; worker will not start');
  process.exit(0);
}

const connection = new IORedis(REDIS_URL);

const worker = new Worker(
  QUEUE_NAME,
  async (job: any) => {
    logger.info('emailWorker received job', { id: job.id, name: job.name, data: job.data });
    try {
      if (job.name === 'sendEmail' || job.name === 'sendBookingConfirmation') {
        const bookingId = job.data?.bookingId || job.data?.booking_id;
        if (!bookingId) throw new Error('missing bookingId');
        await sendBookingConfirmation(String(bookingId));
      } else {
        logger.info('emailWorker: unknown job type', { name: job.name });
      }
    } catch (err) {
      logger.error('emailWorker job failed', { err: (err as Error).message, jobId: job.id });
      throw err; // rethrow so BullMQ can retry according to attempts/backoff
    }
  },
  { connection }
);

worker.on('completed', (job: any) => {
  logger.info('emailWorker job completed', { id: job.id, name: job.name });
});

worker.on('failed', (job: any, err: any) => {
  logger.error('emailWorker job failed event', { id: job?.id, name: job?.name, err: err?.message });
});

logger.info('emailWorker started');
