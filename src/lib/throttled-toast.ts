/**
 * Throttled Toast Notifications
 *
 * Utilities to prevent notification spam by throttling toast messages.
 * Useful for rapid events like sync status updates, progress changes, etc.
 */

import { useCallback, useRef } from 'react';
import type { ExternalToast } from 'sonner';
import { toast } from 'sonner';

interface ThrottleConfig {
  /** Time to wait between notifications (ms) */
  wait: number;
  /** Whether to show the first notification immediately */
  leading?: boolean;
  /** Whether to show the last notification after throttle period */
  trailing?: boolean;
}

/**
 * Hook for throttled toast notifications
 *
 * @example
 * ```tsx
 * const showSyncStatus = useThrottledToast({ wait: 5000 });
 *
 * // This will only show at most once per 5 seconds
 * showSyncStatus.success('Synced', { description: 'Data synced successfully' });
 * ```
 */
export function useThrottledToast(
  config: ThrottleConfig = { wait: 5000, leading: true, trailing: false },
) {
  const lastCallTimeRef = useRef<number>(0);
  const trailingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    data?: ExternalToast;
  } | null>(null);

  const shouldThrottle = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    return timeSinceLastCall < config.wait;
  }, [config.wait]);

  const executeToast = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning', message: string, data?: ExternalToast) => {
      switch (type) {
        case 'success':
          toast.success(message, data);
          break;
        case 'error':
          toast.error(message, data);
          break;
        case 'info':
          toast.info(message, data);
          break;
        case 'warning':
          toast.warning(message, data);
          break;
      }
      lastCallTimeRef.current = Date.now();
    },
    [],
  );

  const createThrottledToast = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning') => {
      return (message: string, data?: ExternalToast) => {
        // Clear any pending trailing call
        if (trailingTimerRef.current) {
          clearTimeout(trailingTimerRef.current);
          trailingTimerRef.current = null;
        }

        // Store args for potential trailing call
        lastArgsRef.current = { type, message, data };

        if (!shouldThrottle()) {
          // Not throttled - execute immediately
          executeToast(type, message, data);
        } else if (config.leading && lastCallTimeRef.current === 0) {
          // Leading edge - show first notification
          executeToast(type, message, data);
        } else if (config.trailing) {
          // Trailing edge - schedule notification for after throttle period
          const timeUntilNext = config.wait - (Date.now() - lastCallTimeRef.current);
          trailingTimerRef.current = setTimeout(() => {
            if (lastArgsRef.current) {
              executeToast(
                lastArgsRef.current.type,
                lastArgsRef.current.message,
                lastArgsRef.current.data,
              );
            }
          }, timeUntilNext);
        }
      };
    },
    [config.leading, config.trailing, config.wait, shouldThrottle, executeToast],
  );

  return {
    success: createThrottledToast('success'),
    error: createThrottledToast('error'),
    info: createThrottledToast('info'),
    warning: createThrottledToast('warning'),
  };
}

/**
 * Create a throttled toast function (non-hook version)
 *
 * @example
 * ```tsx
 * const syncToast = createThrottledToast({ wait: 5000 });
 *
 * // Call multiple times, only shows once per 5 seconds
 * syncToast.success('Sync complete');
 * ```
 */
export function createThrottledToast(config: ThrottleConfig = { wait: 5000, leading: true }) {
  let lastCallTime = 0;
  let trailingTimer: NodeJS.Timeout | null = null;
  let lastArgs: {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    data?: ExternalToast;
  } | null = null;

  const executeToast = (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    data?: ExternalToast,
  ) => {
    switch (type) {
      case 'success':
        toast.success(message, data);
        break;
      case 'error':
        toast.error(message, data);
        break;
      case 'info':
        toast.info(message, data);
        break;
      case 'warning':
        toast.warning(message, data);
        break;
    }
    lastCallTime = Date.now();
  };

  const createThrottled = (type: 'success' | 'error' | 'info' | 'warning') => {
    return (message: string, data?: ExternalToast) => {
      // Clear any pending trailing call
      if (trailingTimer) {
        clearTimeout(trailingTimer);
        trailingTimer = null;
      }

      // Store args for potential trailing call
      lastArgs = { type, message, data };

      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;

      if (timeSinceLastCall >= config.wait) {
        // Not throttled - execute immediately
        executeToast(type, message, data);
      } else if (config.leading && lastCallTime === 0) {
        // Leading edge - show first notification
        executeToast(type, message, data);
      } else if (config.trailing) {
        // Trailing edge - schedule notification
        const timeUntilNext = config.wait - timeSinceLastCall;
        trailingTimer = setTimeout(() => {
          if (lastArgs) {
            executeToast(lastArgs.type, lastArgs.message, lastArgs.data);
          }
        }, timeUntilNext);
      }
    };
  };

  return {
    success: createThrottled('success'),
    error: createThrottled('error'),
    info: createThrottled('info'),
    warning: createThrottled('warning'),
  };
}

/**
 * Usage Examples
 */

// Example 1: Sync status updates (hook version)
export function SyncStatusExample() {
  const syncToast = useThrottledToast({
    wait: 5000,
    leading: true,
    trailing: false,
  });

  // @ts-expect-error - Example code showing throttled toast usage
  const _handleSync = () => {
    // Even if this is called 100 times in 5 seconds,
    // only the first one will show
    syncToast.success('Data synced');
  };

  return null;
}

// Example 2: Progress updates (non-hook version)
const progressToast = createThrottledToast({
  wait: 2000,
  leading: true,
  trailing: true, // Show final progress
});

export function updateProgress(percent: number) {
  progressToast.info(`Progress: ${percent}%`);
  // If called every 100ms, shows at 0%, then max once per 2s, then final
}

// Example 3: Error notifications (prevent spam)
export function ErrorHandlingExample() {
  const errorToast = useThrottledToast({
    wait: 10000, // Only show errors once per 10 seconds
    leading: true,
  });

  // @ts-expect-error - Example code showing throttled error toast
  const _handleError = (error: Error) => {
    // Multiple rapid errors won't spam the user
    errorToast.error('Operation failed', {
      description: error.message,
    });
  };

  return null;
}
