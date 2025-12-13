import type { ApolloServerPlugin } from '@apollo/server';
import * as Sentry from '@sentry/node';
import logger from '../../logger.ts';

const ApolloLoggingPlugin = (): ApolloServerPlugin<any> => ({
  async requestDidStart(ctx) {
    const start = Date.now();
    const operationName = ctx.request.operationName ?? 'anonymous';
    const variables = ctx.request.variables ? Object.keys(ctx.request.variables) : [];
    const span = operationName === 'IntrospectionQuery'
      ? null
      : ((Sentry as any).startSpan
          ? (Sentry as any).startSpan({ name: operationName, op: 'graphql', attributes: { operationName } }, () => {})
          : null);

    logger.info({ operationName, variables }, 'GraphQL request start');

    return {
      async didEncounterErrors(errCtx) {
        for (const error of errCtx.errors) {
          logger.error({ operationName, path: error.path, code: (error.extensions as any)?.code }, error.message);
          Sentry.withScope((scope) => {
            scope.setTag('operation', operationName);
            if (error.path) scope.setTag('path', error.path.join('.'));
            Sentry.captureException(error);
          });
        }
      },
      async willSendResponse() {
        const durationMs = Date.now() - start;
        logger.info({ operationName, durationMs }, 'GraphQL request end');
        if (span && typeof (span as any).end === 'function') {
          (span as any).end();
        }
      },
    };
  },
});

export default ApolloLoggingPlugin;
