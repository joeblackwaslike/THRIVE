import { readFileSync } from "fs";
import { fileURLToPath } from 'url';
import path from "path";
import type { Server } from 'node:http';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLScalarType, Kind } from 'graphql';
import { gql } from "graphql-tag";
import type { Express } from 'express';
import { getUserIdFromRequest, optionalAuth } from '../lib/auth.ts';
import logger from '../logger.ts';

import { analyticsResolver } from './resolvers/analytics.ts';
import { applicationsResolver } from './resolvers/applications.ts';
import { companiesResolver } from './resolvers/companies.ts';
import { contactsResolver } from './resolvers/contacts.ts';
import { documentsResolver } from './resolvers/documents.ts';
import { interviewsResolver } from './resolvers/interviews.ts';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GraphQL type definitions from ./schema.graphql
const typeDefs = gql(
  readFileSync(path.resolve(__dirname, "./schema.graphql"), {
    encoding: "utf-8",
  })
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

export async function createApolloServer(expressApp: Express, httpServer: Server) {
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  await server.start();

  expressApp.use('/graphql', optionalAuth, async (req, res, next) => {
    if (req.method === 'POST') {
      logger.debug('GraphQL server debug - Headers received:', {
        authorization: req.headers.authorization ? 'Bearer [TOKEN]' : 'missing',
        'x-user-id': req.headers['x-user-id'],
        'content-type': req.headers['content-type'],
      });

      logger.debug('GraphQL server debug - Full auth header:', req.headers.authorization);
      logger.debug('GraphQL server debug - X-User-Id header:', req.headers['x-user-id']);

      const userId = getUserIdFromRequest(req);

      try {
        const parsedBody = (req as any).body;
        const body =
          parsedBody && typeof parsedBody === 'object'
            ? parsedBody
            : await new Promise<{
                query: string;
                variables?: Record<string, unknown>;
                operationName?: string;
              }>((resolve, reject) => {
                let data = '';
                req.on('data', (chunk) => {
                  data += chunk;
                });
                req.on('end', () => {
                  try {
                    resolve(JSON.parse(data || '{}'));
                  } catch (e) {
                    reject(e);
                  }
                });
              });

        const result = await server.executeOperation(
          {
            query: body.query,
            variables: body.variables,
            operationName: body.operationName,
          },
          {
            contextValue: { userId }, // userId can be null for unauthenticated requests
          }
        );

        const single = (result as any)?.body?.singleResult ?? result;
        res.status(200).json(single);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    } else if (req.method === 'GET') {
      const host = req.get('host');
      const endpoint = `http://${host}/graphql`;
      const sandboxUrl = `https://studio.apollographql.com/sandbox?endpoint=${encodeURIComponent(endpoint)}`;
      res.redirect(302, sandboxUrl);
    } else {
      next();
    }
  });
}
