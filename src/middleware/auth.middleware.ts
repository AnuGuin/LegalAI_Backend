import type { Request } from 'express';
import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';

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
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
        code: 'NO_TOKEN',
      });
    }

    // Check if token starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>',
        code: 'INVALID_FORMAT',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is missing',
        code: 'MISSING_TOKEN',
      });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
      }

      throw error;
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.',
        code: 'USER_NOT_FOUND',
      });
    }

    // Attach user to request object
    (req as AuthRequest).user = user;

    // Log successful authentication (optional, for debugging)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('User authenticated', {
        userId: user.id,
        email: user.email,
        path: req.path,
        method: req.method,
      });
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if missing
 */
export const optionalAuth = async (
  req: OptionalAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          provider: true,
        },
      });

      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    next();
  } catch (error) {
    next();
  }
};