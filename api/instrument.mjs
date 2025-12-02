import process from 'node:process';
import dotenv from 'dotenv';
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import * as Sentry from '@sentry/browser';
import SupabaseClient from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ quiet: true });

if (!process.env.SENTRY_DSN) {
  console.warn('SENTRY_DSN not configured - error tracking disabled');
}

export default Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  name: 'THRIVE',
  version: process.env.npm_package_version || '1.0.0',
  release: process.env.npm_package_version || '1.0.0',
  sendDefaultPii: true,
  enableLogs: true,
  integrations: [
    Sentry.supabaseIntegration(SupabaseClient, Sentry, {
      tracing: true,
      breadcrumbs: true,
      errors: true,
    }),
    nodeProfilingIntegration(),
    Sentry.consoleLoggingIntegration(),
    Sentry.extraErrorDataIntegration(),
    // Sentry.graphqlIntegration(),
    // Sentry.httpIntegration({ignoreStaticAssets: true}),
    // Sentry.pinoIntegration({log: {levels: ["trace", "debug", "info", "warn", "error", "fatal"]}}),
  ],
  sampleRate: 1.0,
  tracePropagationTargets: ["https://localhost:3001", "http://localhost:5173", /^\/api\//],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 1.0,
  profileSessionSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 1.0,
  profileLifecycle: 'trace',
  includeLocalVariables: true,
  beforeSend(event) {
    console.error('Error sent to Sentry:', {
      message: event.exception?.values?.[0]?.value,
      type: event.exception?.values?.[0]?.type,
      user: event.user?.id,
    });
    return event;
  },
});
