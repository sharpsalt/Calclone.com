import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeRangeSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(timeRegex, 'start_time must be HH:mm'),
  end_time: z.string().regex(timeRegex, 'end_time must be HH:mm'),
});

export const upsertAvailabilitySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  timezone: z.string().min(1),
  timeRanges: z.array(timeRangeSchema).optional().default([]),
});

export const upsertScheduleSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  timezone: z.string().min(1),
  timeRanges: z.array(timeRangeSchema).optional().default([]),
});
