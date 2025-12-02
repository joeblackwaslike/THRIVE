# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

THRIVE is a comprehensive job application tracking system (Target, Hunt, Reach, Interview, Validate, Employ) built as a full-stack application with a React client and GraphQL backend. It manages the entire job search journey from application to offer with features including application tracking, interview preparation, company research, document management, analytics, and backend API with Supabase integration.

**Live Demo**: https://adriandarian.github.io/thrive/

## Essential Documentation

- **[README.md](./README.md)** - Project overview, features, quick start guide
- **[TESTING.md](./TESTING.md)** - Comprehensive testing documentation (56 tests, integration, unit, GraphQL)
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
- **[Pull Request Template](./.github/pull_request_template.md)** - PR checklist and guidelines

## Development Commands

### Essential Commands
```bash
# Install dependencies
pnpm install

# Start development (runs both client and server)
pnpm dev

# Start client only
pnpm run client:dev

# Start server only (GraphQL API)
pnpm run server:dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Type checking
pnpm run type-check

# Linting and formatting
pnpm run lint
pnpm run format

# Fix linting + formatting issues
pnpm run check

# Run Biome migration from ESLint/Prettier
pnpm run biome:migrate
```

### Testing Commands
```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm run test:ui

# Run tests with coverage report
pnpm run test:coverage

# Run integration tests only
pnpm run test:integration
```

### Deployment
```bash
# Deploy to GitHub Pages
pnpm run deploy

# Deployment happens automatically via GitHub Actions on push to main branch
```

## Architecture

### Tech Stack Core

**Frontend:**
- **Package Manager**: pnpm
- **Framework**: React 19 with TypeScript 5.9
- **Build Tool**: Vite 7
- **GraphQL Client**: Apollo Client (all data fetching via GraphQL)
- **Routing**: TanStack Router (type-safe, file-based routing)
- **State Management**: Zustand (21 stores) + TanStack Query (server/async state)
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Linting/Formatting**: Biome (replaces ESLint + Prettier)

**Backend:**
- **API**: GraphQL with Apollo Server + Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with JWT tokens
- **Testing**: Vitest + Supertest (56 passing tests)

### Key Libraries

**UI & Interaction:**
- **UI Components**: Radix UI primitives + shadcn/ui
- **Tables**: TanStack Table with virtual scrolling (TanStack Virtual)
- **Forms**: TanStack Form + Zod validation
- **Animations**: Framer Motion
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **Drag & Drop**: dnd-kit

**Data & State:**
- **GraphQL Client**: Apollo Client
- **State**: Zustand (21 stores), TanStack Query
- **Validation**: Zod 4.1
- **Date Handling**: date-fns 4.1

