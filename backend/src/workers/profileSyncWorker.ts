import { randomUUID as uuidv4 } from 'crypto';
import { popJob } from '../lib/queue';
import redis from '../lib/redis';
import { pool } from '../db';
import logger from '../lib/logger';

async function processProfileSync(payload: any) {
  const userId = payload?.user_id || payload?.userId;
  if (!userId) {
    logger.info('profileSync job missing user_id', { payload });
    return;
  }

  try {
    const resUser = await pool.query('SELECT id, username, name, timezone FROM users WHERE id=$1 LIMIT 1', [userId]);
    const user = resUser.rows[0];
    if (!user) {
      logger.info('profileSync no user found', { userId });
      return;
    }

    const resUpdate = await pool.query(
      'UPDATE event_types SET host_name = $1, host_timezone = $2, updated_at = now() WHERE user_id = $3 RETURNING id, slug',
      [user.name || null, user.timezone || null, userId]
    );

    const affected = resUpdate.rows || [];

    // Invalidate caches for this user's public profile and event slugs
    if (redis) {
      try {
        if (user.username) await redis.del(`public:username:${user.username}`);
        for (const row of affected) {
          if (row.slug) await redis.del(`event:slug:${row.slug}`);
        }
      } catch (err) {
        logger.info('redis cache invalidation failed', { err: (err as Error).message });
      }
    }

    // Write audit logs for each updated event
    for (const row of affected) {
      const auditId = uuidv4();
      try {
        await pool.query(
          'INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, old_value, new_value, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now())',
          [auditId, userId, 'event_types', row.id, 'user_profile_sync', null, JSON.stringify({ host_name: user.name, host_timezone: user.timezone })]
        );
      } catch (err) {
        logger.info('audit log insert failed', { err: (err as Error).message });
      }
    }

    logger.info('profileSync completed', { userId, updated: affected.length });
  } catch (err) {
    logger.error('profileSync error', { err: (err as Error).message, payload });
  }
}

async function run() {
  logger.info('profileSync worker starting');
  while (true) {
    const job = await popJob(5); // block up to 5s
    if (!job) continue;
    if (job.type === 'profileSync') {
      await processProfileSync(job.payload);
    } else {
      logger.info('profileSync worker ignoring job type', { type: job.type });
    }
  }
}

run().catch((err) => {
  logger.error('worker fatal', { err: (err as Error).message });
  process.exit(1);
});
