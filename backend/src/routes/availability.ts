import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as controller from '../controllers/availabilityController';
import { validateBody } from '../middlewares/validateBody';
import { upsertAvailabilitySchema, upsertScheduleSchema } from '../validators/availability';

const router = Router();

router.get('/', asyncHandler(controller.getAvailability));
router.post('/', validateBody(upsertAvailabilitySchema), asyncHandler(controller.upsertAvailability));

// schedules listing & CRUD
router.get('/schedules', asyncHandler(controller.listSchedules));
router.post('/schedules', validateBody(upsertScheduleSchema), asyncHandler(controller.createSchedule));
router.get('/schedules/:id', asyncHandler(controller.getSchedule));
router.put('/schedules/:id', validateBody(upsertScheduleSchema), asyncHandler(controller.updateSchedule));
router.delete('/schedules/:id', asyncHandler(controller.deleteSchedule));

export default router;
