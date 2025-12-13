/**
 * This is an express API server
 */
import * as Sentry from '@sentry/node';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import pino from 'pino-http';

import authRoutes from './routes/auth.ts';
import os from 'node:os';
import * as v8 from 'v8';

// load env
dotenv.config({ quiet: true });

const app: express.Application = express();

async function setupExpressRoutes(app: express.Application) {
  /**
   * health
   */
  app.use('/api/health', (_req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    });
  });

  app.get('/api/sentry', async (_req, _res) => {
    await Sentry.startSpan(
      {
        op: 'test',
        name: 'My first test Transaction',
      },
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error('My first Sentry Spawn');
      },
    );
  });

  /**
   * Auth API Routes
   */
  app.use('/api/auth', authRoutes);


  if (process.env.ENABLE_DIAGNOSTICS === 'true') {
    /**
     * Diagnostics route
     */
    app.get('/api/diagnostics/system', async (_req: Request, res: Response) => {
      const startHr = process.hrtime.bigint();
      const startCpu = process.cpuUsage();
      const startRes = process.resourceUsage?.();
      const handles = (process as any)._getActiveHandles?.() || [];
      const requests = (process as any)._getActiveRequests?.() || [];

      await new Promise((resolve) => setTimeout(resolve, 200));

      const endHr = process.hrtime.bigint();
      const endCpu = process.cpuUsage(startCpu);
      const endRes = process.resourceUsage?.();
      const eventLoopDelayMs = Number((endHr - startHr) / BigInt(1_000_000)) - 200;

      const mem = process.memoryUsage();
      const heapStats = v8.getHeapStatistics();
      const heapSpaces = v8.getHeapSpaceStatistics();

      res.status(200).json({
        node: process.version,
        pid: process.pid,
        uptime_s: process.uptime(),
        cpu_usage_ms: {
          user: endCpu.user / 1000,
          system: endCpu.system / 1000,
        },
        resource_usage: endRes || startRes || null,
        event_loop_delay_ms: eventLoopDelayMs,
        memory: {
          rss: mem.rss,
          heapTotal: mem.heapTotal,
          heapUsed: mem.heapUsed,
          external: mem.external,
          arrayBuffers: (mem as any).arrayBuffers,
        },
        heap_statistics: heapStats,
        heap_spaces: heapSpaces,
        os: {
          loadavg: os.loadavg(),
          totalmem: os.totalmem(),
          freemem: os.freemem(),
          cpus: os.cpus().length,
          platform: os.platform(),
          arch: os.arch(),
        },
        active_handles_count: handles.length,
        active_requests_count: requests.length,
        notes: 'CPU usage measured over ~200ms window; event_loop_delay approximates loop stall beyond timer duration.',
      });
    });


    app.post('/api/diagnostics/heap-snapshot', (_req: Request, res: Response) => {
      try {
        const filename = v8.writeHeapSnapshot();
        res.status(200).json({ ok: true, file: filename });
      } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
      }
    });
  }
}

// ... (previous functions)

export function setupExpressErrorHandlers(app: express.Application) {
  /**
   * 404 handler
   */
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'API not found' });
  });

  /**
   * 500 handler middleware
   */
  app.use((_error: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
      success: false,
      error: 'Server internal error',
    });
  });
}

function setupExpressMiddleware(app: express.Application) {
  // The error handler must be registered before any other error middleware and after all controllers
  Sentry.setupExpressErrorHandler(app);
  app.use(pino());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
}

setupExpressMiddleware(app);
setupExpressRoutes(app);
// setupExpressErrorHandlers(app); // Moved to server.ts to allow GraphQL middleware to be attached first

export default app;