### Directory Structure
```
thrive/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components (auto-generated, be careful editing)
│   │   └── layout/      # Layout components (header, nav, etc.)
│   ├── routes/          # TanStack Router route files
│   │   ├── __root.tsx   # Root layout
│   │   ├── index.tsx    # Landing/dashboard
│   │   ├── applications.tsx
│   │   ├── companies.tsx
│   │   ├── interviews.tsx
│   │   ├── interviewprep.tsx
│   │   ├── documents.tsx
│   │   ├── analytics.tsx
│   │   ├── dashboard.tsx
│   │   ├── export.tsx
│   │   └── settings.tsx
│   ├── stores/          # Zustand state stores (21 stores)
│   │   ├── applicationsStore.ts
│   │   ├── companiesStore.ts
│   │   ├── contactsStore.ts
│   │   ├── documentsStore.ts
│   │   ├── interviewsStore.ts
│   │   ├── interviewPrepStore.ts
│   │   ├── dashboardStore.ts
│   │   ├── dashboardLayoutStore.ts
│   │   ├── activityStore.ts
│   │   ├── annotationsStore.ts
│   │   ├── backupStore.ts
│   │   ├── customWidgetsStore.ts
│   │   ├── goalsStore.ts
│   │   ├── noteStore.ts
│   │   ├── notificationsStore.ts
│   │   ├── searchStore.ts
│   │   ├── settingsStore.ts
│   │   ├── tagStore.ts
│   │   ├── templateStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   ├── lib/             # Core utilities and GraphQL client
│   │   ├── graphql.ts   # Apollo Client configuration
│   │   └── utils.ts     # Helper functions
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts     # Main type exports
│   └── assets/          # Static assets
├── api/                 # Backend GraphQL API (if present)
│   ├── tests/          # API test suites
│   │   ├── integration/
│   │   ├── unit/
│   │    setup.ts
|   |   └──
│   ├── graphql/        # GraphQL schema and resolvers
|   |   ├── resolvers/
|   |   |   ├── analytics.ts
|   |   |   ├── applications.ys
|   |   |   ├── companies.ys
|   |   |   ├── contacts.ts
|   |   |   ├── documents.ts
|   |   |   └── interviews.ts 
|   |   ├── server.ts
|   |   ├── types.ts
|   ├── lib/
|   |   ├── auth.ts
|   |   ├── db.ts
|   |   └── supabase.ts
|   ├── types/
|   |   └── database.ts
|   ├── routes/
|   |    └── auth.ts
|   ├── app.ts
|   ├── index.ts
|   ├── server.ts
├── public/              # Public assets
├── supabase/
|   └── migrations/
|       └── 2023115_initial_schemas.sql
└── scripts/
```

### Data Flow Architecture

**Backend Database (Supabase/PostgreSQL)**:
- PostgreSQL database hosted on Supabase
- GraphQL API with Apollo Server providing all CRUD operations
- JWT-based authentication via Supabase Auth
- User-scoped data access with row-level security
- Document storage via Supabase Storage
- Database schema includes:
  - `applications`: Job applications with status tracking
  - `interviews`: Interview schedules linked to applications
  - `documents`: Resumes, cover letters, portfolios
  - `companies`: Company research and profiles
  - `contacts`: Recruiter/hiring manager contacts

**State Management Pattern**:
1. **Zustand stores** (`src/stores/*`) manage app state and business logic
2. Each store handles:
   - CRUD operations via GraphQL mutations/queries through Apollo Client
   - Optimistic UI updates for better user experience
   - Client-side state synchronization with backend
   - Derived state and computed values
3. **Apollo Client** manages all GraphQL communication and caching
4. **TanStack Query** provides additional async state management capabilities
5. Components read from stores via hooks like `useApplicationsStore()`

### Routing Pattern

