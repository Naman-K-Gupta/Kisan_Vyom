import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.patch('/:id/read', NotificationController.markAsRead);
router.post('/read-all', NotificationController.markAllAsRead);
router.post('/test-telegram', NotificationController.sendTestTelegram);
router.get('/telegram-status', NotificationController.getTelegramStatus);
router.post('/link-telegram', NotificationController.linkTelegramManually);

export default router;
