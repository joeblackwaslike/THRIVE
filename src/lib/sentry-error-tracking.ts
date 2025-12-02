import * as Sentry from '@sentry/react';
import { addSentryBreadcrumb, captureException } from '@/lib/sentry';

interface ApiErrorContext {
  url?: string;
  method?: string;
  status?: number;
  requestData?: any;
  responseData?: any;
  userId?: string;
  timestamp?: string;
}

/**
 * Capture API errors with rich context
 */
export function captureApiError(
  error: Error,
  context: ApiErrorContext,
  tags?: Record<string, string>
) {
  const enhancedContext = {
    ...context,
    timestamp: new Date().toISOString(),
  };

  captureException(error, {
    tags: {
      type: 'api_error',
      method: context.method,
      status: context.status?.toString(),
      ...tags,
    },
    extra: enhancedContext,
    level: context.status && context.status >= 500 ? 'error' : 'warning',
  });
}

/**
 * Capture GraphQL errors with operation context
 */
export function captureGraphQLError(
  error: Error,
  operation: {
    query: string;
    variables?: Record<string, any>;
    operationName?: string;
  },
  context?: {
    userId?: string;
    timestamp?: string;
  }
) {
  const enhancedContext = {
    operation: {
      query: operation.query,
      variables: operation.variables,
      operationName: operation.operationName,
    },
    ...context,
    timestamp: new Date().toISOString(),
  };

  captureException(error, {
    tags: {
      type: 'graphql_error',
      operation: operation.operationName || 'unknown',
    },
    extra: enhancedContext,
    level: 'error',
  });
}

/**
 * Track successful API calls for performance monitoring
 */
export function trackApiCall(
  url: string,
  method: string,
  duration: number,
  status: number,
  context?: Record<string, any>
) {
  addSentryBreadcrumb(`API ${method} ${url}`, 'api_call', status >= 400 ? 'error' : 'info', {
    url,
    method,
    status,
    duration,
    ...context,
  });

  // Create a transaction for performance monitoring
  const transaction = Sentry.startTransaction({
    name: `API ${method} ${url}`,
    op: 'http',
    tags: {
      method,
      status: status.toString(),
    },
    data: {
      duration,
      ...context,
    },
  });

  // Finish the transaction
  setTimeout(() => {
    transaction.finish();
  }, 0);
}

/**
 * Track user actions for better debugging context
 */
export function trackUserAction(action: string, category: string, data?: Record<string, any>) {
  addSentryBreadcrumb(action, category, 'info', data);

  // Set custom tag for filtering
  Sentry.setTag('last_user_action', `${category}:${action}`);
}

/**
 * Capture validation errors with form context
 */
export function captureValidationError(
  error: Error,
  formData: Record<string, any>,
  validationErrors: Record<string, string>
) {
  captureException(error, {
    tags: {
      type: 'validation_error',
    },
    extra: {
      formData,
      validationErrors,
      timestamp: new Date().toISOString(),
    },
    level: 'warning',
  });
}

/**
 * Capture authentication errors
 */
export function captureAuthError(
  error: Error,
  context: {
    action: string;
    provider?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }
) {
  captureException(error, {
    tags: {
      type: 'auth_error',
      action: context.action,
      provider: context.provider,
    },
    extra: {
      ...context,
      timestamp: new Date().toISOString(),
    },
    level: 'error',
  });
}
