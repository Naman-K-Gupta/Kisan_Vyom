import { Router } from 'express';
import { PriceController } from '../controllers/price.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// MSP Prices
router.get('/government', PriceController.getGovernmentPrices);
router.post('/government', authenticate, requireRole(['ADMIN']), PriceController.createGovernmentPrice);
router.put('/government/:id', authenticate, requireRole(['ADMIN']), PriceController.updateGovernmentPrice);
router.delete('/government/:id', authenticate, requireRole(['ADMIN']), PriceController.deleteGovernmentPrice);

// APMC Market Mandi Prices
router.get('/market', PriceController.getMarketPrices);

export default router;
