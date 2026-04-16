import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import logger from './logger';

const url = process.env.REDIS_URL;
const QUEUE_NAME = process.env.BULLMQ_QUEUE_NAME || 'calclone-jobs';

let queue: Queue | null = null;

if (url) {
  try {
    const connection = new IORedis(url);
    queue = new Queue(QUEUE_NAME, { connection });
    logger.info('bullQueue initialized', { queue: QUEUE_NAME });
  } catch (err) {
    logger.error('bullQueue init error', { err: (err as Error).message });
    queue = null;
    
  }
}

export async function addBullJob(name: string, payload: any, opts: any = {}) {
  if (!queue) return false;
  try {
    await queue.add(name, payload, {
      attempts: opts.attempts || 5,
      backoff: opts.backoff || { type: 'exponential', delay: 1000 },
      removeOnComplete: opts.removeOnComplete ?? true,
      removeOnFail: opts.removeOnFail ?? false,
      delay: opts.delay || 0,
      ...opts.extra,
    });
    return true;
  } catch (err) {
    logger.error('addBullJob error', { err: (err as Error).message, name });
    return false;
  }
}

export default {
  queue,
  addBullJob,
};
