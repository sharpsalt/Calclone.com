import { Request, Response, NextFunction } from 'express';
import redis from '../lib/redis';
import mem from '../lib/slidingWindowMemory';

type Options = {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
};

// Sliding-window rate limiter using Redis sorted sets (ZSET) to count requests
// in the last `windowMs` milliseconds precisely.
export default function redisRateLimit(opts: Options = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 60;
  const prefix = opts.keyPrefix || 'rl';

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = (req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'anon') as string;

    const now = Date.now();
    const key = `${prefix}:${identifier}`;
    const r = redis as any;

    // If Redis raw client not available, use in-memory fallback for single-process dev
    const raw = r && typeof r.raw === 'function' ? r.raw() : null;
    if (!raw) {
      try {
        const { count, oldest } = mem.recordAndCount(key, now, windowMs);
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - count)));
        if (count > max) {
          const ts = oldest || now;
          const retryAfterMs = Math.max(0, windowMs - (now - ts));
          res.setHeader('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
          return res.status(429).json({ error: 'Too many requests' });
        }
        return next();
      } catch (e) {
        return next();
      }
    }

    try {
      const member = `${now}:${Math.random().toString(36).slice(2)}`;
      await r.zadd(key, now, member);
      await r.zremrangebyscore(key, 0, now - windowMs);
      const count = Number((await r.zcard(key)) || 0);
      await r.pexpire(key, windowMs + 1000);

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - count)));

      if (count > max) {
        // Get oldest member to compute Retry-After
        try {
          const oldest = await r.zrange(key, 0, 0);
          if (Array.isArray(oldest) && oldest.length > 0) {
            const oldestMember = oldest[0] as string;
            const tsStr = oldestMember.split(':')[0];
            const ts = Number(tsStr) || now;
            const retryAfterMs = Math.max(0, windowMs - (now - ts));
            res.setHeader('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
          } else {
            res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
          }
        } catch (e) {
          res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
        }
        return res.status(429).json({ error: 'Too many requests' });
      }

      return next();
    } catch (err) {
      return next();
    }
  };
}
