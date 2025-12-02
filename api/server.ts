/**
 * local server entry file, for local development
 */
import { createServer } from 'node:http';
import dotenv from 'dotenv';
import type { Request, Response } from 'express';
import app, { setupApolloServer } from './app.ts';
import logger from './logger.ts';

dotenv.config({ quiet: true });

/**
 * start server with port
 */
const BASE_PORT = Number(process.env.PORT || 3001);

const httpServer = createServer(app);

// Setup Apollo Server and start listening with port fallback
async function start() {
  await setupApolloServer(app, httpServer);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'API not found' });
  });

  let port = BASE_PORT;
  const maxPort = BASE_PORT + 10;

  const tryListen = () => {
    httpServer.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && port < maxPort) {
        port += 1;
        tryListen();
      } else {
        logger.error(err, 'Server listen error');
        process.exit(1);
      }
    });

    httpServer.listen(port, () => {
      logger.info(`🚀 Server ready on port ${port}`);
      logger.info(`🚀 GraphQL endpoint: http://localhost:${port}/graphql`);
    });
  };

  tryListen();
}

start();

/**
 * close server
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  logger.fatal(err, 'uncaught exception detected');
  httpServer.close(() => {
    process.exit(1);
  });
  // If a graceful shutdown is not achieved after 1 second,
  // shut down the process completely
  setTimeout(() => {
    process.abort(); // exit immediately and generate a core dump file
  }, 1000).unref()
  process.exit(1);
});


export default app;
