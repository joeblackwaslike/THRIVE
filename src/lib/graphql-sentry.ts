import { onError } from '@apollo/client/link/error';
import { captureGraphQLError } from '@/lib/sentry-error-tracking';

/**
 * Apollo Link for Sentry error tracking
 */
export const sentryErrorLink = onError((args) => {
  const { graphQLErrors, networkError, operation } = args as any;
  if (graphQLErrors) {
    graphQLErrors.forEach((error: any) => {
      const errorMessage = `[GraphQL error]: Message: ${error.message}, Location: ${error.locations}, Path: ${error.path}`;

      captureGraphQLError(
        new Error(errorMessage),
        {
          query: operation.query.loc?.source.body || '',
          variables: operation.variables,
          operationName: operation.operationName,
        },
        {
          userId: operation.getContext().headers?.['x-user-id'],
        },
      );
    });
  }

  if (networkError) {
    captureGraphQLError(
      networkError as any,
      {
        query: operation.query.loc?.source.body || '',
        variables: operation.variables,
        operationName: operation.operationName,
      },
      {
        userId: operation.getContext().headers?.['x-user-id'],
      },
    );
  }
});
