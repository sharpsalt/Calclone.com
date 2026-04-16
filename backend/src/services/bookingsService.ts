import { randomUUID as uuidv4, createHash } from 'crypto';
import * as repo from '../repositories/bookingsRepository';
import * as availabilityRepo from '../repositories/availabilityRepository';
import { getDefaultUserId } from '../config';
import ApiError from '../errors/ApiError';
import redis from '../lib/redis';
import { addJob } from '../lib/queue';
import logger from '../lib/logger';

type ListAvailableSlotsInput = {
  event_type_id: string;
  date: string;
};

const SLOTS_CACHE_TTL = Number(process.env.SLOTS_CACHE_TTL_SECONDS || 60); // default 60s

function normalizeTime(value: string): string {
  return String(value).slice(0, 5);
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function generateSlotsFromRanges(ranges: Array<{ start_time: string; end_time: string }>, duration: number): string[] {
  const slots: string[] = [];
  for (const range of ranges) {
    const start = toMinutes(normalizeTime(range.start_time));
    const end = toMinutes(normalizeTime(range.end_time));
    for (let cursor = start; cursor + duration <= end; cursor += duration) {
      slots.push(toTime(cursor));
    }
  }
  return slots;
}

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const startDate = new Date(1970, 0, 1, h, m);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);
  return endDate.toTimeString().slice(0, 5);
}

export const createBooking = async (payload: any, idempotencyKey?: string) => {
  const { event_type_id, date, start_time, booker_name, booker_email } = payload || {};
  if (!event_type_id || !date || !start_time || !booker_name || !booker_email) {
    throw ApiError.badRequest('missing fields');
  }

  // Idempotency: if key provided and cached result exists, return it
  const idemKey = idempotencyKey ? `idem:${idempotencyKey}` : null;

  // Build a stable payload signature for idempotency comparisons
  const computeSignature = (p: any) => {
    const shaping = {
      event_type_id: p.event_type_id || null,
      date: p.date || null,
      start_time: p.start_time || null,
      booker_name: p.booker_name || null,
      booker_email: p.booker_email || null,
      schedule_id: p.schedule_id || null,
    };
    const json = JSON.stringify(shaping);
    return createHash('sha256').update(json).digest('hex');
  };

  const mySignature = computeSignature(payload);

  if (idemKey && redis) {
    try {
      const cached = await redis.get(idemKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // parsed should be { booking, signature }
          if (parsed && parsed.signature && parsed.booking) {
            if (parsed.signature === mySignature) {
              return parsed.booking;
            }
            // Idempotency key was used with a different payload
            throw ApiError.conflict('Idempotency key reuse with different request payload');
          }
          // fallback: if stored value is raw booking (older format), return it
          return parsed;
        } catch (err) {
          // If parsing or signature check fails, fall through to DB flow
        }
      }
    } catch (err) {
      // ignore redis errors
    }
  }

  const id = uuidv4();
  // unguessable manage token for attendee-managed actions (reschedule/cancel)
  const manageToken = uuidv4();
  try {
    const created = await repo.createBookingWithGuards(id, {
      event_type_id,
      manage_token: manageToken,
      schedule_id: payload.schedule_id || null,
      date,
      start_time,
      booker_name,
      booker_email,
      status: payload.status || 'upcoming',
    });

    // push email job (best-effort)
      try {
        await addJob('sendEmail', { bookingId: created.id, manageToken: created.manage_token });
      } catch (err) {
        // ignore
      }

    // cache idempotency result (booking + signature) for 24h
    if (idemKey && redis) {
      try {
        const payloadToStore = { booking: created, signature: mySignature };
        await (redis as any).set(idemKey, JSON.stringify(payloadToStore), 'EX', 24 * 60 * 60);
      } catch (err) {
        // ignore
      }
    }

    logger.info('booking', { msg: 'Booking created', bookingId: created.id, event_type_id, date, start_time });
    // Invalidate related caches (slots and event slug)
    try {
      if (redis && created) {
        const slotDate = (created.date && typeof created.date === 'string') ? created.date.slice(0, 10) : (new Date(created.date)).toISOString().slice(0,10);
        await (redis as any).del(`slots:${created.event_type_id}:${slotDate}`);
        if (created.event_slug) await (redis as any).del(`event:slug:${created.event_slug}`);
      }
    } catch (e) {
      // ignore cache invalidation errors
    }

    return created;
  } catch (err: any) {
    // If unique constraint / conflict occurred
    if (err?.code === '23505' || (err?.status === 409)) {
      // If idempotency key provided, return the existing booking (idempotent retry)
      if (idemKey) {
        try {
          const existing = await repo.findBookingBySlot(event_type_id, date, start_time);
          if (existing) {
            if (redis) {
              try {
                const payloadToStore = { booking: existing, signature: mySignature };
                await (redis as any).set(idemKey, JSON.stringify(payloadToStore), 'EX', 24 * 60 * 60);
              } catch {}
            }
            return existing;
          }
        } catch {}
        // If we couldn't find existing booking for some reason, fall through to conflict
      }

      // Surface a clear conflict for the frontend to show a friendly UX message
      throw ApiError.conflict('Slot just taken, pick another.');
    }

    throw err;
  }
};

