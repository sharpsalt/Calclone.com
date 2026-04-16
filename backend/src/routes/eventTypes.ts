import { Router } from 'express';
import * as controller from '../controllers/eventTypeController';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateBody } from '../middlewares/validateBody';
import { createEventTypeSchema, updateEventTypeSchema } from '../validators/eventTypes';

const router = Router();

router.get('/', asyncHandler(controller.list));
router.get('/slug/:slug', asyncHandler(controller.getBySlug));
router.get('/public/:username', asyncHandler(controller.getPublicProfile));
router.post('/', validateBody(createEventTypeSchema), asyncHandler(controller.create));
router.put('/:id', validateBody(updateEventTypeSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

export default router;
