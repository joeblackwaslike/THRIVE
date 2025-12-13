import { Filter, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { APPLICATION_STATUSES, PRIORITY_LEVELS, WORK_TYPES } from '@/lib/constants';
import type { Application } from '@/types';

export interface AnalyticsFilters {
  statuses: string[];
  companyNames: string[];
  workTypes: string[];
  priorities: string[];
  tags: string[];
  source?: string;
}

interface AnalyticsFiltersProps {
  applications: Application[];
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onReset: () => void;
}

export function AnalyticsFiltersPanel({
  applications,
  filters,
  onFiltersChange,
  onReset,
}: AnalyticsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract unique values from applications (companyNames are used inline in the component)

  const uniqueSources = Array.from(
    new Set(
      applications.map((app) => (app as Application & { source?: string }).source).filter(Boolean),
    ),
  );

  const uniqueTags = Array.from(new Set(applications.flatMap((app) => app.tags || [])));

  const addFilter = (key: keyof AnalyticsFilters, value: string) => {
    const currentValues = filters[key] as string[];
    if (Array.isArray(currentValues)) {
      if (!currentValues.includes(value)) {
        onFiltersChange({
          ...filters,
          [key]: [...currentValues, value],
        });
      }
    } else {
      onFiltersChange({
        ...filters,
        [key]: value,
      });
    }
  };

  const removeFilter = (key: keyof AnalyticsFilters, value: string) => {
    const currentValues = filters[key] as string[];
    if (Array.isArray(currentValues)) {
      onFiltersChange({
        ...filters,
        [key]: currentValues.filter((v) => v !== value),
      });
    } else {
      onFiltersChange({
        ...filters,
        [key]: undefined,
      });
    }
  };

  const hasActiveFilters =
    filters.statuses.length > 0 ||
    filters.companyNames.length > 0 ||
    filters.workTypes.length > 0 ||
    filters.priorities.length > 0 ||
    filters.tags.length > 0 ||
    !!filters.source;

  const activeFilterCount =
    filters.statuses.length +
    filters.companyNames.length +
    filters.workTypes.length +
    filters.priorities.length +
    filters.tags.length +
    (filters.source ? 1 : 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Filter analytics data by various criteria
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                <span className="text-xs">Reset</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-3"
            >
              <span className="text-xs">{isExpanded ? 'Hide' : 'Show'} Filters</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-4">
          {/* Filters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select onValueChange={(value) => addFilter('statuses', value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Work Type Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Work Type</Label>
              <Select onValueChange={(value) => addFilter('workTypes', value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select work type..." />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Priority</Label>
              <Select onValueChange={(value) => addFilter('priorities', value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags Filter */}
            {uniqueTags.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tags</Label>
                <Select onValueChange={(value) => addFilter('tags', value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Source Filter */}
            {uniqueSources.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Source</Label>
                <Select
                  value={filters.source || ''}
                  onValueChange={(value) => addFilter('source', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sources</SelectItem>
                    {uniqueSources.map((source) => (
                      <SelectItem key={source} value={source || ''}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="mt-3 space-y-2">
              {filters.statuses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {filters.statuses.map((status) => (
                    <Badge key={status} variant="secondary" className="h-5 px-1.5 text-xs">
                      {APPLICATION_STATUSES.find((s) => s.value === status)?.label || status}
                      <button
                        type="button"
                        onClick={() => removeFilter('statuses', status)}
                        className="ml-1 rounded-sm hover:bg-muted"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {filters.workTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {filters.workTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="h-5 px-1.5 text-xs">
                      {WORK_TYPES.find((t) => t.value === type)?.label || type}
                      <button
                        type="button"
                        onClick={() => removeFilter('workTypes', type)}
                        className="ml-1 rounded-sm hover:bg-muted"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {filters.priorities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {filters.priorities.map((priority) => (
                    <Badge key={priority} variant="secondary" className="h-5 px-1.5 text-xs">
                      {PRIORITY_LEVELS.find((p) => p.value === priority)?.label || priority}
                      <button
                        type="button"
                        onClick={() => removeFilter('priorities', priority)}
                        className="ml-1 rounded-sm hover:bg-muted"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {filters.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="h-5 px-1.5 text-xs">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeFilter('tags', tag)}
                        className="ml-1 rounded-sm hover:bg-muted"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Apply filters to applications
 */
export function applyAnalyticsFilters(
  applications: Application[],
  filters: AnalyticsFilters,
): Application[] {
  return applications.filter((app) => {
    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(app.status)) {
      return false;
    }

    // Company filter
    if (filters.companyNames.length > 0 && !filters.companyNames.includes(app.companyName)) {
      return false;
    }

    // Work type filter
    if (filters.workTypes.length > 0 && !filters.workTypes.includes(app.workType || '')) {
      return false;
    }

    // Priority filter
    if (
      filters.priorities.length > 0 &&
      app.priority &&
      !filters.priorities.includes(app.priority)
    ) {
      return false;
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some((tag) => app.tags?.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Source filter
    if (filters.source && (app as Application & { source?: string }).source !== filters.source) {
      return false;
    }

    return true;
  });
}
