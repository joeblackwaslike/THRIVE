import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

/**
 * Custom hook for registering global keyboard shortcuts
 * @param shortcuts Array of keyboard shortcut configurations
 * @param enabled Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isContentEditable = target.isContentEditable;

      if (isInput || isContentEditable) {
        // Allow Escape key to work in inputs
        if (event.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook providing common navigation shortcuts
 */
export function useNavigationShortcuts() {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: '1',
      alt: true,
      description: 'Go to Dashboard',
      action: () => navigate({ to: '/dashboard' }),
    },
    {
      key: '2',
      alt: true,
      description: 'Go to Applications',
      action: () => navigate({ to: '/applications' }),
    },
    {
      key: '3',
      alt: true,
      description: 'Go to Interviews',
      action: () => navigate({ to: '/interviews' }),
    },
    {
      key: '4',
      alt: true,
      description: 'Go to Documents',
      action: () => navigate({ to: '/documents' }),
    },
    {
      key: '5',
      alt: true,
      description: 'Go to Analytics',
      action: () => navigate({ to: '/analytics' }),
    },
    {
      key: 's',
      alt: true,
      description: 'Go to Settings',
      action: () => navigate({ to: '/settings' }),
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

/**
 * Format shortcut keys for display
 */
export function formatShortcutKeys(
  shortcut: Pick<KeyboardShortcut, 'key' | 'ctrl' | 'alt' | 'shift' | 'meta'>,
): string {
  const keys: string[] = [];

  if (shortcut.ctrl) keys.push('Ctrl');
  if (shortcut.alt) keys.push('Alt');
  if (shortcut.shift) keys.push('Shift');
  if (shortcut.meta) keys.push('⌘');

  keys.push(shortcut.key.toUpperCase());

  return keys.join('+');
}

/**
 * Check if user is on Mac
 */
export function isMac(): boolean {
  return typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}
