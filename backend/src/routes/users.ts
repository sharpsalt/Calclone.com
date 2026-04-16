import { Router } from 'express';
import * as controller from '../controllers/usersController';
import { asyncHandler } from '../middlewares/asyncHandler';
import multer from 'multer';
import path from 'path';

const upload = multer({ dest: path.resolve(__dirname, '..', '..', 'uploads', 'avatars') });

const router = Router();

router.get('/me', asyncHandler(controller.me));
router.put('/:id', asyncHandler(controller.update));
router.post('/:id/avatar', upload.single('avatar'), asyncHandler(controller.uploadAvatar));
router.delete('/:id/avatar', asyncHandler(controller.deleteAvatar));

// Email management
router.get('/:id/emails', asyncHandler(controller.listEmails));
router.post('/:id/emails', asyncHandler(controller.addEmail));
router.delete('/:id/emails/:email', asyncHandler(controller.removeEmail));
router.post('/:id/emails/:email/primary', asyncHandler(controller.setPrimaryEmail));

export default router;
