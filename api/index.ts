/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app, { setupExpressErrorHandlers } from './app.ts';

// Ensure error handlers are set up
setupExpressErrorHandlers(app);

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