export const listAvailableSlots = async ({ event_type_id, date }: ListAvailableSlotsInput) => {
  if (!event_type_id || !date) {
    throw ApiError.badRequest('event_type_id and date are required');
  }
  // Try Redis cache for slots first (cache entire response)
  const slotsKey = `slots:${event_type_id}:${date}`;
  if (redis) {
    try {
      const cached = await redis.get(slotsKey);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore redis errors
    }
  }

  const duration = await repo.getEventTypeDuration(event_type_id);
  if (!duration) throw ApiError.notFound('Event type not found');

  const uid = await getDefaultUserId();
  const schedule = await availabilityRepo.findDefaultScheduleByUserId(uid);
  if (!schedule) {
    return { date, slots: [], timezone: 'UTC' };
  }

  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const ranges = (await availabilityRepo.findTimeRangesByScheduleId(schedule.id)).filter(
    (r: any) => Number(r.day_of_week) === dayOfWeek
  );

  const allSlots = generateSlotsFromRanges(ranges, duration);
  const bookedTimes = await repo.findBookedStartTimes(event_type_id, date);
  
  const timeToMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const isOverlap = (slotStartStr) => {
    const slotStartMin = timeToMin(slotStartStr);
    const slotEndMin = slotStartMin + duration;
    
    return bookedTimes.some(booked => {
      const bookedStartMin = timeToMin(booked.start_time);
      const bookedEndMin = timeToMin(booked.end_time || booked.start_time); /* fallback end_time if missing */
      return slotStartMin < bookedEndMin && slotEndMin > bookedStartMin;
    });
  };

  const result = {
    date,
    timezone: schedule.timezone || 'UTC',
    slots: allSlots.filter((slot) => !isOverlap(slot)),
  };

  if (redis) {
    try {
      await (redis as any).set(slotsKey, JSON.stringify(result), 'EX', SLOTS_CACHE_TTL);
    } catch {
      // ignore cache set errors
    }
  }

  return result;
};

export const listBookingsWithFilters = async (
  status: string,
  filters: repo.BookingListFilters = {},
  pagination: { page?: number; page_size?: number } = {}
) => {
  return repo.findBookingsPage({
    status,
    ...filters,
    page: pagination.page || 1,
    page_size: pagination.page_size || 10,
  });
};

export const getBooking = async (id: string) => {
  const b = await repo.findBookingById(id);
  if (!b) throw ApiError.notFound('Booking not found');
  return b;
};

export const cancelBooking = async (id: string) => {
  const before = await repo.findBookingById(id);
  if (!before) throw ApiError.notFound('Booking not found');
  await repo.cancelBookingById(id);
  try {
    if (redis && before) {
      const slotDate = (before.date && typeof before.date === 'string') ? before.date.slice(0,10) : (new Date(before.date)).toISOString().slice(0,10);
      await (redis as any).del(`slots:${before.event_type_id}:${slotDate}`);
      if (before.event_slug) await (redis as any).del(`event:slug:${before.event_slug}`);
    }
  } catch {}
};

export const requestReschedule = async (id: string, message?: string) => {
  const existing = await repo.findBookingById(id);
  if (!existing) throw ApiError.notFound('Booking not found');
  const updated = await repo.updateBookingById(id, {
    status: 'rescheduled',
    reschedule_requested: true,
    reschedule_note: message || null,
  });
  try {
    if (redis) {
      const slotDate = (existing.date && typeof existing.date === 'string') ? existing.date.slice(0,10) : (new Date(existing.date)).toISOString().slice(0,10);
      await (redis as any).del(`slots:${existing.event_type_id}:${slotDate}`);
      if (existing.event_slug) await (redis as any).del(`event:slug:${existing.event_slug}`);
      const newDate = (updated.date && typeof updated.date === 'string') ? updated.date.slice(0,10) : (new Date(updated.date)).toISOString().slice(0,10);
      await (redis as any).del(`slots:${updated.event_type_id}:${newDate}`);
      if (updated.event_slug) await (redis as any).del(`event:slug:${updated.event_slug}`);
    }
  } catch {}
  return updated;
};

