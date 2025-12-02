import { ApolloClient, createHttpLink, from, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { sentryErrorLink } from './graphql-sentry';

const httpLink = createHttpLink({
  uri: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/graphql`,
});

const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  let token = localStorage.getItem('supabase-auth-token');
  const userId = localStorage.getItem('user-id');

  // Check if token is stored as JSON and extract the access_token
  if (token) {
    try {
      // Try to parse as JSON in case it's a full session object
      const parsed = JSON.parse(token);
      if (parsed?.access_token) {
        token = parsed.access_token;
        console.log('GraphQL auth debug - Extracted access_token from JSON session');
      }
    } catch (_e) {
      // Not JSON, use as-is
    }
  }

  console.log('GraphQL auth debug - Token exists:', !!token);
  console.log('GraphQL auth debug - Token length:', token ? token.length : 0);
  console.log('GraphQL auth debug - User ID:', userId);
  console.log(
    'GraphQL auth debug - Authorization header:',
    token ? `Bearer ${token.substring(0, 20)}...` : 'none'
  );

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-user-id': userId || '',
    },
  };
});

export const graphqlClient = new ApolloClient({
  link: from([sentryErrorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          applications: {
            merge(_existing = [], incoming: any[]) {
              return incoming;
            },
          },
          interviews: {
            merge(_existing = [], incoming: any[]) {
              return incoming;
            },
          },
          companies: {
            merge(_existing = [], incoming: any[]) {
              return incoming;
            },
          },
          contacts: {
            merge(_existing = [], incoming: any[]) {
              return incoming;
            },
          },
          documents: {
            merge(_existing = [], incoming: any[]) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default graphqlClient;
