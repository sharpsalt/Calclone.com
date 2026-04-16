import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as controller from '../controllers/bookingsController';
import userRateLimit from '../middlewares/userRateLimit';
import { validateBody } from '../middlewares/validateBody';
import { createBookingSchema } from '../validators/bookings';

const router = Router();

// Admin endpoints assume the admin is already authenticated and available on `req.user`.
// Apply per-user rate limit (10 req/sec per user).
router.post('/', userRateLimit({ windowMs: 1000, max: 10, keyPrefix: 'admin:bookings', userIdFrom: 'both' }), validateBody(createBookingSchema), asyncHandler(controller.create));

export default router;
