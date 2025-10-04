import { logger } from '../utils/logger.js';
// HTTP Status Codes
export const HTTP_STATUS = {
    // Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    // Client Errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    // Server Errors
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
};
// Response builder class
export class ResponseBuilder {
    response;
    constructor() {
        this.response = {
            success: true,
            message: '',
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }
    static create() {
        return new ResponseBuilder();
    }
    success(success = true) {
        this.response.success = success;
        return this;
    }
    message(message) {
        this.response.message = message;
        return this;
    }
    data(data) {
        this.response.data = data;
        return this;
    }
    error(code, details, stack) {
        this.response.success = false;
        this.response.error = {
            code,
            ...(details && { details }),
            ...(stack && process.env.NODE_ENV !== 'production' && { stack }),
        };
        return this;
    }
    requestId(requestId) {
        if (!this.response.meta) {
            this.response.meta = { timestamp: new Date().toISOString() };
        }
        this.response.meta.requestId = requestId;
        return this;
    }
    pagination(meta) {
        if (!this.response.meta) {
            this.response.meta = { timestamp: new Date().toISOString() };
        }
        this.response.meta.pagination = meta;
        return this;
    }
    version(version) {
        if (!this.response.meta) {
            this.response.meta = { timestamp: new Date().toISOString() };
        }
        this.response.meta.version = version;
        return this;
    }
    build() {
        return this.response;
    }
}
// Utility class for common responses
export class ApiResponseUtil {
    static logResponse(statusCode, message, data, error) {
        const logData = {
            statusCode,
            message,
            ...(data && { dataType: typeof data }),
            ...(error && { error: error.code || error.message }),
        };
        if (statusCode >= 500) {
            logger.error(`API Response: ${message}`, error, logData);
        }
        else if (statusCode >= 400) {
            logger.warn(`API Response: ${message}`, logData);
        }
        else {
            logger.info(`API Response: ${message}`, logData);
        }
    }
    // Success responses
    static success(res, message = 'Success', data, statusCode = HTTP_STATUS.OK) {
        const response = ResponseBuilder.create()
            .success(true)
            .message(message)
            .data(data)
            .build();
        this.logResponse(statusCode, message, data);
        return res.status(statusCode).json(response);
    }
    static created(res, message = 'Resource created successfully', data) {
        return this.success(res, message, data, HTTP_STATUS.CREATED);
    }
    static noContent(res, message = 'No content') {
        const response = ResponseBuilder.create()
            .success(true)
            .message(message)
            .build();
        this.logResponse(HTTP_STATUS.NO_CONTENT, message);
        return res.status(HTTP_STATUS.NO_CONTENT).json(response);
    }
    // Error responses
    static error(res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode, details) {
        const response = ResponseBuilder.create()
            .success(false)
            .message(message)
            .error(errorCode || 'INTERNAL_ERROR', details)
            .build();
        this.logResponse(statusCode, message, undefined, { code: errorCode, details });
        return res.status(statusCode).json(response);
    }
    static badRequest(res, message = 'Bad request', details) {
        return this.error(res, message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', details);
    }
    static unauthorized(res, message = 'Unauthorized access') {
        return this.error(res, message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
    }
    static forbidden(res, message = 'Forbidden access') {
        return this.error(res, message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
    }
    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
    }
    static conflict(res, message = 'Resource conflict', details) {
        return this.error(res, message, HTTP_STATUS.CONFLICT, 'CONFLICT', details);
    }
    static validationError(res, message = 'Validation failed', validationErrors) {
        return this.error(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', validationErrors);
    }
    static tooManyRequests(res, message = 'Too many requests', retryAfter) {
        if (retryAfter) {
            res.set('Retry-After', retryAfter.toString());
        }
        return this.error(res, message, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
    }
    static internalError(res, message = 'Internal server error', error) {
        const errorDetails = error ? {
            name: error.name,
            message: error.message,
            ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
        } : undefined;
        return this.error(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', errorDetails);
    }
    // Paginated response
    static paginated(res, data, pagination, message = 'Data retrieved successfully') {
        const totalPages = Math.ceil(pagination.total / pagination.limit);
        const paginationMeta = {
            ...pagination,
            totalPages,
            hasNext: pagination.page < totalPages,
            hasPrev: pagination.page > 1,
        };
        const response = ResponseBuilder.create()
            .success(true)
            .message(message)
            .data(data)
            .pagination(paginationMeta)
            .build();
        this.logResponse(HTTP_STATUS.OK, message, { count: data.length, ...paginationMeta });
        return res.status(HTTP_STATUS.OK).json(response);
    }
    // Health check response
    static health(res, services) {
        const allHealthy = services ? Object.values(services).every(status => status === 'healthy') : true;
        const statusCode = allHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
        const healthData = {
            status: allHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            ...(services && { services }),
        };
        return this.success(res, 'Health check completed', healthData, statusCode);
    }
    // File response helpers
    static file(res, filePath, fileName, contentType) {
        if (fileName) {
            res.attachment(fileName);
        }
        if (contentType) {
            res.type(contentType);
        }
        logger.info('File download initiated', { filePath, fileName, contentType });
        res.sendFile(filePath);
    }
    static download(res, filePath, fileName) {
        logger.info('File download initiated', { filePath, fileName });
        res.download(filePath, fileName);
    }
}
// Middleware for adding request ID to responses
export const addRequestId = (req, res, next) => {
    req.requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.locals.requestId = req.requestId;
    next();
};
// Express middleware for handling async errors
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
// Error response formatter middleware
export const errorHandler = (error, req, res, next) => {
    // If response was already sent, delegate to Express default error handler
    if (res.headersSent) {
        return next(error);
    }
    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details = undefined;
    // Handle different error types
    if (error.name === 'ValidationError') {
        statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
        message = 'Validation failed';
        errorCode = 'VALIDATION_ERROR';
        details = error.details;
    }
    else if (error.name === 'UnauthorizedError' || error.status === 401) {
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        message = 'Unauthorized access';
        errorCode = 'UNAUTHORIZED';
    }
    else if (error.status) {
        statusCode = error.status;
        message = error.message;
    }
    else if (error.message) {
        message = error.message;
    }
    const response = ResponseBuilder.create()
        .success(false)
        .message(message)
        .error(errorCode, details, process.env.NODE_ENV !== 'production' ? error.stack : undefined)
        .requestId(res.locals.requestId)
        .build();
    logger.error(`Error handled: ${message}`, error, {
        statusCode,
        requestId: res.locals.requestId,
        url: req.url,
        method: req.method,
    });
    res.status(statusCode).json(response);
};
// Export default response utility
export default ApiResponseUtil;
//# sourceMappingURL=response.js.map