import { query, queryRead } from '../db';

export type EventTypeRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  slug: string;
  host_name?: string;
  host_timezone?: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicProfileRow = {
  user: {
    id: string;
    username: string;
    name: string | null;
    timezone: string | null;
  };
  event_types: EventTypeRow[];
};

export const findAll = async () => {
  const res = await queryRead('SELECT * FROM event_types ORDER BY created_at DESC');
  return res.rows;
};

export const findBySlug = async (slug: string) => {
  const res = await queryRead('SELECT * FROM event_types WHERE slug=$1 LIMIT 1', [slug]);
  return res.rows[0] || null;
};

export const findById = async (id: string) => {
  const res = await query('SELECT * FROM event_types WHERE id=$1', [id]);
  return res.rows[0] || null;
};

export const findPublicProfileByUsername = async (username: string): Promise<PublicProfileRow | null> => {
  const userRes = await queryRead('SELECT id, username, name, timezone FROM users WHERE username=$1 LIMIT 1', [username]);
  const user = userRes.rows[0];
  if (!user) return null;

  const eventsRes = await queryRead(
    'SELECT * FROM event_types WHERE user_id=$1 AND is_active=true ORDER BY created_at DESC',
    [user.id]
  );

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name || null,
      timezone: user.timezone || null,
    },
    event_types: eventsRes.rows,
  };
};

export const create = async (data: {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  duration_minutes: number;
  slug: string;
  host_name?: string | null;
  host_timezone?: string | null;
  settings?: Record<string, unknown>;
}) => {
  const { id, user_id, title, description, duration_minutes, slug, host_name, host_timezone, settings } = data;
  await query(
    'INSERT INTO event_types (id, user_id, title, description, duration_minutes, slug, host_name, host_timezone, settings) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, user_id, title, description, duration_minutes, slug, host_name || null, host_timezone || null, settings || {}]
  );
  return findById(id);
};

export const updateById = async (id: string, updates: Record<string, any>) => {
  const allowedFields = ['title', 'description', 'duration_minutes', 'slug', 'is_active', 'host_name', 'host_timezone', 'settings'];
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const k of allowedFields) {
    if (updates[k] !== undefined) {
      fields.push(`${k} = $${idx}`);
      values.push(updates[k]);
      idx++;
    }
  }
  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE event_types SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const deleteById = async (id: string) => {
  await query('DELETE FROM event_types WHERE id=$1', [id]);
};
