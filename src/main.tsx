import * as Sentry from '@sentry/react';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/print.css';
// Import providers
import { ThemeProvider } from '@/components/layout';
import { ConfirmProvider } from '@/hooks/useConfirm';
import { QueryProvider } from '@/lib/queryClient';
// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment:
      import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.NODE_ENV || 'development',
    release: import.meta.env.VITE_APP_VERSION || '0.1.0',
    // Enable logs to be sent to Sentry
    enableLogs: true,
    integrations: [
      Sentry.consoleLoggingIntegration(),
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 1.0 : 1.0,
    // Error sampling
    sampleRate: 1.0,
    // Session replay
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Filter out specific errors or add custom context
      console.error('Error sent to Sentry:', {
        message: event.exception?.values?.[0]?.value,
        type: event.exception?.values?.[0]?.type,
        user: event.user?.id,
      });
      return event;
    },
  });
}

// Create a new router instance with basepath for GitHub Pages
const router = createRouter({
  routeTree,
  basepath: '/',
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={null}>
      <ThemeProvider>
        <QueryProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </QueryProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
