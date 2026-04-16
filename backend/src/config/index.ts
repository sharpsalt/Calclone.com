import { query } from '../db';

export async function getDefaultUserId(): Promise<string | null> {
  const username = process.env.DEFAULT_USERNAME || 'srijan';
  const res = await query('SELECT id FROM users WHERE username=$1', [username]);
  return res.rows[0] ? res.rows[0].id : null;
}

export async function getDefaultUserProfile(): Promise<{
  id: string | null;
  name: string | null;
  timezone: string | null;
}> {
  const username = process.env.DEFAULT_USERNAME || 'srijan';
  const res = await query('SELECT id, name, timezone FROM users WHERE username=$1 LIMIT 1', [username]);
  const row = res.rows[0];
  if (!row) {
    return { id: null, name: null, timezone: null };
  }

  return {
    id: row.id,
    name: row.name || null,
    timezone: row.timezone || null,
  };
}
