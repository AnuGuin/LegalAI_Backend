import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
declare class AuthController {
    register(req: Request, res: Response, next: NextFunction): Promise<void>;
    login(req: Request, res: Response, next: NextFunction): Promise<void>;
    refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
    logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    googleCallback(req: Request, res: Response, next: NextFunction): Promise<void>;
    metaCallback(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=auth.controller.d.ts.map