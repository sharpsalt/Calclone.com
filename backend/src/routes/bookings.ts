import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as controller from '../controllers/bookingsController';
import { validateBody } from '../middlewares/validateBody';
import redisRateLimit from '../middlewares/redisRateLimit';
import userRateLimit from '../middlewares/userRateLimit';
import {
  addBookingGuestsSchema,
  createBookingSchema,
  reportBookingSchema,
  requestRescheduleSchema,
  rescheduleBookingSchema,
  updateBookingLocationSchema,
} from '../validators/bookings';

const router = Router();

// Public slots endpoint: limit to 60 requests per minute per IP
router.get('/slots', redisRateLimit({ windowMs: 60_000, max: 60, keyPrefix: 'public:slots' }), asyncHandler(controller.listSlots));

// Booking creation: basic per-IP limiter + idempotency handling. For admin workflows use the admin router which applies per-user limits.
router.post('/', redisRateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'bookings:create' }), validateBody(createBookingSchema), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.list));
router.post('/:id/request-reschedule', validateBody(requestRescheduleSchema), asyncHandler(controller.requestReschedule));
router.post('/:id/reschedule', validateBody(rescheduleBookingSchema), asyncHandler(controller.reschedule));
router.put('/:id/location', validateBody(updateBookingLocationSchema), asyncHandler(controller.updateLocation));
router.post('/:id/guests', validateBody(addBookingGuestsSchema), asyncHandler(controller.addGuests));
router.post('/:id/no-show', asyncHandler(controller.markNoShow));
router.post('/:id/report', validateBody(reportBookingSchema), asyncHandler(controller.report));
router.get('/:id', asyncHandler(controller.getById));
router.delete('/:id', asyncHandler(controller.cancel));

export default router;
