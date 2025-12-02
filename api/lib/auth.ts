import type { NextFunction, Request, Response } from 'express';
import logger from '../logger.ts';
import { supabase } from './supabase.ts';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: unknown;
  };
}

/**
 * Authentication middleware that validates Supabase JWT tokens
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.error({authHeader: authHeader, token: token}, 'Authentication error: Access token required');
      res.status(401).json({
        success: false,
        error: 'Access token required',
      });
      return;
    }

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Authentication error: Invalid or expired token');
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email || '',
      ...user.user_metadata,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication server error',
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    logger.info(`optionalAuth debug - authHeader: ${authHeader ? 'Bearer [TOKEN]' : 'missing'}`);
    logger.info(`optionalAuth debug - token extracted: ${!!token}`);
    logger.info(`optionalAuth debug - full auth header: ${authHeader}`);

    if (token) {
      logger.info('optionalAuth debug - attempting to verify token...');
      logger.info(`optionalAuth debug - token length: ${token.length}`);
      logger.info(`optionalAuth debug - token preview: ${token.substring(0, 20)}...`);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      logger.info({ user: !!user, error }, 'optionalAuth debug - verification result:');

      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email || '',
          ...user.user_metadata,
        };
        logger.info(req.user, 'optionalAuth debug - user set on request:');
      } else {
        logger.error(error, 'optionalAuth debug - verification failed:');
      }
    }

    next();
  } catch (error) {
    logger.error(error, 'optionalAuth debug - exception caught:');
    // Continue without authentication
    next();
  }
};

/**
 * Get user ID from request (for GraphQL context)
 */
export const getUserIdFromRequest = (req: AuthenticatedRequest): string | null => {
  logger.info(`getUserIdFromRequest debug - req.user: ${req.user}`);
  logger.info(
    `getUserIdFromRequest debug - req.headers.authorization: ${req.headers.authorization ? 'Bearer [TOKEN]' : 'missing'}`
  );
  return req.user?.id || null;
};
