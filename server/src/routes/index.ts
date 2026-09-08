import { Router } from 'express';
import authRoutes from './auth.routes';
import farmerRoutes from './farmer.routes';
import cropRoutes from './crop.routes';
import centreRoutes from './centre.routes';
import queueRoutes from './queue.routes';
import priceRoutes from './price.routes';
import weatherRoutes from './weather.routes';
import aiRoutes from './ai.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import alertRoutes from './alert.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/farmers', farmerRoutes);
router.use('/crops', cropRoutes);
router.use('/procurement-centres', centreRoutes);
router.use('/queue', queueRoutes);
router.use('/prices', priceRoutes);
router.use('/weather', weatherRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/alerts', alertRoutes);

export default router;
