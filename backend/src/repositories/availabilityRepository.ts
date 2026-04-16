import { query, queryRead } from '../db';

export const findDefaultScheduleByUserId = async (userId: string | null) => {
  if (!userId) return null;
  const res = await queryRead('SELECT * FROM availability_schedules WHERE user_id=$1 AND is_default=true LIMIT 1', [userId]);
  return res.rows[0] || null;
};

export const findTimeRangesByScheduleId = async (scheduleId: string) => {
  const res = await queryRead('SELECT * FROM availability_time_ranges WHERE schedule_id=$1 ORDER BY day_of_week, start_time', [scheduleId]);
  return res.rows;
};

export const findSchedulesByUserId = async (userId: string | null) => {
  if (!userId) return [];
  const res = await queryRead('SELECT * FROM availability_schedules WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
  return res.rows;
};

export const findScheduleById = async (id: string) => {
  const res = await queryRead('SELECT * FROM availability_schedules WHERE id=$1', [id]);
  return res.rows[0] || null;
};

export const insertSchedule = async (id: string, userId: string | null, name: string, timezone: string, isDefault = true) => {
  await query('INSERT INTO availability_schedules (id, user_id, name, timezone, is_default) VALUES ($1,$2,$3,$4,$5)', [id, userId, name, timezone, isDefault]);
  return (await query('SELECT * FROM availability_schedules WHERE id=$1', [id])).rows[0];
};

export const updateSchedule = async (id: string, name: string, timezone: string) => {
  await query('UPDATE availability_schedules SET name=$1, timezone=$2, updated_at=now() WHERE id=$3', [name, timezone, id]);
  return (await query('SELECT * FROM availability_schedules WHERE id=$1', [id])).rows[0];
};

export const deleteTimeRangesByScheduleId = async (scheduleId: string) => {
  await query('DELETE FROM availability_time_ranges WHERE schedule_id=$1', [scheduleId]);
};

export const deleteScheduleById = async (id: string) => {
  await query('DELETE FROM availability_schedules WHERE id=$1', [id]);
};

export const insertTimeRange = async (id: string, scheduleId: string, day_of_week: number, start_time: string, end_time: string) => {
  await query('INSERT INTO availability_time_ranges (id, schedule_id, day_of_week, start_time, end_time) VALUES ($1,$2,$3,$4,$5)', [id, scheduleId, day_of_week, start_time, end_time]);
};
