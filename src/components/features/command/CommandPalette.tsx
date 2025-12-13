import { useThrottledCallback } from '@tanstack/react-pacer';
import { useNavigate } from '@tanstack/react-router';
import {
  BarChart3,
  Briefcase,
  Calendar,
  Download,
  FileText,
  Home,
  Plus,
  Search,
  Settings,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { useApplicationsStore } from '@/stores/applicationsStore';
import { useInterviewsStore } from '@/stores/interviewsStore';

interface Command {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
  icon?: React.ReactNode;
  shortcut?: string;
  category: 'navigation' | 'actions' | 'applications' | 'interviews';
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { applications } = useApplicationsStore();
  const { interviews } = useInterviewsStore();

  // Register Ctrl+K shortcut
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      description: 'Open command palette',
      action: () => setIsOpen(true),
    },
    {
      key: '/',
      description: 'Open command palette',
      action: () => setIsOpen(true),
    },
  ]);

  // Define available commands
  const commands: Command[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        keywords: ['home', 'overview'],
        icon: <Home className="w-4 h-4" />,
        shortcut: 'Alt+1',
        category: 'navigation',
        action: () => {
          navigate({ to: '/dashboard' });
          setIsOpen(false);
        },
      },
      {
        id: 'nav-applications',
        label: 'Go to Applications',
        keywords: ['jobs', 'apply'],
        icon: <Briefcase className="w-4 h-4" />,
        shortcut: 'Alt+2',
        category: 'navigation',
        action: () => {
          navigate({ to: '/applications' });
          setIsOpen(false);
        },
      },
      {
        id: 'nav-interviews',
        label: 'Go to Interviews',
        keywords: ['schedule', 'meetings'],
        icon: <Calendar className="w-4 h-4" />,
        shortcut: 'Alt+3',
        category: 'navigation',
        action: () => {
          navigate({ to: '/interviews' });
          setIsOpen(false);
        },
      },
      {
        id: 'nav-documents',
        label: 'Go to Documents',
        keywords: ['files', 'resume', 'cv'],
        icon: <FileText className="w-4 h-4" />,
        shortcut: 'Alt+4',
        category: 'navigation',
        action: () => {
          navigate({ to: '/documents' });
          setIsOpen(false);
        },
      },
      {
        id: 'nav-analytics',
        label: 'Go to Analytics',
        keywords: ['stats', 'reports', 'insights'],
        icon: <BarChart3 className="w-4 h-4" />,
        shortcut: 'Alt+5',
        category: 'navigation',
        action: () => {
          navigate({ to: '/analytics' });
          setIsOpen(false);
        },
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        keywords: ['preferences', 'config'],
        icon: <Settings className="w-4 h-4" />,
        shortcut: 'Alt+S',
        category: 'navigation',
        action: () => {
          navigate({ to: '/' });
          setIsOpen(false);
          // Navigate to settings (will work once route types are regenerated)
          window.location.href = '/settings';
        },
      },
      // Actions
      {
        id: 'action-new-application',
        label: 'New Application',
        description: 'Create a new job application',
        keywords: ['add', 'create', 'job'],
        icon: <Plus className="w-4 h-4" />,
        shortcut: 'N',
        category: 'actions',
        action: () => {
          navigate({ to: '/applications' });
          setIsOpen(false);
          // TODO: Open new application dialog
        },
      },
      {
        id: 'action-new-interview',
        label: 'Schedule Interview',
        description: 'Schedule a new interview',
        keywords: ['add', 'create', 'meeting'],
        icon: <Calendar className="w-4 h-4" />,
        category: 'actions',
        action: () => {
          navigate({ to: '/interviews' });
          setIsOpen(false);
          // TODO: Open new interview dialog
        },
      },
      {
        id: 'action-export',
        label: 'Export Data',
        description: 'Export applications to CSV/JSON',
        keywords: ['download', 'save', 'backup'],
        icon: <Download className="w-4 h-4" />,
        shortcut: 'Ctrl+E',
        category: 'actions',
        action: () => {
          navigate({ to: '/applications' });
          setIsOpen(false);
          // TODO: Trigger export
        },
      },
      {
        id: 'action-import',
        label: 'Import Data',
        description: 'Import applications from CSV/JSON',
        keywords: ['upload', 'load'],
        icon: <Upload className="w-4 h-4" />,
        shortcut: 'Ctrl+I',
        category: 'actions',
        action: () => {
          navigate({ to: '/applications' });
          setIsOpen(false);
          // TODO: Trigger import
        },
      },
      // Recent applications
      ...applications.slice(0, 5).map((app) => ({
        id: `app-${app.id}`,
        label: app.position,
        description: `${app.companyName} • ${app.status}`,
        keywords: [app.companyName, app.location || '', app.status],
        icon: <Briefcase className="w-4 h-4" />,
        category: 'applications' as const,
        action: () => {
          navigate({ to: '/applications' });
          setIsOpen(false);
          // TODO: Open application details
        },
      })),
      // Upcoming interviews
      ...interviews.slice(0, 5).map((interview) => {
        const app = applications.find((a) => a.id === interview.applicationId);
        return {
          id: `interview-${interview.id}`,
          label: interview.type,
          description: app ? `${app.position} at ${app.companyName}` : 'Interview',
          keywords: [app?.companyName || '', app?.position || '', interview.type].filter(Boolean),
          icon: <Calendar className="w-4 h-4" />,
          category: 'interviews' as const,
          action: () => {
            navigate({ to: '/interviews' });
            setIsOpen(false);
            // TODO: Open interview details
          },
        };
      }),
    ],
    [navigate, applications, interviews],
  );

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter((cmd) => {
      const labelMatch = cmd.label.toLowerCase().includes(searchLower);
      const descMatch = cmd.description?.toLowerCase().includes(searchLower);
      const keywordMatch = cmd.keywords?.some((kw) => kw.toLowerCase().includes(searchLower));
      return labelMatch || descMatch || keywordMatch;
    });
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    }
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = filteredCommands[selectedIndex];
        if (command) {
          command.action();
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [filteredCommands, selectedIndex],
  );

  // Throttled mouse enter handler (50ms for smooth but performant hover feedback)
  const handleMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const throttledMouseEnter = useThrottledCallback(handleMouseEnter, { wait: 50 });

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, []);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    applications: 'Recent Applications',
    interviews: 'Upcoming Interviews',
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="flex items-center border-b px-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
          <Badge variant="outline" className="ml-auto text-xs">
            Esc
          </Badge>
        </div>

        <ScrollArea className="max-h-[400px]">
          {Object.entries(groupedCommands).length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No results found</div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {categoryLabels[category]}
                  </div>
                  <div className="space-y-1">
                    {cmds.map((cmd) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          onClick={() => cmd.action()}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                            'hover:bg-muted/50',
                            globalIndex === selectedIndex && 'bg-muted',
                          )}
                          onMouseEnter={() => throttledMouseEnter(globalIndex)}
                        >
                          {cmd.icon && (
                            <div className="flex-shrink-0 text-muted-foreground">{cmd.icon}</div>
                          )}
                          <div className="flex-1 text-left">
                            <div className="font-medium">{cmd.label}</div>
                            {cmd.description && (
                              <div className="text-xs text-muted-foreground">{cmd.description}</div>
                            )}
                          </div>
                          {cmd.shortcut && (
                            <Badge variant="outline" className="text-xs ml-auto">
                              {cmd.shortcut}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">↵</kbd> Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">Esc</kbd> Close
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">Ctrl</kbd>+
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">K</kbd> to open
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
