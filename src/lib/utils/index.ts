/**
 * Utility functions for the application
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 * Used by shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to locale string
 */
export function formatDate(
  date: Date | string | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'just now';
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic function requires any for flexibility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download data as JSON file
 */
// biome-ignore lint/suspicious/noExplicitAny: Accepts any JSON-serializable data
export function downloadJSON(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get status color for application status
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    target: 'bg-gray-500',
    hunting: 'bg-blue-500',
    applied: 'bg-yellow-500',
    interviewing: 'bg-purple-500',
    offer: 'bg-green-500',
    accepted: 'bg-emerald-600',
    rejected: 'bg-red-500',
    withdrawn: 'bg-gray-400',
  };
  return colors[status] || 'bg-gray-500';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>,
  );
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get document type icon emoji
 */
export function getDocumentTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    resume: '📄',
    cv: '📋',
    'cover-letter': '✉️',
    portfolio: '🎨',
    transcript: '📊',
    certification: '🏆',
    other: '📎',
  };
  return icons[type] || '📄';
}

/**
 * Get document type color scheme
 * Returns object with background, border, and text colors
 */
export function getDocumentTypeColors(type: string): {
  bg: string;
  border: string;
  text: string;
  badge: string;
} {
  const colors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    resume: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-900/50',
      text: 'text-blue-700 dark:text-blue-400',
      badge:
        'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800/50',
    },
    cv: {
      bg: 'bg-violet-50 dark:bg-violet-950/20',
      border: 'border-violet-200 dark:border-violet-900/50',
      text: 'text-violet-700 dark:text-violet-400',
      badge:
        'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-800/50',
    },
    'cover-letter': {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-900/50',
      text: 'text-emerald-700 dark:text-emerald-400',
      badge:
        'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/50',
    },
    portfolio: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      border: 'border-rose-200 dark:border-rose-900/50',
      text: 'text-rose-700 dark:text-rose-400',
      badge:
        'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800/50',
    },
    transcript: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-900/50',
      text: 'text-orange-700 dark:text-orange-400',
      badge:
        'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800/50',
    },
    certification: {
      bg: 'bg-teal-50 dark:bg-teal-950/20',
      border: 'border-teal-200 dark:border-teal-900/50',
      text: 'text-teal-700 dark:text-teal-400',
      badge:
        'bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-800/50',
    },
    other: {
      bg: 'bg-slate-50 dark:bg-slate-950/20',
      border: 'border-slate-200 dark:border-slate-800/50',
      text: 'text-slate-700 dark:text-slate-400',
      badge:
        'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700/50',
    },
  };
  return colors[type] || colors.other;
}

/**
 * Get document usage indicator based on application count
 * Returns indicator type and styling
 */
export function getDocumentUsageIndicator(usageCount: number): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
} {
  if (usageCount === 0) {
    return {
      label: 'Unused',
      variant: 'outline',
      className: 'text-muted-foreground border-muted-foreground/30',
    };
  } else if (usageCount === 1) {
    return {
      label: '1 app',
      variant: 'secondary',
      className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    };
  } else if (usageCount <= 3) {
    return {
      label: `${usageCount} apps`,
      variant: 'secondary',
      className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    };
  } else {
    return {
      label: `${usageCount} apps`,
      variant: 'default',
      className:
        'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600 dark:border-emerald-500',
    };
  }
}

/**
 * Check if document is recently updated (within 7 days)
 */
export function isDocumentRecent(updatedAt: Date | string): boolean {
  const date = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
  const now = new Date();
  const daysDiff = daysBetween(date, now);
  return daysDiff <= 7;
}

/**
 * Check if document is outdated (not updated in 30+ days)
 */
export function isDocumentOutdated(updatedAt: Date | string): boolean {
  const date = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
  const now = new Date();
  const daysDiff = daysBetween(date, now);
  return daysDiff >= 30;
}
