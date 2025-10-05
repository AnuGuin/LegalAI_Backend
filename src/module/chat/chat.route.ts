import { Router } from 'express';
import type { RequestHandler } from 'express';
import multer from 'multer';
import chatController from './chat.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

/**
 * Multer configuration for file uploads
 * Used in AGENTIC mode for document analysis
 * Supports PDF, DOC, DOCX, and TXT files up to 10MB
 */
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types for document upload in AGENTIC mode
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticate as RequestHandler);

/**
 * Chat Routes
 * Supports two modes:
 * - NORMAL: Simple chat without session tracking or documents
 * - AGENTIC: AI agent with tools, session tracking, and optional document context
 */

// Create a new conversation (body: { mode (required), title?, documentId?, documentName?, sessionId? })
router.post('/conversations', chatController.createConversation as RequestHandler);

// Get all conversations for the authenticated user
router.get('/conversations', chatController.getConversations as RequestHandler);

// Delete all conversations for the authenticated user
router.delete('/conversations', chatController.deleteAllConversations as RequestHandler);

// Get all messages in a conversation
router.get('/conversations/:conversationId', chatController.getConversationMessages as RequestHandler);

// Get conversation info (includes mode, documentId, sessionId)
router.get('/conversations/:conversationId/info', chatController.getConversationInfo as RequestHandler);

// Send a message (body: { message, mode }, optional file for AGENTIC mode)
router.post(
  '/conversations/:conversationId/messages',
  upload.single('file'),
  chatController.sendMessage as RequestHandler
);

// Delete a conversation
router.delete('/conversations/:conversationId', chatController.deleteConversation as RequestHandler);

export default router;