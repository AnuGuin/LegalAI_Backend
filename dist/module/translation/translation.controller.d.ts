import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
declare class TranslationController {
    translate(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    detectLanguage(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getUserTranslations(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: TranslationController;
export default _default;
//# sourceMappingURL=translation.controller.d.ts.map