import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import translationController from './translation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * POST /api/v1/translation/translate
 * Translate text from source language to target language
 * 
 * Request Body:
 * - text: string (required) - The text to translate
 * - sourceLang: string (required) - Source language code (e.g., 'en', 'hi', 'es')
 * - targetLang: string (required) - Target language code (e.g., 'en', 'hi', 'es')
 */
router.post('/translate', (req: Request, res: Response, next: NextFunction) =>
  translationController.translate(req as AuthRequest, res, next)
);

/**
 * Request Body:
 * - text: string (required) - The text to analyze
 */
router.post('/detect-language', (req: Request, res: Response, next: NextFunction) =>
  translationController.detectLanguage(req as AuthRequest, res, next)
);

/**
 * GET /api/v1/translation/history
 * Retrieve user's translation history
 * 
 * Response:
 * - Array of translation records (up to 50 most recent)
 */
router.get('/history', (req: Request, res: Response, next: NextFunction) =>
  translationController.getUserTranslations(req as AuthRequest, res, next)
);

export default router;