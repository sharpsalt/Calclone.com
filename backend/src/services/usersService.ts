import { query, pool, withTransaction } from '../db';
import ApiError from '../errors/ApiError';
import { addJob } from '../lib/queue';
import redis from '../lib/redis';
import logger from '../lib/logger';
import { randomUUID as uuidv4 } from 'crypto';

export const updateUserById = async (id: string, updates: { username?: string; name?: string; timezone?: string }) => {
  const beforeRes = await query('SELECT id, username, name, timezone FROM users WHERE id=$1 LIMIT 1', [id]);
  const before = beforeRes.rows[0];
  if (!before) throw ApiError.notFound('User not found');

  // If username is being changed, ensure it is unique
  if ((updates as any).username && (updates as any).username !== before.username) {
    const dup = await query('SELECT id FROM users WHERE username=$1 LIMIT 1', [(updates as any).username]);
    if (dup.rows[0]) throw ApiError.conflict('Username already taken');
  }

  const allowed = ['username', 'name', 'timezone'];
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const k of allowed) {
    if ((updates as any)[k] !== undefined) {
      fields.push(`${k} = $${idx}`);
      values.push((updates as any)[k]);
      idx++;
    }
  }
  if (fields.length === 0) return before;

  values.push(id);
  const sql = `UPDATE users SET ${fields.join(', ')}, created_at = COALESCE(created_at, now()) WHERE id = $${idx} RETURNING id, username, name, timezone`;
  const res = await query(sql, values);
  const updated = res.rows[0];

  // Enqueue profile sync job (best-effort). If Redis isn't configured, fall back to inline sync.
  let enqueued = false;
  try {
    // addJob returns false when Redis is not configured
    enqueued = await addJob('profileSync', { user_id: id });
  } catch {
    enqueued = false;
  }

  if (!enqueued) {
    // Inline fallback: update event_types immediately and invalidate cache
    try {
      const resUpdate = await pool.query(
        'UPDATE event_types SET host_name = $1, host_timezone = $2, updated_at = now() WHERE user_id = $3 RETURNING id, slug',
        [updated.name || null, updated.timezone || null, id]
      );
      const affected = resUpdate.rows || [];

      if (redis && updated.username) {
        try {
          await redis.del(`public:username:${updated.username}`);
          for (const row of affected) {
            if (row.slug) await redis.del(`event:slug:${row.slug}`);
          }
        } catch {}
      }

      for (const row of affected) {
        try {
          await pool.query(
            'INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, old_value, new_value, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now())',
            [uuidv4(), id, 'event_types', row.id, 'user_profile_sync', null, JSON.stringify({ host_name: updated.name, host_timezone: updated.timezone })]
          );
        } catch {}
      }

      logger.info('profileSync inline completed', { userId: id, updated: affected.length });
    } catch (err) {
      logger.error('profileSync inline error', { err: (err as Error).message, userId: id });
    }
  }

  return updated;
};

export const setAvatar = async (id: string, url: string) => {
  const res = await query('UPDATE users SET avatar=$1 WHERE id=$2 RETURNING id, username, name, timezone, avatar', [url, id]);
  return res.rows[0];
};

export const clearAvatar = async (id: string) => {
  const res = await query('UPDATE users SET avatar = NULL WHERE id=$1 RETURNING id, username, name, timezone, avatar', [id]);
  return res.rows[0];
};

export const listEmails = async (userId: string) => {
  const res = await query('SELECT email, is_primary, verified, created_at FROM user_emails WHERE user_id=$1 ORDER BY is_primary DESC, created_at DESC', [userId]);
  return res.rows;
};

export const addEmail = async (userId: string, email: string) => {
  const dup = await query('SELECT id FROM user_emails WHERE user_id=$1 AND email=$2 LIMIT 1', [userId, email]);
  if (dup.rows[0]) throw ApiError.conflict('Email already exists');
  const hasPrimary = await query('SELECT 1 FROM user_emails WHERE user_id=$1 AND is_primary = true LIMIT 1', [userId]);
  const isPrimary = hasPrimary.rows.length === 0;
  const id = uuidv4();
  const res = await query('INSERT INTO user_emails (id, user_id, email, is_primary) VALUES ($1,$2,$3,$4) RETURNING email, is_primary, verified, created_at', [id, userId, email, isPrimary]);
  return res.rows[0];
};

export const removeEmail = async (userId: string, email: string) => {
  return withTransaction(async (client) => {
    const q = await client.query('SELECT id, is_primary FROM user_emails WHERE user_id=$1 AND email=$2 LIMIT 1', [userId, email]);
    if (!q.rows[0]) throw ApiError.notFound('Email not found');
    const wasPrimary = q.rows[0].is_primary;
    await client.query('DELETE FROM user_emails WHERE user_id=$1 AND email=$2', [userId, email]);
    if (wasPrimary) {
      const next = await client.query('SELECT id FROM user_emails WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1', [userId]);
      if (next.rows[0]) {
        await client.query('UPDATE user_emails SET is_primary = true WHERE id=$1', [next.rows[0].id]);
      }
    }
    return true;
  });
};

export const setPrimaryEmail = async (userId: string, email: string) => {
  return withTransaction(async (client) => {
    const r = await client.query('SELECT id FROM user_emails WHERE user_id=$1 AND email=$2 LIMIT 1', [userId, email]);
    if (!r.rows[0]) throw ApiError.notFound('Email not found');
    await client.query('UPDATE user_emails SET is_primary = false WHERE user_id=$1', [userId]);
    await client.query('UPDATE user_emails SET is_primary = true WHERE user_id=$1 AND email=$2', [userId, email]);
    const rows = (await client.query('SELECT email, is_primary, verified, created_at FROM user_emails WHERE user_id=$1 ORDER BY is_primary DESC, created_at DESC', [userId])).rows;
    return rows;
  });
};
