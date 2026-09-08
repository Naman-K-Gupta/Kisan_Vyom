import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireRole(['ADMIN']));

router.get('/stats', AdminController.getStats);
router.get('/farmers', AdminController.getAllFarmers);
router.patch('/users/:userId/status', AdminController.toggleUserStatus);
router.get('/managers', AdminController.getAllManagers);
router.post('/managers/assign', AdminController.assignManager);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
