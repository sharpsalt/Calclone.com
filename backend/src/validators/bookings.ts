import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createBookingSchema = z.object({
  event_type_id: z.string().uuid(),
  schedule_id: z.string().uuid().nullable().optional(),
  date: z.string().regex(dateRegex, 'date must be YYYY-MM-DD'),
  start_time: z.string().regex(timeRegex, 'start_time must be HH:mm'),
  booker_name: z.string().min(1).max(120),
  booker_email: z.string().email(),
  status: z.enum(['upcoming', 'past', 'cancelled']).optional(),
});

export const slotsQuerySchema = z.object({
  event_type_id: z.string().uuid(),
  date: z.string().regex(dateRegex, 'date must be YYYY-MM-DD'),
});

export const listBookingsQuerySchema = z.object({
  status: z.enum(['upcoming', 'past', 'all', 'cancelled', 'unconfirmed', 'recurring']).optional(),
  event_type: z.string().min(1).max(200).optional(),
  team: z.string().min(1).max(200).optional(),
  member: z.string().min(1).max(200).optional(),
  attendee_name: z.string().min(1).max(200).optional(),
  attendee_email: z.string().min(1).max(200).optional(),
  booking_uid: z.string().min(1).max(120).optional(),
  date_from: z.string().regex(dateRegex, 'date_from must be YYYY-MM-DD').optional(),
  date_to: z.string().regex(dateRegex, 'date_to must be YYYY-MM-DD').optional(),
  page: z.coerce.number().int().min(1).optional(),
  page_size: z.coerce.number().int().min(1).max(100).optional(),
});

export const requestRescheduleSchema = z.object({
  message: z.string().max(500).optional(),
});

export const rescheduleBookingSchema = z.object({
  date: z.string().regex(dateRegex, 'date must be YYYY-MM-DD'),
  start_time: z.string().regex(timeRegex, 'start_time must be HH:mm'),
});

export const updateBookingLocationSchema = z.object({
  location: z.string().min(1).max(280),
});

export const addBookingGuestsSchema = z.object({
  guests: z.array(z.string().regex(emailRegex, 'guest email must be valid')).max(20),
});

export const reportBookingSchema = z.object({
  reason: z.string().min(1).max(500),
});
