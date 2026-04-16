import logger from '../lib/logger';
import { pool } from '../db';
import nodemailer from 'nodemailer';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatIcsDateUTC(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;
}

function generateIcsForBooking(booking: any) {
  const uid = `${booking.id}@calclone.local`;
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  // Normalize booking.date to YYYY-MM-DD string if it's a Date object
  let dateStr: string;
  if (typeof booking.date === 'string') {
    dateStr = booking.date.split('T')[0];
  } else if (booking.date instanceof Date) {
    dateStr = booking.date.toISOString().slice(0, 10);
  } else {
    dateStr = String(booking.date).slice(0, 10);
  }

  const dtstart = formatIcsDateUTC(dateStr, booking.start_time.slice(0,5));
  const dtend = formatIcsDateUTC(dateStr, (booking.end_time || booking.start_time).slice(0,5));
  const summary = booking.event_title || 'Event';
  const organizer = process.env.DEV_ADMIN_EMAIL || 'no-reply@calclone.example';
  const description = `Booking for ${summary}\nManage: ${process.env.PUBLIC_BASE_URL || 'http://localhost:5173'}/manage/${booking.manage_token}`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calclone//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `ORGANIZER:MAILTO:${organizer}`,
    `ATTENDEE;CN=${booking.booker_name}:MAILTO:${booking.booker_email}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

export async function sendBookingConfirmation(bookingId: string) {
  try {
    const res = await pool.query(
      'SELECT b.*, et.title as event_title, et.slug as event_slug, et.host_name, et.host_timezone FROM bookings b LEFT JOIN event_types et ON et.id=b.event_type_id WHERE b.id=$1 LIMIT 1',
      [bookingId]
    );
    const booking = res.rows[0];
    if (!booking) {
      logger.info('sendBookingConfirmation: booking not found', { bookingId });
      return;
    }

    const to = booking.booker_email;
    const subject = `Your booking is confirmed: ${booking.event_title || 'Event'}`;
    const manageFrontendUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:5173'}/manage/${booking.manage_token}`;
    const apiRescheduleUrl = `${process.env.API_BASE_URL || process.env.APP_URL || 'http://localhost:3000'}/api/public/manage/${booking.manage_token}/reschedule`;
    const apiCancelUrl = `${process.env.API_BASE_URL || process.env.APP_URL || 'http://localhost:3000'}/api/public/manage/${booking.manage_token}/cancel`;

    const html = `
      <p>Hi ${booking.booker_name},</p>
      <p>Your booking for <strong>${booking.event_title}</strong> on <strong>${String(booking.date)}</strong> at <strong>${booking.start_time}</strong> is confirmed.</p>
      <p>Manage your booking: <a href="${manageFrontendUrl}">Change or cancel</a></p>
      <p>Or use API links: Reschedule: <code>${apiRescheduleUrl}</code> Cancel: <code>${apiCancelUrl}</code></p>
    `;

    const ics = generateIcsForBooking(booking);
    const icsBase64 = Buffer.from(ics, 'utf8').toString('base64');

    // Notify attendee (with ICS) and host (simple notification)
    const hostEmail = process.env.HOST_NOTIFICATION_EMAIL || process.env.DEV_ADMIN_EMAIL || null;

    // SMTP settings (support unauthenticated SMTP for local MailHog)
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : (process.env.GMAIL_APP_PASSWORD ? 465 : undefined);
    const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER;
    const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    const canUseSmtp = Boolean(SMTP_HOST) || (SMTP_USER && SMTP_PASS);

    if (canUseSmtp) {
      try {
        const host = SMTP_HOST || 'smtp.gmail.com';
        const port = SMTP_PORT || (SMTP_USER && SMTP_PASS ? 465 : 587);

        const transporterOptions: any = {
          host,
          port,
          secure: Number(port) === 465,
        };
        if (SMTP_USER && SMTP_PASS) transporterOptions.auth = { user: SMTP_USER, pass: SMTP_PASS };

        const transporter = nodemailer.createTransport(transporterOptions);

        await transporter.sendMail({
          from: process.env.FROM_EMAIL || 'no-reply@calclone.example',
          to,
          subject,
          html,
          attachments: [
            {
              filename: 'invite.ics',
              content: ics,
              contentType: 'text/calendar; charset=utf-8; method=REQUEST',
            },
          ],
        });
        logger.info('sendBookingConfirmation: sent via SMTP (nodemailer)', { bookingId, to });

        if (hostEmail) {
          try {
            await transporter.sendMail({
              from: process.env.FROM_EMAIL || 'no-reply@calclone.example',
              to: hostEmail,
              subject: `New booking: ${booking.event_title} (${booking.date} ${booking.start_time})`,
              html: `<p>New booking by ${booking.booker_name} (${booking.booker_email}) for ${booking.event_title} at ${booking.date} ${booking.start_time}.</p>`,
            });
            logger.info('sendBookingConfirmation: host notified via SMTP', { bookingId, hostEmail });
          } catch (err) {
            logger.error('sendBookingConfirmation: host notify failed (SMTP)', { err: (err as Error).message });
          }
        }

        return;
      } catch (err) {
        logger.error('SMTP send failed', { err: (err as Error).message });
        // fall through to other providers
      }
    }

    // Prefer SendGrid for attachments; fall back to Resend without attachment if necessary
    if (SENDGRID_API_KEY) {
      try {
        // Attendee email with ICS attachment
        await (globalThis as any).fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: 'no-reply@calclone.example' },
            subject,
            content: [{ type: 'text/html', value: html }],
            attachments: [
              {
                content: icsBase64,
                filename: 'invite.ics',
                type: 'text/calendar',
                disposition: 'attachment',
              },
            ],
          }),
        });
        logger.info('sendBookingConfirmation: sent via SendGrid', { bookingId, to });

        if (hostEmail) {
          try {
            await (globalThis as any).fetch('https://api.sendgrid.com/v3/mail/send', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: hostEmail }] }],
                from: { email: 'no-reply@calclone.example' },
                subject: `New booking: ${booking.event_title} (${booking.date} ${booking.start_time})`,
                content: [{ type: 'text/html', value: `<p>New booking by ${booking.booker_name} (${booking.booker_email}) for ${booking.event_title} at ${booking.date} ${booking.start_time}.</p>` }],
              }),
            });
            logger.info('sendBookingConfirmation: host notified', { bookingId, hostEmail });
          } catch (err) {
            logger.error('sendBookingConfirmation: host notify failed', { err: (err as Error).message });
          }
        }

        return;
      } catch (err) {
        logger.error('SendGrid send failed', { err: (err as Error).message });
        // fall through to Resend or log
      }
    }

    if (RESEND_API_KEY) {
      try {
        await (globalThis as any).fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'no-reply@calclone.example',
            to,
            subject,
            html,
            // Attempt attachments; if Resend doesn't accept this shape it may be ignored
            attachments: [
              {
                type: 'text/calendar',
                filename: 'invite.ics',
                content: icsBase64,
              },
            ],
          }),
        });
        logger.info('sendBookingConfirmation: resent via Resend', { bookingId, to });

        if (hostEmail) {
          try {
            await (globalThis as any).fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'no-reply@calclone.example',
                to: hostEmail,
                subject: `New booking: ${booking.event_title} (${booking.date} ${booking.start_time})`,
                html: `<p>New booking by ${booking.booker_name} (${booking.booker_email}) for ${booking.event_title} at ${booking.date} ${booking.start_time}.</p>`,
              }),
            });
            logger.info('sendBookingConfirmation: host notified via Resend', { bookingId, hostEmail });
          } catch (err) {
            logger.error('sendBookingConfirmation: host notify failed (resend)', { err: (err as Error).message });
          }
        }

        return;
      } catch (err) {
        logger.error('Resend send failed', { err: (err as Error).message });
      }
    }

    logger.info('No email provider configured; skipping send', { bookingId, to });
  } catch (err) {
    logger.error('sendBookingConfirmation error', { err: (err as Error).message, bookingId });
    throw err;
  }
}
