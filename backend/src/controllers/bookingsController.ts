import { Request, Response } from 'express';
import * as service from '../services/bookingsService';
import { listBookingsQuerySchema, slotsQuerySchema } from '../validators/bookings';
import ApiError from '../errors/ApiError';

export const create = async (req: Request, res: Response) => {
  const idempotencyKey = (req.headers['idempotency-key'] as string)
    || (req.headers['x-idempotency-key'] as string)
    || (req.headers['x-request-id'] as string)
    || (req.headers['x-requestid'] as string)
    || (req.body && (req.body.idempotency_key || req.body.request_id));
  const created = await service.createBooking(req.body, idempotencyKey);
  res.status(201).json(created);
};

export const listSlots = async (req: Request, res: Response) => {
  const parsed = slotsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues.map((x) => x.message).join('; '));
  }
  const { event_type_id, date } = parsed.data;
  const result = await service.listAvailableSlots({ event_type_id, date });
  // Cache slots briefly at CDN/edge using stale-while-revalidate
  const shared = Number(process.env.SLOTS_CACHE_TTL_SECONDS || 60);
  const stale = Number(process.env.SLOTS_STALE_REVALIDATE_SECONDS || Math.max(shared * 5, 120));
  const browserMax = Math.min(shared, 30);
  res.setHeader('Cache-Control', `public, max-age=${browserMax}, s-maxage=${shared}, stale-while-revalidate=${stale}`);
  res.json(result);
};

export const list = async (req: Request, res: Response) => {
  const parsed = listBookingsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues.map((x) => x.message).join('; '));
  }

  const {
    status = 'upcoming',
    event_type,
    team,
    member,
    attendee_name,
    attendee_email,
    booking_uid,
    date_from,
    date_to,
    page = 1,
    page_size = 10,
  } = parsed.data;

  const result = await service.listBookingsWithFilters(status, {
    event_type, team, member, attendee_name,
    attendee_email, booking_uid, date_from, date_to,
  }, { page, page_size });

  res.json({
    ...result,
    has_more: result.page * result.page_size < result.total,
  });
};

export const getById = async (req: Request, res: Response) => {
  const row = await service.getBooking(req.params.id);
  res.json(row);
};

export const cancel = async (req: Request, res: Response) => {
  await service.cancelBooking(req.params.id);
  res.status(204).end();
};

export const requestReschedule = async (req: Request, res: Response) => {
  const row = await service.requestReschedule(req.params.id, req.body.message);
  res.json(row);
};

export const reschedule = async (req: Request, res: Response) => {
  const row = await service.rescheduleBooking(req.params.id, req.body.date, req.body.start_time);
  res.json(row);
};

export const updateLocation = async (req: Request, res: Response) => {
  const row = await service.updateBookingLocation(req.params.id, req.body.location);
  res.json(row);
};

export const addGuests = async (req: Request, res: Response) => {
  const row = await service.addBookingGuests(req.params.id, req.body.guests);
  res.json(row);
};

export const markNoShow = async (req: Request, res: Response) => {
  const row = await service.markBookingNoShow(req.params.id);
  res.json(row);
};

export const report = async (req: Request, res: Response) => {
  const row = await service.reportBooking(req.params.id, req.body.reason);
  res.json(row);
};
