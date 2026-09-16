import { Router } from 'express';
import { FarmerController } from '../controllers/farmer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/profile', FarmerController.getProfile);
router.put('/profile', FarmerController.updateProfile);
router.post('/profile-picture', upload.single('picture'), FarmerController.uploadProfilePicture);
router.delete('/profile-picture', FarmerController.deleteProfilePicture);
router.put('/notification-preferences', FarmerController.updateNotificationPreferences);
router.get('/bank-details', FarmerController.getBankDetails);
router.put('/bank-details', FarmerController.updateBankDetails);

export default router;
