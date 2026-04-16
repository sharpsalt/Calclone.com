import { Router } from 'express';
import * as controller from '../controllers/featureFlagsController';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// GET /api/feature-flags -> { features: {...} }
router.get('/', asyncHandler(controller.getFlags));
// GET /api/feature-flags/:name -> { feature, enabled }
router.get('/:name', asyncHandler(controller.isEnabled));

export default router;
