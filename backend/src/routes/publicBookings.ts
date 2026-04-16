import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as controller from '../controllers/publicBookingsController';

const router = Router();

// Public management endpoints keyed by unguessable token
router.get('/manage/:token', asyncHandler(controller.getBookingByToken));
router.get('/manage/:token/ics', asyncHandler(controller.getIcsByToken));
router.post('/manage/:token/cancel', asyncHandler(controller.cancelByToken));
router.post('/manage/:token/reschedule', asyncHandler(controller.rescheduleByToken));

export default router;
