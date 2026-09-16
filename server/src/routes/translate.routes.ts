import { Router } from 'express';
import { TranslateController } from '../controllers/translate.controller';

const router = Router();

router.post('/', TranslateController.translate);
router.get('/supported-languages', TranslateController.getSupportedLanguages);

export default router;
