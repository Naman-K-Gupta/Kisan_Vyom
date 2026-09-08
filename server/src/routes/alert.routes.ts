import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public / Authenticated view
router.get('/', AlertController.getAlerts);

// Admin creation / deletion
router.post('/', authenticate, requireRole(['ADMIN']), AlertController.createAlert);
router.delete('/:id', authenticate, requireRole(['ADMIN']), AlertController.deleteAlert);

export default router;
