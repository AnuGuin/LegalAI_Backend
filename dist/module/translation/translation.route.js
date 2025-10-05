import { Router } from 'express';
import translationController from './translation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
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
router.post('/translate', (req, res, next) => translationController.translate(req, res, next));
/**
 * Request Body:
 * - text: string (required) - The text to analyze
 */
router.post('/detect-language', (req, res, next) => translationController.detectLanguage(req, res, next));
/**
 * GET /api/v1/translation/history
 * Retrieve user's translation history
 *
 * Response:
 * - Array of translation records (up to 50 most recent)
 */
router.get('/history', (req, res, next) => translationController.getUserTranslations(req, res, next));
export default router;
//# sourceMappingURL=translation.route.js.map