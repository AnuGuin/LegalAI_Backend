import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
declare class DocumentController {
    generateDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    deleteDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: DocumentController;
export default _default;
//# sourceMappingURL=document.controller.d.ts.map