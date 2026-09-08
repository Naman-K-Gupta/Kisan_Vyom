import { Router } from 'express';
import { CropController } from '../controllers/crop.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Master catalog
router.get('/', CropController.getAllCrops);
router.post('/', authenticate, requireRole(['ADMIN']), CropController.createCrop);

// Farmer crops
router.get('/my-crops', authenticate, CropController.getFarmerCrops);
router.post('/my-crops', authenticate, CropController.addFarmerCrop);
router.put('/my-crops/:id', authenticate, CropController.updateFarmerCrop);
router.delete('/my-crops/:id', authenticate, CropController.deleteFarmerCrop);

export default router;
