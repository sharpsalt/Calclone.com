import logger from './logger';
import { sendBookingConfirmation } from '../services/emailService';

export async function addBullJob(name: string, payload: any, opts: any = {}) {
  try {
    // Instead of using BullMQ, execute the email job directly in the background
    if (name === 'sendEmail' || name === 'sendBookingConfirmation') {
      const bookingId = payload?.bookingId || payload?.booking_id;
      if (bookingId) {
        // Fire and forget so we don't block the API response
        sendBookingConfirmation(String(bookingId)).catch(err => {
          logger.error('Background email failed', { err: (err as Error).message });
        });
      }
    }
    return true;
  } catch (err) {
    logger.error('addBullJob error', { err: (err as Error).message, name });
    return false;
  }
}

export default {
  addBullJob,
};