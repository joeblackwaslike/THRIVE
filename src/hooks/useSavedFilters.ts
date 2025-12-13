import { useCallback, useEffect, useState } from 'react';
import {
  APPLICATION_STATUSES,
  INTERVIEW_STATUSES,
  INTERVIEW_TYPES,
  PRIORITY_LEVELS,
  WORK_TYPES,
} from '@/lib/constants';
import type { ApplicationFilters, InterviewFilters } from '@/types';

interface SavedFilter {
  id: string;
  name: string;
  filters: ApplicationFilters | InterviewFilters;
  createdAt: Date;
}

const STORAGE_KEY_PREFIX = 'thrive-saved-filters';

export function useSavedFilters(filterType: 'applications' | 'interviews') {
  const storageKey = `${STORAGE_KEY_PREFIX}-${filterType}`;
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  // Load saved filters from localStorage
  useEffect(() => {
    const loadFilters = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          const filters = parsed.map((f: SavedFilter) => ({
            ...f,
            createdAt: new Date(f.createdAt),
            filters: {
              ...f.filters,
              dateRange: f.filters.dateRange
                ? {
                    start: f.filters.dateRange.start
                      ? new Date(f.filters.dateRange.start)
                      : undefined,
                    end: f.filters.dateRange.end ? new Date(f.filters.dateRange.end) : undefined,
                  }
                : undefined,
            },
          }));
          setSavedFilters(filters);
        }
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    };

    loadFilters();
  }, [storageKey]);

  // Save filters to localStorage
  const persistFilters = useCallback(
    (filters: SavedFilter[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(filters));
        setSavedFilters(filters);
      } catch (error) {
        console.error('Failed to save filters:', error);
      }
    },
    [storageKey],
  );

  // Save a new filter
  const saveFilter = useCallback(
    (name: string, filters: ApplicationFilters | InterviewFilters) => {
      const newFilter: SavedFilter = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        filters,
        createdAt: new Date(),
      };

      const updated = [...savedFilters, newFilter];
      persistFilters(updated);
    },
    [savedFilters, persistFilters],
  );

  // Delete a saved filter
  const deleteFilter = useCallback(
    (id: string) => {
      const updated = savedFilters.filter((f) => f.id !== id);
      persistFilters(updated);
    },
    [savedFilters, persistFilters],
  );

  // Update a saved filter
  const updateFilter = useCallback(
    (id: string, updates: Partial<SavedFilter>) => {
      const updated = savedFilters.map((f) => (f.id === id ? { ...f, ...updates } : f));
      persistFilters(updated);
    },
    [savedFilters, persistFilters],
  );

  // Generate a human-readable label for filters
  const getFilterLabel = useCallback(
    (filters: ApplicationFilters | InterviewFilters): string => {
      const parts: string[] = [];

      if (filterType === 'applications') {
        const appFilters = filters as ApplicationFilters;

        if (appFilters.status && appFilters.status.length > 0) {
          const labels = appFilters.status
            .map((s) => APPLICATION_STATUSES.find((st) => st.value === s)?.label || s)
            .join(', ');
          parts.push(`Status: ${labels}`);
        }

        if (appFilters.priority && appFilters.priority.length > 0) {
          const labels = appFilters.priority
            .map((p) => PRIORITY_LEVELS.find((pr) => pr.value === p)?.label || p)
            .join(', ');
          parts.push(`Priority: ${labels}`);
        }

        if (appFilters.workType && appFilters.workType.length > 0) {
          const labels = appFilters.workType
            .map((w) => WORK_TYPES.find((wt) => wt.value === w)?.label || w)
            .join(', ');
          parts.push(`Work: ${labels}`);
        }

        if (appFilters.searchQuery) {
          parts.push(`Search: "${appFilters.searchQuery}"`);
        }

        if (appFilters.dateRange?.start || appFilters.dateRange?.end) {
          const start = appFilters.dateRange.start
            ? new Date(appFilters.dateRange.start).toLocaleDateString()
            : 'Any';
          const end = appFilters.dateRange.end
            ? new Date(appFilters.dateRange.end).toLocaleDateString()
            : 'Now';
          parts.push(`Date: ${start} - ${end}`);
        }
      } else {
        const intFilters = filters as InterviewFilters;

        if (intFilters.type && intFilters.type.length > 0) {
          const labels = intFilters.type
            .map((t) => INTERVIEW_TYPES.find((it) => it.value === t)?.label || t)
            .join(', ');
          parts.push(`Type: ${labels}`);
        }

        if (intFilters.status && intFilters.status.length > 0) {
          const labels = intFilters.status
            .map((s) => INTERVIEW_STATUSES.find((st) => st.value === s)?.label || s)
            .join(', ');
          parts.push(`Status: ${labels}`);
        }

        if (intFilters.searchQuery) {
          parts.push(`Search: "${intFilters.searchQuery}"`);
        }

        if (intFilters.dateRange?.start || intFilters.dateRange?.end) {
          const start = intFilters.dateRange.start
            ? new Date(intFilters.dateRange.start).toLocaleDateString()
            : 'Any';
          const end = intFilters.dateRange.end
            ? new Date(intFilters.dateRange.end).toLocaleDateString()
            : 'Now';
          parts.push(`Date: ${start} - ${end}`);
        }
      }

      return parts.length > 0 ? parts.join(' • ') : 'No filters';
    },
    [filterType],
  );

  return {
    savedFilters,
    saveFilter,
    deleteFilter,
    updateFilter,
    getFilterLabel,
  };
}
