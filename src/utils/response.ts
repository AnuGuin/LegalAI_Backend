import type { Response } from 'express';
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
} as const;

// Response interfaces
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

// Response builder class
export class ResponseBuilder {
  private response: ApiResponse;

  constructor() {
    this.response = {
      success: true,
      message: '',
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  public static create(): ResponseBuilder {
    return new ResponseBuilder();
  }

  public success(success: boolean = true): ResponseBuilder {
    this.response.success = success;
    return this;
  }

  public message(message: string): ResponseBuilder {
    this.response.message = message;
    return this;
  }

  public data<T>(data: T): ResponseBuilder {
    this.response.data = data;
    return this;
  }

  public error(code: string, details?: any, stack?: string): ResponseBuilder {
    this.response.success = false;
    this.response.error = {
      code,
      ...(details && { details }),
      ...(stack && process.env.NODE_ENV !== 'production' && { stack }),
    };
    return this;
  }

  public requestId(requestId: string): ResponseBuilder {
    if (!this.response.meta) {
      this.response.meta = { timestamp: new Date().toISOString() };
    }
    this.response.meta.requestId = requestId;
    return this;
  }

  public pagination(meta: PaginationMeta): ResponseBuilder {
    if (!this.response.meta) {
      this.response.meta = { timestamp: new Date().toISOString() };
    }
    this.response.meta.pagination = meta;
    return this;
  }

  public version(version: string): ResponseBuilder {
    if (!this.response.meta) {
      this.response.meta = { timestamp: new Date().toISOString() };
    }
    this.response.meta.version = version;
    return this;
  }

  public build(): ApiResponse {
    return this.response;
  }
}

// Utility class for common responses
export class ApiResponseUtil {
  private static logResponse(statusCode: number, message: string, data?: any, error?: any): void {
    const logData = {
      statusCode,
      message,
      ...(data && { dataType: typeof data }),
      ...(error && { error: error.code || error.message }),
    };

    if (statusCode >= 500) {
      logger.error(`API Response: ${message}`, error, logData);
    } else if (statusCode >= 400) {
      logger.warn(`API Response: ${message}`, logData);
    } else {
      logger.info(`API Response: ${message}`, logData);
    }
  }

  // Success responses
  public static success<T>(
    res: Response,
    message: string = 'Success',
    data?: T,
    statusCode: number = HTTP_STATUS.OK
  ): Response {
    const response = ResponseBuilder.create()
      .success(true)
      .message(message)
      .data(data)
      .build();

    this.logResponse(statusCode, message, data);
    return res.status(statusCode).json(response);
  }

  public static created<T>(
    res: Response,
    message: string = 'Resource created successfully',
    data?: T
  ): Response {
    return this.success(res, message, data, HTTP_STATUS.CREATED);
  }

  public static noContent(res: Response, message: string = 'No content'): Response {
    const response = ResponseBuilder.create()
      .success(true)
      .message(message)
      .build();

    this.logResponse(HTTP_STATUS.NO_CONTENT, message);
    return res.status(HTTP_STATUS.NO_CONTENT).json(response);
  }

  // Error responses
  public static error(
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errorCode?: string,
    details?: any
  ): Response {
    const response = ResponseBuilder.create()
      .success(false)
      .message(message)
      .error(errorCode || 'INTERNAL_ERROR', details)
      .build();

    this.logResponse(statusCode, message, undefined, { code: errorCode, details });
    return res.status(statusCode).json(response);
  }

  public static badRequest(
    res: Response,
    message: string = 'Bad request',
    details?: any
  ): Response {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', details);
  }

  public static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): Response {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
  }

  public static forbidden(
    res: Response,
    message: string = 'Forbidden access'
  ): Response {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
  }

  public static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }

  public static conflict(
    res: Response,
    message: string = 'Resource conflict',
    details?: any
  ): Response {
    return this.error(res, message, HTTP_STATUS.CONFLICT, 'CONFLICT', details);
  }

  public static validationError(
    res: Response,
    message: string = 'Validation failed',
    validationErrors?: ValidationError[]
  ): Response {
    return this.error(
      res,
      message,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'VALIDATION_ERROR',
      validationErrors
    );
  }

  public static tooManyRequests(
    res: Response,
    message: string = 'Too many requests',
    retryAfter?: number
  ): Response {
    if (retryAfter) {
      res.set('Retry-After', retryAfter.toString());
    }
    return this.error(res, message, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
  }

  public static internalError(
    res: Response,
    message: string = 'Internal server error',
    error?: Error
  ): Response {
    const errorDetails = error ? {
      name: error.name,
      message: error.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    } : undefined;

    return this.error(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', errorDetails);
  }

  // Paginated response
  public static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message: string = 'Data retrieved successfully'
  ): Response {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const paginationMeta: PaginationMeta = {
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
  public static health(
    res: Response,
    services?: Record<string, 'healthy' | 'unhealthy' | 'degraded'>
  ): Response {
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
  public static file(
    res: Response,
    filePath: string,
    fileName?: string,
    contentType?: string
  ): void {
    if (fileName) {
      res.attachment(fileName);
    }
    if (contentType) {
      res.type(contentType);
    }
    
    logger.info('File download initiated', { filePath, fileName, contentType });
    res.sendFile(filePath);
  }

  public static download(
    res: Response,
    filePath: string,
    fileName: string
  ): void {
    logger.info('File download initiated', { filePath, fileName });
    res.download(filePath, fileName);
  }
}

// Middleware for adding request ID to responses
export const addRequestId = (req: any, res: Response, next: any): void => {
  req.requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.locals.requestId = req.requestId;
  next();
};

// Express middleware for handling async errors
export const asyncHandler = (fn: Function) => {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response formatter middleware
export const errorHandler = (error: any, req: any, res: Response, next: any): void => {
  // If response was already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(error);
  }

  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';
  let details: any = undefined;

  // Handle different error types
  if (error.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    details = error.details;
  } else if (error.name === 'UnauthorizedError' || error.status === 401) {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Unauthorized access';
    errorCode = 'UNAUTHORIZED';
  } else if (error.status) {
    statusCode = error.status;
    message = error.message;
  } else if (error.message) {
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