import type { Request } from 'express';
import type { Response, NextFunction } from 'express';
/**
 * Custom application error class
 */
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    code?: string | undefined;
    constructor(message: string, statusCode?: number, code?: string);
}
/**
 * Global error handler middleware
 * Catches all errors and sends appropriate response
 */
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Not found error handler
 * Should be placed after all routes
 */
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.middleware.d.ts.map