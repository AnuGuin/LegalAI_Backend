import { Router } from 'express';
import multer from 'multer';
import chatController from './chat.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow only specific file types for document upload
        const allowedTypes = ['application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
        }
    }
});
// All routes require authentication
router.use(authenticate);
router.post('/conversations', chatController.createConversation);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId', chatController.getConversationMessages);
router.get('/conversations/:conversationId/info', chatController.getConversationInfo);
router.post('/conversations/:conversationId/messages', upload.single('file'), chatController.sendMessage);
router.delete('/conversations/:conversationId', chatController.deleteConversation);
export default router;
//# sourceMappingURL=chat.route.js.map