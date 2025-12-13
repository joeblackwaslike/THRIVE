import { cn } from '@/lib/utils';

/**
 * Skip Navigation Links
 * Allows keyboard users to skip directly to main content
 * Hidden by default, visible on focus
 */
export function SkipNav() {
  return (
    <>
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only',
          'fixed top-4 left-4 z-50',
          'bg-primary text-primary-foreground',
          'px-4 py-2 rounded-md',
          'font-medium',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        )}
      >
        Skip to main content
      </a>
      <a
        href="#main-nav"
        className={cn(
          'sr-only focus:not-sr-only',
          'fixed top-4 left-4 z-50',
          'bg-primary text-primary-foreground',
          'px-4 py-2 rounded-md',
          'font-medium',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        )}
      >
        Skip to navigation
      </a>
    </>
  );
}
