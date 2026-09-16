import { Router } from 'express';
import { SchemeController } from '../controllers/scheme.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public / Authenticated discovery
router.get('/', SchemeController.getAll);
router.get('/:id', SchemeController.getById);

// Admin policy publishing & updates
router.post('/', authenticate, requireRole(['ADMIN']), SchemeController.create);
router.put('/:id', authenticate, requireRole(['ADMIN']), SchemeController.update);
router.delete('/:id', authenticate, requireRole(['ADMIN']), SchemeController.delete);

export default router;
