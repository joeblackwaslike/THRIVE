import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addSentryBreadcrumb, setSentryUser } from '@/lib/sentry';

/**
 * Hook to initialize Sentry user context based on authentication state
 */
export function useSentryUser() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      setSentryUser({
        id: user.id,
        email: user.email,
      });
    } else {
      setSentryUser(null);
    }
  }, [user, isAuthenticated]);
}

/**
 * Hook to track page navigation in Sentry
 */
export function useSentryNavigation(pathname: string) {
  useEffect(() => {
    addSentryBreadcrumb(`Navigated to ${pathname}`, 'navigation', 'info', { pathname });
  }, [pathname]);
}

/**
 * Hook to track user actions in Sentry
 */
export function useSentryAction(action: string, category = 'user_action') {
  const trackAction = (data?: Record<string, any>) => {
    addSentryBreadcrumb(action, category, 'info', data);
  };

  return trackAction;
}
