/**
 * User authentication API routes
 * Handle user registration, login, token management, etc.
 */
import { type Request, type Response, Router } from 'express';
import { type AuthenticatedRequest, authenticateToken } from '../lib/auth.ts';
import { supabase } from '../lib/supabase.ts';
import logger from '../logger.ts';

const router = Router();

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, ...metadata } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    if (data.user) {
      await supabase
        .from('users')
        .upsert({ id: data.user.id, email: data.user.email || email }, { onConflict: 'id' });
    }

    res.status(201).json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
      message: 'Registration successful. Please check your email for confirmation.',
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.error('Login error: Email and password are required');
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    if (data.user) {
      await supabase
        .from('users')
        .upsert({ id: data.user.id, email: data.user.email || email }, { onConflict: 'id' });
    }

    logger.info('Login successful for user:', email);
    res.status(200).json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
      message: 'Login successful',
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post(
  '/logout',
  authenticateToken,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Logout error:', error);
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
);

/**
 * Get Current User
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  logger.info('Get current user request:', req.user);
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

/**
 * Refresh Token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      logger.error('Refresh token error: Refresh token is required');
      res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
      return;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        session: data.session,
        user: data.user,
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
