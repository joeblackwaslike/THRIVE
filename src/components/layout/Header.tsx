import { Link } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 max-w-screen-2xl items-center">
        <div className="mr-2 flex sm:mr-4 md:mr-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link
            to="/"
            className="mr-4 flex items-center space-x-2 sm:mr-6 cursor-pointer"
            aria-label="Thrive home"
          >
            <span className="text-lg font-bold sm:text-xl">THRIVE</span>
          </Link>
          <nav
            id="main-nav"
            className="hidden md:flex md:gap-4 lg:gap-6"
            aria-label="Main navigation"
          >
            <Link
              to="/applications"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary cursor-pointer"
              activeProps={{
                className:
                  'flex items-center text-sm font-medium text-foreground transition-colors cursor-pointer border-b-2 border-primary',
              }}
            >
              Applications
            </Link>
            <Link
              to="/interviews"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary cursor-pointer"
              activeProps={{
                className:
                  'flex items-center text-sm font-medium text-foreground transition-colors cursor-pointer border-b-2 border-primary',
              }}
            >
              Interviews
            </Link>
            <Link
              to="/documents"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary cursor-pointer"
              activeProps={{
                className:
                  'flex items-center text-sm font-medium text-foreground transition-colors cursor-pointer border-b-2 border-primary',
              }}
            >
              Documents
            </Link>
            <Link
              to="/companies"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary cursor-pointer"
              activeProps={{
                className:
                  'flex items-center text-sm font-medium text-foreground transition-colors cursor-pointer border-b-2 border-primary',
              }}
            >
              Companies
            </Link>
            <Link
              to="/analytics"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary cursor-pointer"
              activeProps={{
                className:
                  'flex items-center text-sm font-medium text-foreground transition-colors cursor-pointer border-b-2 border-primary',
              }}
            >
              Analytics
            </Link>
            <Link
              to="/interviewprep"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary cursor-pointer"
              activeProps={{
                className:
                  'flex items-center text-sm font-medium text-foreground transition-colors cursor-pointer border-b-2 border-primary',
              }}
            >
              Prep
            </Link>
            <Link
              to="/export"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary cursor-pointer"
              activeProps={{
                className:
                  'flex items-center text-sm font-medium text-foreground transition-colors cursor-pointer border-b-2 border-primary',
              }}
            >
              Export
            </Link>
            <Link
              to="/settings"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary cursor-pointer"
              activeProps={{
                className:
                  'flex items-center text-sm font-medium text-foreground transition-colors cursor-pointer border-b-2 border-primary',
              }}
            >
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
