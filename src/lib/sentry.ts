import * as Sentry from '@sentry/react';

interface UserContext {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  subscription?: string;
}

/**
 * Set user context in Sentry for better error tracking
 */
export function setSentryUser(user: UserContext | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    // Set additional context
    Sentry.setContext('user', {
      role: user.role,
      subscription: user.subscription,
    });
  } else {
    console.error('(client : setSentryUser) user is null');
    // Sentry.configureScope((scope) => scope.setUser(null));
  }
}

/**
 * Set additional context for error tracking
 */
export function setSentryContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
}

/**
 * Add breadcrumb for better error context
 */
export function addSentryBreadcrumb(
  message: string,
  category?: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture custom exception with additional context
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture custom message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureMessage(message, level);
  });
}

/**
 * Start a custom transaction for performance monitoring
 */
export function startTransaction(name: string, operation: string, tags?: Record<string, string>) {
  const transaction = Sentry.startTransaction({
    name,
    op: operation,
    tags,
  });

  return transaction;
}

/**
 * Set tag for filtering and grouping
 */
export function setSentryTag(key: string, value: string) {
  Sentry.setTag(key, value);
}
