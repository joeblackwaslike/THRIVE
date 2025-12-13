import { Bookmark, Filter, X } from 'lucide-react';
import { useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SalaryRangeSlider } from '@/components/ui/salary-range-slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { APPLICATION_STATUSES, PRIORITY_LEVELS, WORK_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useApplicationsStore } from '@/stores';
import type { ApplicationFilters as ApplicationFiltersType, ApplicationStatus } from '@/types';
import { SavedFiltersDialog } from '../filters/SavedFiltersDialog';

export function UnifiedFilters() {
  const { filters, setFilters } = useApplicationsStore();
  const [isOpen, setIsOpen] = useState(false);
  const dateFromId = useId();
  const dateToId = useId();

  // Extract current filter values
  const statusFilters = filters.status || [];
  const priorityFilters = filters.priority || [];
  const workTypeFilters = filters.workType || [];
  const employmentTypeFilters = filters.employmentType || [];
  const hasDateFilters = filters.dateRange?.start || filters.dateRange?.end;
  const hasSalaryFilter = filters.salaryRange !== undefined;

  // Toggle filter functions
  const toggleStatusFilter = (status: ApplicationStatus) => {
    const newStatuses = statusFilters.includes(status)
      ? statusFilters.filter((s) => s !== status)
      : [...statusFilters, status];
    setFilters({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const togglePriorityFilter = (priority: 'low' | 'medium' | 'high') => {
    const newPriorities = priorityFilters.includes(priority)
      ? priorityFilters.filter((p) => p !== priority)
      : [...priorityFilters, priority];
    setFilters({ priority: newPriorities.length > 0 ? newPriorities : undefined });
  };

  const toggleWorkTypeFilter = (workType: 'remote' | 'hybrid' | 'onsite') => {
    const newWorkTypes = workTypeFilters.includes(workType)
      ? workTypeFilters.filter((w) => w !== workType)
      : [...workTypeFilters, workType];
    setFilters({ workType: newWorkTypes.length > 0 ? newWorkTypes : undefined });
  };

  const toggleEmploymentTypeFilter = (
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship',
  ) => {
    const newTypes = employmentTypeFilters.includes(employmentType)
      ? employmentTypeFilters.filter((t) => t !== employmentType)
      : [...employmentTypeFilters, employmentType];
    setFilters({ employmentType: newTypes.length > 0 ? newTypes : undefined });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  // Count active filters
  const activeFilterCount =
    statusFilters.length +
    priorityFilters.length +
    workTypeFilters.length +
    employmentTypeFilters.length +
    (hasDateFilters ? 1 : 0) +
    (hasSalaryFilter ? 1 : 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(activeFilterCount > 0 && 'border-primary bg-primary/5')}
        >
          <Filter className="h-4 w-4" />
          <span className="ml-2">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h3 className="font-semibold text-xs">Filter Applications</h3>
          <div className="flex items-center gap-1">
            <SavedFiltersDialog
              filterType="applications"
              currentFilters={filters}
              onLoadFilter={(loadedFilters) => setFilters(loadedFilters as ApplicationFiltersType)}
              trigger={
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Bookmark className="h-3 w-3" />
                </Button>
              }
            />
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={clearAllFilters}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-3 space-y-3">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Status</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {APPLICATION_STATUSES.map((status) => (
                  <div key={status.value} className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={statusFilters.includes(status.value)}
                      onCheckedChange={() => toggleStatusFilter(status.value)}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor={`status-${status.value}`}
                      className="text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <div className={cn('w-1.5 h-1.5 rounded-full', `bg-${status.color}-500`)} />
                      {status.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Priority</Label>
              <div className="flex gap-3">
                {PRIORITY_LEVELS.map((priority) => (
                  <div key={priority.value} className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`priority-${priority.value}`}
                      checked={priorityFilters.includes(priority.value)}
                      onCheckedChange={() => togglePriorityFilter(priority.value)}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor={`priority-${priority.value}`}
                      className="text-xs cursor-pointer capitalize"
                    >
                      {priority.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Work Type Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Work Type</Label>
              <div className="flex gap-3">
                {WORK_TYPES.map((workType) => (
                  <div key={workType.value} className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`work-type-${workType.value}`}
                      checked={workTypeFilters.includes(workType.value)}
                      onCheckedChange={() => toggleWorkTypeFilter(workType.value)}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor={`work-type-${workType.value}`}
                      className="text-xs cursor-pointer capitalize"
                    >
                      {workType.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Employment Type Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Employment Type</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {['full-time', 'part-time', 'contract', 'internship'].map((type) => (
                  <div key={type} className="flex items-center space-x-1.5">
                    <Checkbox
                      className="h-3.5 w-3.5"
                      id={`employment-${type}`}
                      checked={employmentTypeFilters.includes(
                        type as 'full-time' | 'part-time' | 'contract' | 'internship',
                      )}
                      onCheckedChange={() =>
                        toggleEmploymentTypeFilter(
                          type as 'full-time' | 'part-time' | 'contract' | 'internship',
                        )
                      }
                    />
                    <label
                      htmlFor={`employment-${type}`}
                      className="text-xs cursor-pointer capitalize"
                    >
                      {type.replace('-', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Applied Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={dateFromId} className="text-xs text-muted-foreground">
                    From
                  </Label>
                  <input
                    id={dateFromId}
                    type="date"
                    className="w-full px-2 py-1 text-xs border rounded-md bg-background mt-0.5"
                    value={
                      filters.dateRange?.start
                        ? new Date(filters.dateRange.start).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters({
                        dateRange: {
                          ...filters.dateRange,
                          start: value ? new Date(value) : undefined,
                        },
                      });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={dateToId} className="text-xs text-muted-foreground">
                    To
                  </Label>
                  <input
                    id={dateToId}
                    type="date"
                    className="w-full px-2 py-1 text-xs border rounded-md bg-background mt-0.5"
                    value={
                      filters.dateRange?.end
                        ? new Date(filters.dateRange.end).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters({
                        dateRange: {
                          ...filters.dateRange,
                          end: value ? new Date(value) : undefined,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Salary Range */}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Salary Range</Label>
                {hasSalaryFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-[10px]"
                    onClick={() => setFilters({ salaryRange: undefined })}
                  >
                    <X className="h-2.5 w-2.5 mr-0.5" />
                    Clear
                  </Button>
                )}
              </div>
              <SalaryRangeSlider
                minValue={filters.salaryRange?.min ?? 0}
                maxValue={filters.salaryRange?.max ?? 500000}
                onChange={(range) => setFilters({ salaryRange: range })}
                currency="USD"
              />
              <p className="text-[10px] text-muted-foreground">Filter by expected salary range</p>
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