Uses TanStack Router file-based routing:
- Route files in `src/routes/` define both route and component
- Type-safe routing with generated route tree (`routeTree.gen.ts` - auto-generated, don't edit)
- Supports catch-all route (`$.tsx`) for 404 handling

### Styling Patterns

- **Tailwind CSS 4** with custom configuration
- **shadcn/ui components** in `src/components/ui/` (installed via CLI, treat as generated code)
- Dark mode support via `dark:` Tailwind variant
- Responsive design using Tailwind breakpoints (`sm:`, `md:`, `lg:`, etc.)
- Custom theme colors defined in `tailwind.config.js` or `src/index.css`

## Important Patterns & Conventions

### GraphQL Operations (Apollo Client)
All data operations use GraphQL through Apollo Client:
```typescript
import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/graphql';

// Query
const GET_APPLICATIONS = gql`
  query GetApplications {
    applications {
      id
      companyName
      position
      status
    }
  }
`;

const { data } = await apolloClient.query({ query: GET_APPLICATIONS });

// Mutation
const CREATE_APPLICATION = gql`
  mutation CreateApplication($input: ApplicationInput!) {
    createApplication(input: $input) {
      id
      companyName
      position
    }
  }
`;

const { data } = await apolloClient.mutate({
  mutation: CREATE_APPLICATION,
  variables: { input: newApplication }
});
```

### Store Pattern (Zustand + GraphQL)
Zustand stores follow a consistent pattern with GraphQL:
```typescript
export const useExampleStore = create<ExampleStore>((set, get) => ({
  items: [],

  // Actions that mutate state AND sync to backend via GraphQL
  addItem: async (item) => {
    const { data } = await apolloClient.mutate({
      mutation: CREATE_ITEM,
      variables: { input: item }
    });
    set({ items: [...get().items, data.createItem] });
  },

  // Initialize from backend
  initialize: async () => {
    const { data } = await apolloClient.query({ query: GET_ITEMS });
    set({ items: data.items });
  },
}));
```

### Code Style (Biome)
- Single quotes for strings, double quotes for JSX
- Semicolons required
- 2-space indentation
- 100 character line width
- Import type enforcement (use `import type { ... }`)
- Run `bun run check` to auto-fix most issues

### Path Aliases
Use path aliases defined in `vite.config.ts`:
```typescript
import { Button } from '@/components/ui/button';
import { apolloClient } from '@/lib/graphql';
import { useApplicationsStore } from '@/stores';
```

## Testing Strategy

**Test Suite Overview** (56 passing tests):
- **Integration Tests**: GraphQL API with authentication
- **Unit Tests**: Authentication middleware, routes, and resolvers
- **Test Coverage**: ~85% for backend, frontend tests in progress

See [TESTING.md](./TESTING.md) for comprehensive testing documentation including:
- Running tests with Vitest
- Writing integration tests
- Authentication testing patterns
- GraphQL testing examples
- Debugging tests

## Development Workflow

### Setting Up Development Environment

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Start development server: `pnpm dev` (starts both client and API)
4. Visit http://localhost:5173

### API Development

The backend runs concurrently with the frontend:
- **Client Dev Server**: http://localhost:5173 (Vite)
- **API Server**: http://localhost:3001 (Express + GraphQL)
- API proxy configured in `vite.config.ts` for seamless `/api` requests

### Making Changes

1. **Before coding**: Read relevant files first
2. **Frontend changes**: Work in `src/` directory
3. **Backend changes**: Work in `api/` directory (if present)
4. **State changes**: Update Zustand stores in `src/stores/`
5. **Type changes**: Update types in `src/types/`
6. **Run tests**: `pnpm test` before committing
7. **Type check**: `pnpm run type-check`
8. **Lint/format**: `pnpm run check`

## Common Gotchas

1. **Auto-generated files**: Never manually edit:
   - `src/routeTree.gen.ts` (TanStack Router)
   - `src/components/ui/*` components (shadcn - regenerate via CLI instead)

2. **GraphQL Schema Changes**: When modifying the GraphQL schema:
   - Update schema definitions in `api/graphql/schema.graphql` (if using schema-first)
   - Update resolvers in `api/graphql/resolvers/`
   - Run tests to ensure no breaking changes

3. **Import from index**: Many stores export from `src/stores/index.ts`, use that barrel export

4. **Biome vs ESLint**: This project uses Biome, not ESLint. Don't add ESLint config.

5. **Concurrent Development**: When running `pnpm dev`, both frontend and backend start. Ensure no port conflicts.

6. **Vite Proxy**: API requests to `/api/*` are proxied to `localhost:3001`. Check `vite.config.ts` for configuration.

7. **Apollo Client Cache**: Be mindful of Apollo Client's cache when making mutations - use proper cache update strategies or refetch queries as needed.

## Key Files to Understand

- **`api/lib/db.ts`**: Supabase client configuration - backend database connection
- **`src/lib/graphql.ts`**: Apollo Client configuration - frontend GraphQL client
- **`vite.config.ts`**: Build config, aliases, chunk optimization, API proxy
- **`src/routes/__root.tsx`**: Root layout, global providers, theme setup
- **`biome.json`**: Linting and formatting rules
- **`src/stores/applicationsStore.ts`**: Example of the store pattern with GraphQL (most complex feature)
- **`src/types/index.ts`**: TypeScript type definitions for the application
- **`package.json`**: Scripts, dependencies, and project metadata
- **`api/graphql/resolvers/`**: GraphQL resolvers - backend data operations

## Adding New Features

1. **New route**: Create file in `src/routes/` (e.g., `newfeature.tsx`), router auto-detects
2. **New data entity**:
   - Add PostgreSQL table via Supabase migration
   - Create GraphQL schema types and resolvers in `api/graphql/`
   - Create corresponding Zustand store in `src/stores/`
3. **New UI component**: Use shadcn CLI (`pnpm dlx shadcn-ui@latest add <component>`) for base components
4. **New type**: Add to `src/types/` or colocate with feature
5. **New backend endpoint**: Add GraphQL schema and resolvers in `api/graphql/` directory
6. **New tests**: Add to `api/tests/` for backend, follow patterns in [TESTING.md](./TESTING.md)

## Performance Considerations

- Virtual scrolling is used for large tables (TanStack Virtual)
- Manual chunk splitting in `vite.config.ts` separates React, TanStack, and UI vendors
- PostgreSQL queries are optimized with proper indexes and query planning
- Lazy load heavy components with `React.lazy()` if needed
- API requests are optimized with Apollo Client caching and batching
- GraphQL queries should request only needed fields to minimize payload size
- Use Apollo Client's `fetchPolicy` options appropriately (cache-first, network-only, etc.)

## Deployment

### Production Build
```bash
pnpm run build
```

Builds the optimized production bundle to `dist/` directory.

### Automated Deployment
- Automatic deployment to GitHub Pages via GitHub Actions on push to `main`
- See `.github/workflows/deploy.yml` for CI/CD configuration (if present)

### Manual Deployment
```bash
pnpm run deploy
```

## Project Status

**Current Version**: 0.1.0

**Status**: ✅ Deployed to Production

**Features**:
- ✅ Full-stack application (React + GraphQL API)
- ✅ Authentication with Supabase
- ✅ Comprehensive test suite (56 tests)
- ✅ Job application tracking
- ✅ Interview preparation tools
- ✅ Document management
- ✅ Analytics and reporting
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Accessibility (WCAG 2.1 AA)

See [CHANGELOG.md](./CHANGELOG.md) for detailed release history.

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 5173 (client) and 3001 (API) are available
2. **Database errors**: Check Supabase connection and PostgreSQL schema
3. **Type errors**: Run `pnpm run type-check` to identify issues
4. **Lint errors**: Run `pnpm run check` to auto-fix
5. **API connection**: Verify Supabase credentials in `.env` file
6. **GraphQL errors**: Check resolver implementation and schema types
7. **Authentication issues**: Verify JWT token handling and Supabase Auth configuration
8. **Test failures**: See [TESTING.md](./TESTING.md) for debugging guidance

### Getting Help

- Check existing documentation in this repository
- Review [README.md](./README.md) for quick start guide
- Check [TESTING.md](./TESTING.md) for testing issues
- Review [CHANGELOG.md](./CHANGELOG.md) for recent changes
- Check pull request template ([.github/pull_request_template.md](./.github/pull_request_template.md))

## Best Practices

### Code Quality
- Always run `pnpm run check` before committing
- Write tests for new features (see [TESTING.md](./TESTING.md))
- Use TypeScript strict mode
- Follow existing patterns in the codebase

### Git Workflow
- Create feature branches from `main`
- Use descriptive commit messages
- Reference issues in commits
- Use PR template ([.github/pull_request_template.md](./.github/pull_request_template.md))

### Security
- Never commit `.env` files
- Use environment variables for sensitive data
- Follow OWASP security guidelines
- Test authentication thoroughly

## Additional Resources

- **Live Demo**: https://adriandarian.github.io/thrive/
- **GitHub Repository**: Check for wiki and issues
- **pnpm Documentation**: https://pnpm.io/
- **React 19 Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **TanStack Router**: https://tanstack.com/router
- **Zustand**: https://zustand-demo.pmnd.rs
- **Biome**: https://biomejs.dev
- **Supabase**: https://supabase.com/docs
- **GraphQL**: https://graphql.org/learn
- **Apollo**: https://www.apollographql.com/docs
