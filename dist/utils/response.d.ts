import type { Response } from 'express';
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly ACCEPTED: 202;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly METHOD_NOT_ALLOWED: 405;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: {
        code: string;
        details?: any;
        stack?: string;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
        pagination?: PaginationMeta;
        version?: string;
    };
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export declare class ResponseBuilder {
    private response;
    constructor();
    static create(): ResponseBuilder;
    success(success?: boolean): ResponseBuilder;
    message(message: string): ResponseBuilder;
    data<T>(data: T): ResponseBuilder;
    error(code: string, details?: any, stack?: string): ResponseBuilder;
    requestId(requestId: string): ResponseBuilder;
    pagination(meta: PaginationMeta): ResponseBuilder;
    version(version: string): ResponseBuilder;
    build(): ApiResponse;
}
export declare class ApiResponseUtil {
    private static logResponse;
    static success<T>(res: Response, message?: string, data?: T, statusCode?: number): Response;
    static created<T>(res: Response, message?: string, data?: T): Response;
    static noContent(res: Response, message?: string): Response;
    static error(res: Response, message: string, statusCode?: number, errorCode?: string, details?: any): Response;
    static badRequest(res: Response, message?: string, details?: any): Response;
    static unauthorized(res: Response, message?: string): Response;
    static forbidden(res: Response, message?: string): Response;
    static notFound(res: Response, message?: string): Response;
    static conflict(res: Response, message?: string, details?: any): Response;
    static validationError(res: Response, message?: string, validationErrors?: ValidationError[]): Response;
    static tooManyRequests(res: Response, message?: string, retryAfter?: number): Response;
    static internalError(res: Response, message?: string, error?: Error): Response;
    static paginated<T>(res: Response, data: T[], pagination: {
        page: number;
        limit: number;
        total: number;
    }, message?: string): Response;
    static health(res: Response, services?: Record<string, 'healthy' | 'unhealthy' | 'degraded'>): Response;
    static file(res: Response, filePath: string, fileName?: string, contentType?: string): void;
    static download(res: Response, filePath: string, fileName: string): void;
}
export declare const addRequestId: (req: any, res: Response, next: any) => void;
export declare const asyncHandler: (fn: Function) => (req: any, res: Response, next: any) => void;
export declare const errorHandler: (error: any, req: any, res: Response, next: any) => void;
export default ApiResponseUtil;
//# sourceMappingURL=response.d.ts.map