export const rescheduleBooking = async (id: string, date: string, startTime: string) => {
  const existing = await repo.findBookingById(id);
  if (!existing) throw ApiError.notFound('Booking not found');

  const normalizedStart = normalizeTime(startTime);
  const hasConflict = await repo.hasConflictForSlot(existing.event_type_id, date, normalizedStart, id);
  if (hasConflict) throw ApiError.conflict('Slot already booked');

  const duration = await repo.getEventTypeDuration(existing.event_type_id);
  if (!duration) throw ApiError.notFound('Event type not found');

  const endTime = computeEndTime(normalizedStart, Number(duration));
  const updated = await repo.updateBookingById(id, {
    date,
    start_time: normalizedStart,
    end_time: endTime,
    status: 'upcoming',
    reschedule_requested: false,
    reschedule_note: null,
  });
  try {
    if (redis) {
      const oldDate = (existing.date && typeof existing.date === 'string') ? existing.date.slice(0,10) : (new Date(existing.date)).toISOString().slice(0,10);
      await (redis as any).del(`slots:${existing.event_type_id}:${oldDate}`);
      if (existing.event_slug) await (redis as any).del(`event:slug:${existing.event_slug}`);

      const newDate = (updated.date && typeof updated.date === 'string') ? updated.date.slice(0,10) : (new Date(updated.date)).toISOString().slice(0,10);
      await (redis as any).del(`slots:${updated.event_type_id}:${newDate}`);
      if (updated.event_slug) await (redis as any).del(`event:slug:${updated.event_slug}`);
    }
  } catch {}

  return updated;
};

export const updateBookingLocation = async (id: string, location: string) => {
  const existing = await repo.findBookingById(id);
  if (!existing) throw ApiError.notFound('Booking not found');
  const updated = await repo.updateBookingById(id, { location });
  try {
    if (redis && updated) {
      const slotDate = (updated.date && typeof updated.date === 'string') ? updated.date.slice(0,10) : (new Date(updated.date)).toISOString().slice(0,10);
      await (redis as any).del(`slots:${updated.event_type_id}:${slotDate}`);
      if (updated.event_slug) await (redis as any).del(`event:slug:${updated.event_slug}`);
    }
  } catch {}
  return updated;
};

export const addBookingGuests = async (id: string, guests: string[]) => {
  const existing = await repo.findBookingById(id);
  if (!existing) throw ApiError.notFound('Booking not found');

  const currentGuests = Array.isArray(existing.guests) ? existing.guests.map((x: unknown) => String(x)) : [];
  const normalizedGuests = guests.map((x) => String(x).trim()).filter(Boolean);
  const mergedGuests = Array.from(new Set([...currentGuests, ...normalizedGuests]));

  const updated = await repo.updateBookingById(id, { guests: mergedGuests });
  try {
    if (redis && updated) {
      const slotDate = (updated.date && typeof updated.date === 'string') ? updated.date.slice(0,10) : (new Date(updated.date)).toISOString().slice(0,10);
      await (redis as any).del(`slots:${updated.event_type_id}:${slotDate}`);
      if (updated.event_slug) await (redis as any).del(`event:slug:${updated.event_slug}`);
    }
  } catch {}
  return updated;
};

export const markBookingNoShow = async (id: string) => {
  const existing = await repo.findBookingById(id);
  if (!existing) throw ApiError.notFound('Booking not found');
  const updated = await repo.updateBookingById(id, { is_no_show: true });
  try {
    if (redis && updated) {
      const slotDate = (updated.date && typeof updated.date === 'string') ? updated.date.slice(0,10) : (new Date(updated.date)).toISOString().slice(0,10);
      await (redis as any).del(`slots:${updated.event_type_id}:${slotDate}`);
      if (updated.event_slug) await (redis as any).del(`event:slug:${updated.event_slug}`);
    }
  } catch {}
  return updated;
};

export const reportBooking = async (id: string, reason: string) => {
  const existing = await repo.findBookingById(id);
  if (!existing) throw ApiError.notFound('Booking not found');
  const updated = await repo.updateBookingById(id, { reported_reason: reason });
  try {
    if (redis && updated) {
      const slotDate = (updated.date && typeof updated.date === 'string') ? updated.date.slice(0,10) : (new Date(updated.date)).toISOString().slice(0,10);
      await (redis as any).del(`slots:${updated.event_type_id}:${slotDate}`);
      if (updated.event_slug) await (redis as any).del(`event:slug:${updated.event_slug}`);
    }
  } catch {}
  return updated;
};
