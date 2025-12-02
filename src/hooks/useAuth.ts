import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const store = useAuthStore();
  
  return {
    user: store.user,
    token: store.token,
    isLoading: store.loading,
    error: store.error,
    isAuthenticated: !!store.user && !!store.token,
    login: store.login,
    logout: store.logout,
    register: store.register,
    loadFromStorage: store.loadFromStorage,
  };
}