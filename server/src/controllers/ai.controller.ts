import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { AIChatRequest, AICropRecommendationRequest, AIIrrigationRequest, AICentreRecommendationRequest } from '@smart-farmer/shared';

export class AIController {
  static async chat(req: Request, res: Response) {
    const chatRequest: AIChatRequest = req.body;
    const reply = await AIService.chat(chatRequest, req.user?.id);
    res.json({ success: true, reply });
  }

  static async cropRecommendation(req: Request, res: Response) {
    const body: AICropRecommendationRequest = req.body;
    const recommendation = await AIService.recommendCrops(body);
    res.json({ success: true, recommendation });
  }

  static async diseaseDetection(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a leaf/crop image.' });
    }

    const diagnosis = await AIService.detectDisease(req.file.path, req.file.mimetype);
    res.json({ success: true, diagnosis });
  }

  static async irrigation(req: Request, res: Response) {
    const body: AIIrrigationRequest = req.body;
    const advisory = await AIService.recommendIrrigation(body);
    res.json({ success: true, advisory });
  }

  static async centreRecommendation(req: Request, res: Response) {
    const body: AICentreRecommendationRequest = req.body;
    const recommendation = await AIService.recommendCentre(body);
    res.json({ success: true, recommendation });
  }
}
