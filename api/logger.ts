import pino from 'pino';

const logger = pino({
  level: process.env.PINO_LOG_LEVEL || 'info',
  transport: 
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    service: 'thrive-api',
    version: process.env.npm_package_version || '1.0.0',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => { 
      return { level: label.toUpperCase() };
    },
  },
});

export default logger;
