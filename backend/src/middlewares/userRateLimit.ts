import { Request, Response, NextFunction } from 'express';
import redis from '../lib/redis';
import mem from '../lib/slidingWindowMemory';

type Options = {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
  userIdFrom?: 'header' | 'body' | 'both' | 'user';
};

// Sliding-window per-user rate limiter using Redis ZSETs
export default function userRateLimit(opts: Options = {}) {
  const windowMs = opts.windowMs ?? 1000; // default 1s window
  const max = opts.max ?? 10; // default 10 requests per window
  const prefix = opts.keyPrefix || 'user-rl';
  const userIdFrom = opts.userIdFrom || 'both';

  return async (req: Request, res: Response, next: NextFunction) => {
    // Prefer authenticated user id if present, then header/body fallbacks.
    let userId: string | undefined;
    const authUser = (req as any).user;
    if (authUser) {
      userId = authUser.id || authUser.user_id || authUser.sub || undefined;
    }
    if (!userId && (userIdFrom === 'header' || userIdFrom === 'both')) {
      userId = (req.headers['x-user-id'] as string) || (req.headers['user-id'] as string) || undefined;
    }
    if (!userId && (userIdFrom === 'body' || userIdFrom === 'both')) {
      userId = (req.body && (req.body.user_id || req.body.userId)) || undefined;
    }

    const identifier = userId || (req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'anon');

    if (!redis) return next();

    const r = redis as any;
    const now = Date.now();
    const key = `${prefix}:${identifier}`;
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
