import { randomUUID as uuidv4 } from 'crypto';
import * as repo from '../repositories/availabilityRepository';
import { getDefaultUserId } from '../config';
import ApiError from '../errors/ApiError';

export const getAvailabilityForDefaultUser = async () => {
  const uid = await getDefaultUserId();
  const schedule = await repo.findDefaultScheduleByUserId(uid);
  if (!schedule) return {};
  const ranges = await repo.findTimeRangesByScheduleId(schedule.id);
  return { ...schedule, timeRanges: ranges };
};

export const upsertAvailabilityForDefaultUser = async (payload: any) => {
  const uid = await getDefaultUserId();
  const { name, timezone, timeRanges } = payload || {};
  if (!timezone) throw ApiError.badRequest('timezone required');

  let schedule = await repo.findDefaultScheduleByUserId(uid);
  let scheduleId: string;

  if (schedule) {
    scheduleId = schedule.id;
    await repo.updateSchedule(scheduleId, name || schedule.name, timezone);
    await repo.deleteTimeRangesByScheduleId(scheduleId);
  } else {
    scheduleId = uuidv4();
    await repo.insertSchedule(scheduleId, uid, name || 'Default', timezone, true);
  }

  if (Array.isArray(timeRanges)) {
    for (const tr of timeRanges) {
      const id = uuidv4();
      await repo.insertTimeRange(id, scheduleId, tr.day_of_week, tr.start_time, tr.end_time);
    }
  }

  const updatedSchedule = (await repo.findDefaultScheduleByUserId(uid)) as any;
  const ranges = await repo.findTimeRangesByScheduleId(updatedSchedule.id);
  return { ...updatedSchedule, timeRanges: ranges };
};

export const listSchedulesForDefaultUser = async () => {
  const uid = await getDefaultUserId();
  const schedules = await repo.findSchedulesByUserId(uid);
  return schedules || [];
};

export const createScheduleForDefaultUser = async (payload: any) => {
  const uid = await getDefaultUserId();
  const { name, timezone, timeRanges } = payload || {};
  const scheduleId = uuidv4();

  await repo.insertSchedule(scheduleId, uid, name || 'New schedule', timezone || 'UTC', false);

  if (Array.isArray(timeRanges)) {
    for (const tr of timeRanges) {
      const id = uuidv4();
      await repo.insertTimeRange(id, scheduleId, tr.day_of_week, tr.start_time, tr.end_time);
    }
  }

  const schedule = (await repo.findScheduleById(scheduleId)) as any;
  const ranges = await repo.findTimeRangesByScheduleId(scheduleId);
  return { ...schedule, timeRanges: ranges };
};

export const getScheduleById = async (id: string) => {
  const schedule = await repo.findScheduleById(id);
  if (!schedule) throw ApiError.notFound('Schedule not found');
  const ranges = await repo.findTimeRangesByScheduleId(schedule.id);
  return { ...schedule, timeRanges: ranges };
};

export const updateScheduleById = async (id: string, payload: any) => {
  const { name, timezone, timeRanges } = payload || {};
  const existing = await repo.findScheduleById(id);
  if (!existing) throw ApiError.notFound('Schedule not found');

  await repo.updateSchedule(id, name || existing.name || 'Schedule', timezone || existing.timezone);
  await repo.deleteTimeRangesByScheduleId(id);

  if (Array.isArray(timeRanges)) {
    for (const tr of timeRanges) {
      const tid = uuidv4();
      await repo.insertTimeRange(tid, id, tr.day_of_week, tr.start_time, tr.end_time);
    }
  }

  const schedule = await repo.findScheduleById(id);
  const ranges = await repo.findTimeRangesByScheduleId(id);
  return { ...schedule, timeRanges: ranges };
};

export const deleteScheduleById = async (id: string) => {
  const existing = await repo.findScheduleById(id);
  if (!existing) throw ApiError.notFound('Schedule not found');
  if (existing.is_default) throw ApiError.badRequest('Cannot delete default schedule');

  // remove time ranges and the schedule row
  await repo.deleteTimeRangesByScheduleId(id);
  await repo.deleteScheduleById(id);
};
