import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase.ts';
import authRoutes from '../../routes/auth.ts';

// Mock the auth middleware
vi.mock('../../lib/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    // Check if authorization header exists and is valid
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
      });
    }

    const token = authHeader.split(' ')[1];
    if (token === 'valid-token' || token === 'mock-token') {
      req.user = { id: 'user123', email: 'test@example.com' };
      next();
    } else {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  },
}));

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      refreshSession: vi.fn(),
    },
  },
}));

describe('Authentication Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockToken = 'mock.jwt.token';

      (supabase.auth.signUp as any).mockResolvedValue({
        data: { user: mockUser, session: { access_token: mockToken } },
        error: null,
      });

      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockUser,
          session: { access_token: mockToken },
        },
        message: 'Registration successful. Please check your email for confirmation.',
      });
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: { data: { name: 'Test User' } },
      });
    });

    it('should handle registration errors', async () => {
      const mockError = new Error('Email already exists');

      (supabase.auth.signUp as any).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Email already exists',
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app).post('/api/auth/register').send({
        // Missing email and password
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockToken = 'mock.jwt.token';

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser, session: { access_token: mockToken } },
        error: null,
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockUser,
          session: { access_token: mockToken },
        },
        message: 'Login successful',
      });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials',
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      (supabase.auth.signOut as any).mockResolvedValue({ error: null });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Logout successful',
      });
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const mockError = new Error('Logout failed');

      (supabase.auth.signOut as any).mockResolvedValue({ error: mockError });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Logout failed',
      });
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get user profile with valid token', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { user: mockUser },
      });
      // The /me endpoint doesn't call getUser, it uses req.user from middleware
      expect(supabase.auth.getUser).not.toHaveBeenCalled();
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Access token required',
      });
    });

    it('should handle get user errors', async () => {
      const mockError = new Error('Invalid token');

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid or expired token',
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockSession = {
        access_token: 'new.jwt.token',
        refresh_token: 'new.refresh.token',
      };

      (supabase.auth.refreshSession as any).mockResolvedValue({
        data: {
          session: mockSession,
          user: { id: 'user123', email: 'test@example.com' },
        },
        error: null,
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          session: mockSession,
          user: { id: 'user123', email: 'test@example.com' },
        },
      });
      expect(supabase.auth.refreshSession).toHaveBeenCalledWith({
        refresh_token: 'valid-refresh-token',
      });
    });

    it('should handle refresh errors', async () => {
      const mockError = new Error('Invalid refresh token');

      (supabase.auth.refreshSession as any).mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid refresh token',
      });
    });

    it('should validate refresh token presence', async () => {
      const response = await request(app).post('/api/auth/refresh').send({}); // Missing refreshToken

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
