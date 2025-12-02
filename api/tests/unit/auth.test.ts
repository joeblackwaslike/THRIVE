import type { NextFunction } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticateToken, getUserIdFromRequest, optionalAuth } from '../../lib/auth.ts';
import { supabase } from '../../lib/supabase.ts';

// Mock the supabase module
vi.mock('../../lib/supabase.ts', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Authentication Middleware', () => {
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      user: undefined,
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate with valid token', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const token = 'valid.jwt.token';

      req.headers.authorization = `Bearer ${token}`;
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });

      await authenticateToken(req, res, next);

      expect(supabase.auth.getUser).toHaveBeenCalledWith(token);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Access token required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      req.headers.authorization = 'InvalidFormat token';

      // Mock supabase to throw an error for invalid token format
      (supabase.auth.getUser as any).mockRejectedValue(new Error('Invalid token format'));

      await authenticateToken(req, res, next);

      // The middleware catches the error and returns 500
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication server error',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const token = 'invalid.token';
      req.headers.authorization = `Bearer ${token}`;

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle Supabase errors gracefully', async () => {
      const token = 'valid.token';
      req.headers.authorization = `Bearer ${token}`;

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Supabase error'),
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate with valid token', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const token = 'valid.jwt.token';

      req.headers.authorization = `Bearer ${token}`;
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });

      await optionalAuth(req, res, next);

      expect(supabase.auth.getUser).toHaveBeenCalledWith(token);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should continue without authentication when no token provided', async () => {
      await optionalAuth(req, res, next);

      expect(supabase.auth.getUser).not.toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without authentication when token is invalid', async () => {
      const token = 'invalid.token';
      req.headers.authorization = `Bearer ${token}`;

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      await optionalAuth(req, res, next);

      expect(supabase.auth.getUser).toHaveBeenCalledWith(token);
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should handle Supabase errors gracefully', async () => {
      const token = 'valid.token';
      req.headers.authorization = `Bearer ${token}`;

      (supabase.auth.getUser as any).mockRejectedValue(new Error('Network error'));

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getUserIdFromRequest', () => {
    it('should return user ID when user is authenticated', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      req.user = mockUser;

      const userId = getUserIdFromRequest(req);

      expect(userId).toBe('user123');
    });

    it('should return null when user is not authenticated', () => {
      req.user = undefined;

      const userId = getUserIdFromRequest(req);

      expect(userId).toBeNull();
    });

    it('should return null when req.user has no id', () => {
      req.user = { email: 'test@example.com' }; // No id property

      const userId = getUserIdFromRequest(req);

      expect(userId).toBeNull();
    });
  });
});
