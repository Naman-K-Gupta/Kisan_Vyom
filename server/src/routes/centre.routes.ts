import { Router } from 'express';
import { CentreController } from '../controllers/centre.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public / Farmer discovery
router.get('/', CentreController.getAllCentres);
router.get('/:id', CentreController.getCentreById);

// Admin centre creation
router.post('/', authenticate, requireRole(['ADMIN']), CentreController.createCentre);

// Manager or Admin live capacity update
router.patch(
  '/:id/capacity',
  authenticate,
  requireRole(['PROCUREMENT_CENTRE_MANAGER', 'ADMIN']),
  CentreController.updateCapacity
);

export default router;
