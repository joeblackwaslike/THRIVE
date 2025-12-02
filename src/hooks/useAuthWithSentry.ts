import { useEffect } from 'react';
import { useAuth as useOriginalAuth } from '@/hooks/useAuth';
import { addSentryBreadcrumb, setSentryUser } from '@/lib/sentry';
import { captureAuthError } from '@/lib/sentry-error-tracking';

/**
 * Enhanced auth hook with Sentry integration
 */
export function useAuthWithSentry() {
  const auth = useOriginalAuth();

  useEffect(() => {
    if (auth.user && auth.isAuthenticated) {
      // Set user context in Sentry
      setSentryUser({
        id: auth.user.id,
        email: auth.user.email,
        username: auth.user.name,
        role: auth.user.role,
        subscription: auth.user.subscription_type,
      });

      // Track successful authentication
      addSentryBreadcrumb(`User authenticated: ${auth.user.email}`, 'auth', 'info', {
        userId: auth.user.id,
        provider: auth.user.app_metadata?.provider,
      });
    } else if (!auth.isLoading) {
      // Clear user context when logged out
      setSentryUser(null);
    }
  }, [auth.user, auth.isAuthenticated, auth.isLoading]);

  // Enhanced login function with error tracking
  const enhancedLogin = async (credentials: any) => {
    try {
      addSentryBreadcrumb('Login attempt', 'auth', 'info');
      const result = await auth.login(credentials);
      addSentryBreadcrumb('Login successful', 'auth', 'info');
      return result;
    } catch (error) {
      captureAuthError(error as Error, {
        action: 'login',
        metadata: { provider: 'local' },
      });
      throw error;
    }
  };

  // Enhanced logout function with tracking
  const enhancedLogout = async () => {
    try {
      addSentryBreadcrumb('Logout attempt', 'auth', 'info');
      await auth.logout();
      addSentryBreadcrumb('Logout successful', 'auth', 'info');
    } catch (error) {
      captureAuthError(error as Error, {
        action: 'logout',
        userId: auth.user?.id,
      });
      throw error;
    }
  };

  return {
    ...auth,
    login: enhancedLogin,
    logout: enhancedLogout,
  };
}
