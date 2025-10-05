import type { Response } from 'express';
import type { NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
interface AuthRequestWithFile extends AuthRequest {
    file?: Express.Multer.File;
}
declare class ChatController {
    /**
     * Create a new conversation
     * - NORMAL mode: Simple chat, no session_id or document required
     * - AGENTIC mode: AI agent with tools, uses session_id, document is optional
     */
    createConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Send a message in a conversation
     * - NORMAL mode: Simple chat response
     * - AGENTIC mode: AI agent with tools, maintains session_id, can include document for context
     * - File upload: Supported in AGENTIC mode for document analysis
     *
     * Request format:
     * - Content-Type: multipart/form-data (when sending file)
     * - Content-Type: application/json (when no file)
     *
     * Body fields:
     * - message: string (required)
     * - mode: 'NORMAL' | 'AGENTIC' (required)
     * - file: File (optional, for AGENTIC mode)
     */
    sendMessage(req: AuthRequestWithFile, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getConversationMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getConversationInfo(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    deleteConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    deleteAllConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: ChatController;
export default _default;
//# sourceMappingURL=chat.controller.d.ts.map