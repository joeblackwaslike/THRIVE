import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { createRootRoute, Outlet, redirect, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { GlobalAnnouncer } from '@/components/a11y/LiveRegion';
import { SkipNav } from '@/components/a11y/SkipNav';
import { ZustandDevtoolsPanel } from '@/components/devtools/ZustandDevtoolsPanel';
import { CommandPalette } from '@/components/features/command/CommandPalette';
import { MainLayout } from '@/components/layout';
import { Toaster } from '@/components/ui/sonner';
import { useNavigationShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSentryNavigation, useSentryUser } from '@/hooks/useSentry';

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('supabase-auth-token') : null;
    const path = location.pathname;

    // Allow access to login and test pages without authentication
    if (!token && path !== '/login' && path !== '/test') {
      throw redirect({
        to: '/login' as any,
      });
    }
  },
  component: RootComponent,
});

function RootComponent() {
  // Enable navigation shortcuts globally
  useNavigationShortcuts();
  const routerState = useRouterState();
  const location = routerState.location.pathname;

  // Initialize Sentry user tracking
  useSentryUser();

  // Track navigation changes
  useSentryNavigation(location);

  // Render login page without MainLayout
  if (location === '/login') {
    return (
      <>
        <SkipNav />
        <GlobalAnnouncer />
        <Toaster />
        <CommandPalette />
        <Outlet />
      </>
    );
  }

  // Render other pages with MainLayout
  return (
    <>
      <SkipNav />
      <GlobalAnnouncer />
      <Toaster />
      <CommandPalette />
      {import.meta.env.DEV && (
        <TanStackDevtools
          config={{ hideUntilHover: true }}
          plugins={[
            {
              name: 'TanStack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'Zustand Stores',
              render: <ZustandDevtoolsPanel />,
            },
          ]}
        />
      )}
      <MainLayout>
        <Outlet />
      </MainLayout>
    </>
  );
}
