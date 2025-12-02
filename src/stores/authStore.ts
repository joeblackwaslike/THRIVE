import { create } from 'zustand';

interface AuthState {
  user: { id: string; email: string } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  loadFromStorage: () => void;
  register: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  loadFromStorage: () => {
    const token = localStorage.getItem('supabase-auth-token');
    const userId = localStorage.getItem('user-id');
    const email = localStorage.getItem('user-email');
    set({
      token: token || null,
      user: token && userId ? { id: userId, email: email || '' } : null,
    });
  },

  register: async (email, password, metadata) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...metadata }),
      });
      const body = await res.json();
      const user = body?.data?.user || body?.user;
      let token = body?.data?.session?.access_token || body?.token;

      // Ensure we have a raw JWT token, not a JSON string
      if (token && typeof token === 'string' && token.startsWith('{')) {
        try {
          const parsed = JSON.parse(token);
          if (parsed.access_token) {
            token = parsed.access_token;
            // Removed debug logging
          }
        } catch (_e) {
          // Not JSON, use as-is
        }
      }

      if (!user || !token) throw new Error(body?.error || 'Registration failed');
      localStorage.setItem('supabase-auth-token', token);
      localStorage.setItem('user-id', user.id);
      localStorage.setItem('user-email', user.email || email);
      set({ user: { id: user.id, email: user.email || email }, token, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Registration failed', loading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      const user = body?.data?.user || body?.user;
      let token = body?.data?.session?.access_token || body?.token;

      // Ensure we have a raw JWT token, not a JSON string
      if (token && typeof token === 'string' && token.startsWith('{')) {
        try {
          const parsed = JSON.parse(token);
          if (parsed.access_token) {
            token = parsed.access_token;
          }
        } catch (_e) {
          // Not JSON, use as-is
        }
      }

      if (!user || !token) throw new Error(body?.error || 'Login failed');
      localStorage.setItem('supabase-auth-token', token);
      localStorage.setItem('user-id', user.id);
      localStorage.setItem('user-email', user.email || email);
      set({ user: { id: user.id, email: user.email || email }, token, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Login failed', loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('supabase-auth-token');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
    } catch {}
    localStorage.removeItem('supabase-auth-token');
    localStorage.removeItem('user-id');
    localStorage.removeItem('user-email');
    set({ user: null, token: null, loading: false });
  },
}));
