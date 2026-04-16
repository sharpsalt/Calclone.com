import { randomUUID as uuidv4 } from 'crypto';
import * as repo from '../repositories/eventTypeRepository';
import { getDefaultUserId, getDefaultUserProfile } from '../config';
import ApiError from '../errors/ApiError';
import redis from '../lib/redis';
import { queryRead } from '../db';

const CACHE_TTL = Number(process.env.EVENT_CACHE_TTL_SECONDS || 300); // default 5 minutes

export const listEventTypes = async () => {
  return repo.findAll();
};

export const getEventTypeBySlug = async (slug: string) => {
  const key = `event:slug:${slug}`;
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      // ignore redis errors and fall back to DB
    }

    const lockKey = `lock:${key}`;
    try {
      const gotLock = await (redis as any).set(lockKey, '1', 'NX', 'EX', 5);
      if (gotLock === 'OK') {
        const e = await repo.findBySlug(slug);
        if (!e) {
          await redis.del(lockKey);
          throw ApiError.notFound('Event type not found');
        }
        try {
          await (redis as any).set(key, JSON.stringify(e), 'EX', CACHE_TTL);
        } catch {}
        await redis.del(lockKey);
        return e;
      }

      // wait briefly for the cache to be populated by the locker
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 50));
        try {
          const cached2 = await redis.get(key);
          if (cached2) return JSON.parse(cached2);
        } catch {
          break; // on redis error, break to DB fallback
        }
      }
      // fallback to DB if cache still empty
    } catch (err) {
      // any redis error -> fallback to DB
    }
  }

  const e = await repo.findBySlug(slug);
  if (!e) throw ApiError.notFound('Event type not found');
  return e;
};

export const getPublicProfileByUsername = async (username: string) => {
  const key = `public:username:${username}`;
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached);
    } catch {}

    const lockKey = `lock:${key}`;
    try {
      const gotLock = await (redis as any).set(lockKey, '1', 'NX', 'EX', 5);
      if (gotLock === 'OK') {
        const profile = await repo.findPublicProfileByUsername(username);
        if (!profile) {
          await redis.del(lockKey);
          throw ApiError.notFound('User not found');
        }
        try {
          await (redis as any).set(key, JSON.stringify(profile), 'EX', CACHE_TTL);
        } catch {}
        await redis.del(lockKey);
        return profile;
      }

      // wait briefly for the cache to be populated by the locker
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 50));
        try {
          const cached2 = await redis.get(key);
          if (cached2) return JSON.parse(cached2);
        } catch {
          break;
        }
      }
      // fallback to DB
    } catch {}
  }

  const profile = await repo.findPublicProfileByUsername(username);
  if (!profile) throw ApiError.notFound('User not found');
  return profile;
};

export const createEventType = async (payload: any) => {
  const { title, description, duration_minutes, slug, settings } = payload || {};
  if (!title || !duration_minutes || !slug) throw ApiError.badRequest('missing fields');

  const user = await getDefaultUserProfile();
  const id = uuidv4();

  const created = await repo.create({
    id,
    user_id: user.id,
    title,
    description: description || '',
    duration_minutes,
    slug,
    host_name: user.name,
    host_timezone: user.timezone,
    settings: settings || {},
  });

  // invalidate caches for this slug and user's public profile
  try {
    if (redis && created) {
      await (redis as any).del(`event:slug:${created.slug}`);
      if (created.user_id) {
        const ures = await queryRead('SELECT username FROM users WHERE id=$1 LIMIT 1', [created.user_id]);
        const username = ures.rows[0]?.username;
        if (username) await (redis as any).del(`public:username:${username}`);
      }
    }
  } catch {}

  return created;
};

export const updateEventType = async (id: string, updates: any) => {
  const before = await repo.findById(id);
  if (!before) throw ApiError.notFound('Event type not found');

  const updated = await repo.updateById(id, updates);
  if (!updated) throw ApiError.badRequest('No fields to update');

  // invalidate caches for this event and user
  try {
    if (redis && updated) {
      if (updated.slug) await (redis as any).del(`event:slug:${updated.slug}`);
      if (updated.user_id) {
        const ures = await queryRead('SELECT username FROM users WHERE id=$1 LIMIT 1', [updated.user_id]);
        const username = ures.rows[0]?.username;
        if (username) await (redis as any).del(`public:username:${username}`);
      }
    }
  } catch {}

  return updated;
};

export const deleteEventType = async (id: string) => {
  const before = await repo.findById(id);
  if (!before) return;
  await repo.deleteById(id);
  try {
    if (redis) {
      if (before.slug) await (redis as any).del(`event:slug:${before.slug}`);
      if (before.user_id) {
        const ures = await queryRead('SELECT username FROM users WHERE id=$1 LIMIT 1', [before.user_id]);
        const username = ures.rows[0]?.username;
        if (username) await (redis as any).del(`public:username:${username}`);
      }
    }
  } catch {}
};
