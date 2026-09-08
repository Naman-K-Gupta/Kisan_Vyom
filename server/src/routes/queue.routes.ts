import { Router } from 'express';
import { QueueController } from '../controllers/queue.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Farmer joins queue
router.post('/join', authenticate, requireRole(['FARMER']), QueueController.joinQueue);

// Farmer gets active token
router.get('/my-token', authenticate, requireRole(['FARMER']), QueueController.getActiveToken);

// Live Centre Queue Board (Public/Authenticated)
router.get('/centre/:centreId', QueueController.getCentreQueue);

// Manager Queue Operations
router.post(
  '/:id/call',
  authenticate,
  requireRole(['PROCUREMENT_CENTRE_MANAGER', 'ADMIN']),
  QueueController.callToken
);

router.post(
  '/:id/start',
  authenticate,
  requireRole(['PROCUREMENT_CENTRE_MANAGER', 'ADMIN']),
  QueueController.startProcessing
);

router.post(
  '/:id/complete',
  authenticate,
  requireRole(['PROCUREMENT_CENTRE_MANAGER', 'ADMIN']),
  QueueController.completeProcurement
);

router.post(
  '/:id/skip',
  authenticate,
  requireRole(['PROCUREMENT_CENTRE_MANAGER', 'ADMIN']),
  QueueController.skipToken
);

router.post('/:id/cancel', authenticate, QueueController.cancelToken);

router.post(
  '/centre/:centreId/toggle-pause',
  authenticate,
  requireRole(['PROCUREMENT_CENTRE_MANAGER', 'ADMIN']),
  QueueController.toggleQueuePause
);

export default router;
