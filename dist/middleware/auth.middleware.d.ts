import type { Request } from 'express';
import type { Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
        name: string | null;
        avatar: string | null;
        provider: string;
    };
}
export interface OptionalAuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string | null;
        avatar: string | null;
        provider: string;
    };
}
/**
 * Middleware to authenticate requests using JWT token
 * Extracts token from Authorization header and verifies it
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if missing
 */
export declare const optionalAuth: (req: OptionalAuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map