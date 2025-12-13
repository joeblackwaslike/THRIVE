import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import type { Server } from 'node:http';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault} from '@apollo/server/plugin/landingPage/default';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLScalarType, Kind } from 'graphql';
import { gql } from 'graphql-tag';
import type { Application } from 'express';
import { getUserIdFromRequest, optionalAuth } from '../lib/auth.ts';
import logger from '../logger.ts';

import { analyticsResolver } from './resolvers/analytics.ts';
import { applicationsResolver } from './resolvers/applications.ts';
import { companiesResolver } from './resolvers/companies.ts';
import { contactsResolver } from './resolvers/contacts.ts';
import { documentsResolver } from './resolvers/documents.ts';
import { interviewsResolver } from './resolvers/interviews.ts';
import ApolloLoggingPlugin from './plugins/ApolloLoggingPlugin.ts';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
interface ApolloContext {
  // we'd define the properties a user should have
  // in a separate user interface (e.g., email, id, url, etc.)
  user: UserInterface;
}

// GraphQL type definitions from ./schema.graphql
const typeDefs = gql(
  readFileSync(path.resolve(__dirname, './schema.graphql'), {
    encoding: 'utf-8',
  }),
);

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: [
    {
      Date: new GraphQLScalarType({
        name: 'Date',
        serialize(value: string | number | Date): string {
          const d = value instanceof Date ? value : new Date(value);
          return d.toISOString();
        },
        parseValue(value: any) {
          return value ? new Date(value as any) : null;
        },
        parseLiteral(ast) {
          return ast.kind === Kind.STRING ? new Date(ast.value) : null;
        },
      }),
      JSON: new GraphQLScalarType({
        name: 'JSON',
        serialize(value: any) {
          return value;
        },
        parseValue(value: any) {
          return value;
        },
        parseLiteral(ast) {
          switch (ast.kind) {
            case Kind.STRING:
              return ast.value;
            case Kind.INT:
              return parseInt(ast.value, 10);
            case Kind.FLOAT:
              return parseFloat(ast.value);
            case Kind.BOOLEAN:
              return ast.value === 'true';
            case Kind.NULL:
              return null;
            case Kind.LIST:
              return (ast.values || []).map((v: any) => v.value ?? null);
            case Kind.OBJECT: {
              const obj: any = {};
              for (const field of ast.fields || [])
                obj[field.name.value] = (field.value as any)?.value ?? null;
              return obj;
            }
            default:
              return null;
          }
        },
      }),
    },
    applicationsResolver,
    interviewsResolver,
    companiesResolver,
    contactsResolver,
    documentsResolver,
    analyticsResolver,
  ],
});

export async function createApolloServer(expressApp: Application, httpServer: Server) {
  const landingPageOptions = { embed: {initialState: {pollForSchemaUpdates: false}} };
  const server = new ApolloServer<ApolloContext>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      process.env.NODE_ENV === 'production' ? ApolloServerPluginLandingPageProductionDefault({footer: false}) : ApolloServerPluginLandingPageLocalDefault(landingPageOptions),
      ApolloLoggingPlugin(),
    ],
  });

  await server.start();

  expressApp.use('/graphql', optionalAuth, async (req, res, next) => {
    if (req.method === 'POST') {
      logger.debug({
        authorization: req.headers.authorization ? 'Bearer [TOKEN]' : 'missing',
        'x-user-id': req.headers['x-user-id'],
        'content-type': req.headers['content-type'],
      }, 'GraphQL server debug - Headers received:');

      logger.debug({ authorization: req.headers.authorization }, 'GraphQL server debug - Full auth header:');
      logger.debug({ 'x-user-id': req.headers['x-user-id'] }, 'GraphQL server debug - X-User-Id header:');

      const userId = getUserIdFromRequest(req);

      try {
        const body = (req as any).body as {
          query: string;
          variables?: Record<string, unknown>;
          operationName?: string;
        };
        if (!body || typeof body !== 'object' || !body.query) {
          res.status(400).json({ error: 'Invalid GraphQL request body' });
          return;
        }

        const isIntrospection = body.operationName === 'IntrospectionQuery';
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        if (isIntrospection && introspectionCache && (now - (lastIntrospectionAtByIp[ip] || 0)) < 8000) {
          res.status(200).json(introspectionCache);
          return;
        }

        const result = await server.executeOperation(
          {
            query: body.query,
            variables: body.variables,
            operationName: body.operationName,
          },
          {
            contextValue: { userId }, // userId can be null for unauthenticated requests
          },
        );

        const single = (result as any)?.body?.singleResult ?? result;
        if (isIntrospection) {
          introspectionCache = single;
          lastIntrospectionAtByIp[ip] = now;
        }
        res.status(200).json(single);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    } else if (req.method === 'GET') {
      const host = req.get('host');
      const endpoint = `http://${host}/graphql`;
      if (process.env.APOLLO_STUDIO === 'true') {
        const sandboxUrl = `https://studio.apollographql.com/sandbox?endpoint=${encodeURIComponent(endpoint)}`;
        res.redirect(302, sandboxUrl);
      } else if (introspectionCache) {
        res.set('cache-control', 'public, max-age=60');
        res.status(200).json(introspectionCache);
      } else {
        next();
      }
    } else {
      next();
    }
  });
}
