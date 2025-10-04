import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

// Extend Request type to include rateLimit info
interface RateLimitRequest extends Request {
  rateLimit?: {
    limit: number;
    current: number;
    remaining: number;
    resetTime?: Date;
  };
}

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Note: Trust proxy should be configured at Express app level with app.set('trust proxy', true)
  handler: (req: RateLimitRequest, res: Response) => {
    const retryAfter = req.rateLimit?.resetTime
      ? Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
      : 900;
    
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
    });
  },
});

/**
 * Strict rate limiter for authentication routes
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Rate limiter for file uploads
 * 10 uploads per hour per user
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  skipFailedRequests: true,
  message: {
    success: false,
    message: 'Upload limit exceeded. Maximum 10 uploads per hour.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID instead of IP if authenticated
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many uploads. Maximum 10 per hour.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Rate limiter for message sending
 * 30 messages per minute per user
 */
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  skipFailedRequests: true,
  message: {
    success: false,
    message: 'Too many messages. Please slow down.',
    code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Sending messages too quickly. Please wait a moment.',
      code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
    });
  },
});
