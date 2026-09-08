import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Chatbot (optional auth for personalized response)
router.post('/chat', AIController.chat);

// Crop Recommendation
router.post('/crop-recommendation', AIController.cropRecommendation);

// Disease Detection from Leaf Image
router.post('/disease-detection', upload.single('image'), AIController.diseaseDetection);

// Irrigation Recommendation
router.post('/irrigation', AIController.irrigation);

// Centre Recommendation
router.post('/procurement-recommendation', AIController.centreRecommendation);

export default router;
