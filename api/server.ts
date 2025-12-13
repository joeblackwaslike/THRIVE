/**
 * local server entry file, for local development
 */
import { createServer } from 'node:http';
import dotenv from 'dotenv';

import app, { setupExpressErrorHandlers } from './app.ts';
import { createApolloServer } from './graphql/server.ts';

import logger from './logger.ts';

dotenv.config({ quiet: true });

/**
 * start server with port
 */
const BASE_PORT = Number(process.env.PORT || 3001);

const httpServer = createServer(app);

// Setup Apollo Server and start listening with port fallback
async function start() {
  await createApolloServer(app, httpServer);
  
  // Setup error handlers AFTER GraphQL middleware is attached
  // This ensures that the 404 handler doesn't catch GraphQL requests
  setupExpressErrorHandlers(app);

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
  }, 1000).unref();
  process.exit(1);
});

export default app;
