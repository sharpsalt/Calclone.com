import { Request, Response } from 'express';
import * as repo from '../repositories/bookingsRepository';
import * as service from '../services/bookingsService';
import ApiError from '../errors/ApiError';
import logger from '../lib/logger';

function formatDateTimeForIcs(dateStr: string, timeStr: string) {
  // dateStr = YYYY-MM-DD, timeStr = HH:MM
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  // produce UTC representation
  const dt = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;
}

function generateIcs(booking: any) {
  const uid = `${booking.id}@calclone.local`;
  const dtstart = formatDateTimeForIcs(booking.date, booking.start_time.slice(0,5));
  const dtend = formatDateTimeForIcs(booking.date, (booking.end_time || booking.start_time).slice(0,5));
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const summary = booking.event_title || 'Event';
  const description = `Booking for ${summary}\nManage: ${process.env.PUBLIC_BASE_URL || 'http://localhost:5173'}/manage/${booking.manage_token}`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calclone//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `ORGANIZER:MAILTO:${process.env.DEV_ADMIN_EMAIL || 'no-reply@calclone.example'}`,
    `ATTENDEE;CN=${booking.booker_name}:MAILTO:${booking.booker_email}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

export const getBookingByToken = async (req: Request, res: Response) => {
  const token = req.params.token;
  if (!token) throw ApiError.badRequest('token required');
  try {
    logger.info('public.getBookingByToken.called', { token: String(token).slice(0, 8) + '...', ip: req.ip });
  } catch {}
  const booking = await repo.findBookingByManageToken(token);
  if (!booking) throw ApiError.notFound('Booking not found');
  return res.json(booking);
};

export const getIcsByToken = async (req: Request, res: Response) => {
  const token = req.params.token;
  if (!token) throw ApiError.badRequest('token required');
  try {
    logger.info('public.getIcsByToken.called', { token: String(token).slice(0, 8) + '...', ip: req.ip });
  } catch {}
  const booking = await repo.findBookingByManageToken(token);
  if (!booking) throw ApiError.notFound('Booking not found');

  try {
    const ics = generateIcs(booking);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="booking-${booking.id}.ics"`);
    return res.send(ics);
  } catch (err: any) {
    logger.error('generate ics failed', { err: err?.message });
    throw ApiError.internal('Failed to generate calendar file');
  }
};

export const cancelByToken = async (req: Request, res: Response) => {
  const token = req.params.token;
  if (!token) throw ApiError.badRequest('token required');
  try { logger.info('public.cancelByToken.called', { token: String(token).slice(0,8) + '...', ip: req.ip }); } catch {}
  const booking = await repo.findBookingByManageToken(token);
  if (!booking) throw ApiError.notFound('Booking not found');
  await service.cancelBooking(booking.id);
  return res.json({ ok: true });
};

export const rescheduleByToken = async (req: Request, res: Response) => {
  const token = req.params.token;
  if (!token) throw ApiError.badRequest('token required');
  const { date, start_time } = req.body || {};
  if (!date || !start_time) throw ApiError.badRequest('date and start_time required');
  try { logger.info('public.rescheduleByToken.called', { token: String(token).slice(0,8) + '...', ip: req.ip, date, start_time }); } catch {}
  const booking = await repo.findBookingByManageToken(token);
  if (!booking) throw ApiError.notFound('Booking not found');
  const updated = await service.rescheduleBooking(booking.id, date, start_time);
  return res.json(updated);
};
