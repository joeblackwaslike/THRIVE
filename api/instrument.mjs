import * as Sentry from '@sentry/node';
// import { nodeProfilingIntegration } from '@sentry/profiling-node';
import SupabaseClient from '@supabase/supabase-js';
import dotenv from 'dotenv';
import os from 'node:os';
import process from 'node:process';

import logger from './logger.ts';

// Load environment variables
dotenv.config({ quiet: true });

if (!process.env.SENTRY_DSN) {
  console.warn('SENTRY_DSN not configured - error tracking disabled');
}

export default Sentry.init({
  dsn: process.env.SENTRY_DSN,
  debug: process.env.SENTRY_DEBUG === "true" || false,
  environment: process.env.NODE_ENV || 'development',
  name: 'THRIVE',
  version: process.env.npm_package_version || '1.0.0',
  release: process.env.npm_package_version || '1.0.0',
  dist: 'web',
  serverName: os.hostname(),
  sendDefaultPii: true,
  enableLogs: true,
  integrations: [
    Sentry.supabaseIntegration(SupabaseClient, Sentry, {
      tracing: true,
      breadcrumbs: true,
      errors: true,
    }),
    // nodeProfilingIntegration(),
    Sentry.consoleLoggingIntegration(),
    Sentry.extraErrorDataIntegration(),
    // Sentry.graphqlIntegration(),
    // Sentry.httpIntegration({ignoreStaticAssets: true}),
  ],
  sampleRate: 1.0,
  tracePropagationTargets: ['https://localhost:3001', 'http://localhost:5173', /^\/api\//],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // profilesSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 1.0,
  // profileSessionSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 1.0,
  // profileLifecycle: 'session',
  // includeLocalVariables: true, // Disabled due to memory leaks and inspector log spam
  shutdownTimeout: 5000,
});

/**
 * close server
 */
async function handleShutdownClose() {
  logger.info('Closing Sentry client...');
  const closed = await Sentry.close(2000); // Wait max 2 seconds [1]
  if (closed) {
    logger.info('Sentry client closed successfully.');
  } else {
    logger.warn('Sentry client closing timed out, some events might be lost.');
  }
  process.exit(0);
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received');
  await handleShutdownClose();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received');
  await handleShutdownClose();
});

process.on('uncaughtException', async (err) => {
  logger.fatal(err, 'uncaught exception detected');
  await Sentry.close(2000);
  // If a graceful shutdown is not achieved after 1 second,
  // shut down the process completely
  setTimeout(() => {
    process.abort(); // exit immediately and generate a core dump file
  }, 1000).unref();
  process.exit(1);
});
