import redis from './redis';
import bull from './bullQueue';
import logger from './logger';

type Job = { type: string; payload: any };

const QUEUE_KEY = 'cal:queue:jobs';

export async function addJob(type: string, payload: any) {
  // Prefer BullMQ when available
  try {
    const used = await bull.addBullJob(type, payload);
    if (used) return true;
  } catch (err: any) {
    logger.error('addJob.bull.error', { err: err?.message, type });
    // fall through to legacy list-based queue
  }

  // Check redis raw client availability before attempting lpush
  const r = redis as any;
  const rawClient = r && typeof r.raw === 'function' ? r.raw() : null;
  if (!rawClient) {
    logger.info('addJob: no queue backend available (bull/redis)', { type });
    return false;
  }

  try {
    const job: Job = { type, payload };
    const pushed = await r.lpush(QUEUE_KEY, JSON.stringify(job));
    if (pushed == null) {
      logger.error('addJob: redis.lpush returned null', { type });
      return false;
    }
    logger.info('addJob: queued to redis list', { type, queued: pushed });
    return true;
  } catch (err: any) {
    logger.error('addJob.redis.error', { err: err?.message, type });
    return false;
  }
}

export async function popJob(timeout = 0): Promise<Job | null> {
  // popJob is only used by legacy workers; when BullMQ is used, workers will be separate
  if (!redis) return null;
  try {
    // use BRPOP to block until a job is available; returns [key, value]
    const res = await (redis as any).brpop(QUEUE_KEY, timeout);
    if (!res) return null;
    const payload = typeof res === 'string' ? res : res[1];
    return JSON.parse(payload as string) as Job;
  } catch (err) {
    return null;
  }
}

export default { addJob, popJob };
