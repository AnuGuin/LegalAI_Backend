import { Router } from 'express';
import documentController from './document.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { body, param, validationResult } from 'express-validator';
const router = Router();
// Apply authentication middleware to all routes
router.use(authenticate);
// Validation middleware
const validateRequest = (req, res, next) => {
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
router.post('/', generateDocumentValidation, validateRequest, (req, res, next) => documentController.generateDocument(req, res, next));
router.get('/', (req, res, next) => documentController.getDocuments(req, res, next));
router.get('/:id', documentIdValidation, validateRequest, (req, res, next) => documentController.getDocument(req, res, next));
router.delete('/:id', documentIdValidation, validateRequest, (req, res, next) => documentController.deleteDocument(req, res, next));
export default router;
//# sourceMappingURL=document.route.js.map