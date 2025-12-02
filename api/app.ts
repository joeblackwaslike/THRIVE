/**
 * This is a API server
 */
import type { Server } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Sentry from '@sentry/node';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import pino from 'pino-http';
import { createApolloServer } from './graphql/server.ts';
import authRoutes from './routes/auth.ts';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config({ quiet: true });

const app: express.Application = express();

app.get('/debug-sentry', function mainHandler(_req, _res) {
  throw new Error('My first Sentry error!');
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

app.use(pino);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);

/**
 * health
 */
app.use('/api/health', (_req: Request, res: Response, _next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
  });
});

/**
 * error handler middleware
 */
app.use((_error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  });
});

/**
 * 404 handler
 */
// 404 handler is registered after GraphQL in server.ts

// Apollo Server setup function
export async function setupApolloServer(expressApp: Express, httpServer: Server) {
  await createApolloServer(expressApp, httpServer);
}

export default app;
