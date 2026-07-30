import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getService } from '@/shared/core/service-container';
import { UserService } from '@/services/user.service';
import { config } from '@/config/environment';
import { logger } from '@/shared/utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header or cookie
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Access token required' 
      });
    }

    // Verify token
    const jwtSecret = config.jwt.secret || 'fallback-secret-for-development';
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (!decoded.userId) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Invalid token format' 
      });
    }

    // Get user from database
    const userService = getService<UserService>('UserService');
    const user = await userService.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'Invalid user' 
      });
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    
    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token verification failed' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Access token has expired' 
      });
    }

    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Internal authentication error' 
    });
  }
};

/**
 * Optional authentication middleware - populates user if token is valid, 
 * but doesn't return error if token is missing
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header or cookie
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      // No token provided - continue without authentication
      return next();
    }

    // Verify token
    const jwtSecret = config.jwt.secret || 'fallback-secret-for-development';
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (!decoded.userId) {
      // Invalid token format - continue without authentication
      return next();
    }

    // Get user from database
    const userService = getService<UserService>('UserService');
    const user = await userService.getUserById(decoded.userId);

    if (user) {
      // Attach user to request if found
      (req as AuthenticatedRequest).user = {
        id: user.id,
        username: user.username,
        email: user.email
      };
    }
    
    next();
  } catch (error: any) {
    // On any error, just continue without authentication
    logger.warn('Optional authentication failed, continuing without user:', error.message);
    next();
  }
};
