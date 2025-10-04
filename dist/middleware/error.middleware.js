import { logger } from '../utils/logger.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
/**
 * Custom application error class
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
/**
 * Global error handler middleware
 * Catches all errors and sends appropriate response
 */
export const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
    });
    // Handle AppError (custom errors)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
    }
    // Handle Prisma errors
    if (err instanceof PrismaClientKnownRequestError) {
        return handlePrismaError(err, res);
    }
    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.message,
            code: 'VALIDATION_ERROR',
        });
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            code: 'INVALID_TOKEN',
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired',
            code: 'TOKEN_EXPIRED',
        });
    }
    // Handle multer errors (file upload)
    if (err.name === 'MulterError') {
        return handleMulterError(err, res);
    }
    // Default error response
    const statusCode = 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
    return res.status(statusCode).json({
        success: false,
        message,
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err
        }),
    });
};
/**
 * Handle Prisma database errors
 */
function handlePrismaError(err, res) {
    switch (err.code) {
        case 'P2002':
            // Unique constraint violation
            return res.status(409).json({
                success: false,
                message: 'A record with this information already exists',
                code: 'DUPLICATE_ENTRY',
                field: err.meta?.target?.join(', '),
            });
        case 'P2025':
            // Record not found
            return res.status(404).json({
                success: false,
                message: 'Record not found',
                code: 'NOT_FOUND',
            });
        case 'P2003':
            // Foreign key constraint violation
            return res.status(400).json({
                success: false,
                message: 'Invalid reference to related record',
                code: 'FOREIGN_KEY_ERROR',
            });
        case 'P2014':
            // Invalid ID
            return res.status(400).json({
                success: false,
                message: 'Invalid ID provided',
                code: 'INVALID_ID',
            });
        default:
            return res.status(500).json({
                success: false,
                message: 'Database error occurred',
                code: 'DATABASE_ERROR',
                ...(process.env.NODE_ENV === 'development' && {
                    prismaCode: err.code
                }),
            });
    }
}
/**
 * Handle Multer file upload errors
 */
function handleMulterError(err, res) {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB',
            code: 'FILE_TOO_LARGE',
        });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
            success: false,
            message: 'Too many files',
            code: 'TOO_MANY_FILES',
        });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            success: false,
            message: 'Unexpected file field',
            code: 'UNEXPECTED_FILE',
        });
    }
    return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
        code: 'UPLOAD_ERROR',
    });
}
/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
/**
 * Not found error handler
 * Should be placed after all routes
 */
export const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
    next(error);
};
//# sourceMappingURL=error.middleware.js.map