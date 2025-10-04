import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import documentController from './document.controller.js';
import { authenticate, type AuthRequest } from '../../middleware/auth.middleware.js';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Generate document validation
const generateDocumentValidation = [
  body('prompt')
    .isString()
    .notEmpty()
    .withMessage('Prompt is required and must be a non-empty string')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Prompt must be between 10 and 5000 characters'),
  body('format')
    .optional()
    .isString()
    .isIn(['pdf', 'docx', 'txt'])
    .withMessage('Format must be one of: pdf, docx, txt'),
];

// Document ID validation
const documentIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Document ID must be a valid UUID'),
];

router.post(
  '/',
  generateDocumentValidation,
  validateRequest,
  (req: Request, res: Response, next: NextFunction) =>
    documentController.generateDocument(req as AuthRequest, res, next)
);


router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) =>
    documentController.getDocuments(req as AuthRequest, res, next)
);


router.get(
  '/:id',
  documentIdValidation,
  validateRequest,
  (req: Request, res: Response, next: NextFunction) =>
    documentController.getDocument(req as AuthRequest, res, next)
);


router.delete(
  '/:id',
  documentIdValidation,
  validateRequest,
  (req: Request, res: Response, next: NextFunction) =>
    documentController.deleteDocument(req as AuthRequest, res, next)
);

export default router;
