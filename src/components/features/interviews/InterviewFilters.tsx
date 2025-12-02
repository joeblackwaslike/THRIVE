import { ChevronDown, Filter, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  type RelativeDateRange,
  RelativeDateRangeSlider,
} from '@/components/ui/relative-date-range-slider';
import { Separator } from '@/components/ui/separator';
import { INTERVIEW_STATUSES, INTERVIEW_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useInterviewsStore } from '@/stores/interviewsStore';

// Preset relative date ranges for interview scheduling
const RELATIVE_DATE_RANGES: RelativeDateRange[] = [
  { label: 'Last 7 days', shortLabel: '-7d', value: 'last-7d', days: 7, direction: 'past' },
  { label: 'Last 14 days', shortLabel: '-14d', value: 'last-14d', days: 14, direction: 'past' },
  { label: 'Last 30 days', shortLabel: '-30d', value: 'last-30d', days: 30, direction: 'past' },
  { label: 'Next 7 days', shortLabel: '+7d', value: 'next-7d', days: 7, direction: 'future' },
  { label: 'Next 14 days', shortLabel: '+14d', value: 'next-14d', days: 14, direction: 'future' },
  { label: 'Next 30 days', shortLabel: '+30d', value: 'next-30d', days: 30, direction: 'future' },
];

interface InterviewFiltersProps {
  savedFiltersButton?: React.ReactNode;
}

export function InterviewFilters({ savedFiltersButton }: InterviewFiltersProps) {
  const { filters, setFilters } = useInterviewsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRelativeRange, setSelectedRelativeRange] = useState<string>('next-7d');

  // Extract current filter values
  const typeFilters = filters.type || [];
  const statusFilters = filters.status || [];

  // Toggle filter functions
  const toggleTypeFilter = (
    type:
      | 'recruiter-screen'
      | 'phone-screen'
      | 'hiring-manager-chat'
      | 'video'
      | 'technical-assessment'
      | 'on-site'
      | 'technical-interview'
      | 'behavioral-interview'
      | 'leadership-interview'
      | 'panel'
      | 'final'
      | 'other'
  ) => {
    const newTypes = typeFilters?.includes(type as any)
      ? typeFilters.filter((t) => t !== type)
      : [...(typeFilters || []), type];
    setFilters({ type: newTypes.length > 0 ? newTypes : undefined });
  };

  const toggleStatusFilter = (
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show'
  ) => {
    const newStatuses = statusFilters.includes(status)
      ? statusFilters.filter((s) => s !== status)
      : [...statusFilters, status];
    setFilters({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const clearAllFilters = () => {
    setFilters({
      type: undefined,
      status: undefined,
      dateRange: undefined,
    });
  };

  // Count active filters
  const activeFilterCount = typeFilters.length + statusFilters.length;
  const hasDateFilters = filters.dateRange?.start || filters.dateRange?.end;
  const totalActiveFilters = activeFilterCount + (hasDateFilters ? 1 : 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-9', totalActiveFilters > 0 && 'border-primary bg-primary/5')}
        >
          <Filter className="mr-2 h-3.5 w-3.5" />
          Filters
          {totalActiveFilters > 0 && (
            <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
              {totalActiveFilters}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Header with Saved Filters */}
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm">Filter Interviews</h4>
            <div className="flex items-center gap-1">
              {savedFiltersButton}
              {totalActiveFilters > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs">
                  <X className="mr-1 h-3 w-3" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Interview Type with Dropdown */}
          <div className="space-y-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-2 py-1.5 -mx-2 rounded-md hover:bg-accent text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                      Interview Type
                    </span>
                    {typeFilters.length > 0 && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                        {typeFilters.length}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {INTERVIEW_TYPES.map((type) => (
                  <DropdownMenuItem key={type.value} onClick={() => toggleTypeFilter(type.value)}>
                    <div className="flex items-center justify-between w-full">
                      <span>{type.label}</span>
                      {typeFilters.includes(type.value) && (
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {typeFilters.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2">
                {typeFilters.map((type) => {
                  const typeConfig = INTERVIEW_TYPES.find((t) => t.value === type);
                  return (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/10"
                      onClick={() => toggleTypeFilter(type)}
                    >
                      {typeConfig?.label}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Status with Dropdown */}
          <div className="space-y-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-2 py-1.5 -mx-2 rounded-md hover:bg-accent text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                      Status
                    </span>
                    {statusFilters.length > 0 && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                        {statusFilters.length}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {INTERVIEW_STATUSES.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => toggleStatusFilter(status.value)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{status.label}</span>
                      {statusFilters.includes(status.value) && (
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {statusFilters.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2">
                {statusFilters.map((status) => {
                  const statusConfig = INTERVIEW_STATUSES.find((s) => s.value === status);
                  return (
                    <Badge
                      key={status}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/10"
                      onClick={() => toggleStatusFilter(status)}
                    >
                      {statusConfig?.label}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Date Range with Calendar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">Scheduled Date Range</div>
              {hasDateFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters({ dateRange: undefined });
                    setSelectedRelativeRange('next-7d');
                  }}
                  className="h-5 text-xs px-2"
                >
                  <X className="mr-1 h-2.5 w-2.5" />
                  Clear
                </Button>
              )}
            </div>

            {/* Quick Relative Date Range Selection */}
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-3">Quick Select</div>
              <RelativeDateRangeSlider
                ranges={RELATIVE_DATE_RANGES}
                selectedValue={selectedRelativeRange}
                onChange={(value, dateRange) => {
                  setSelectedRelativeRange(value);
                  setFilters({
                    dateRange: {
                      start: dateRange.start,
                      end: dateRange.end,
                    },
                  });
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or pick specific dates</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={
                  filters.dateRange?.start && filters.dateRange?.end
                    ? {
                        from: filters.dateRange.start,
                        to: filters.dateRange.end,
                      }
                    : filters.dateRange?.start
                      ? { from: filters.dateRange.start, to: undefined }
                      : undefined
                }
                onSelect={(range) => {
                  if (range?.from) {
                    setFilters({
                      dateRange: {
                        start: range.from,
                        end: range.to,
                      },
                    });
                  } else {
                    setFilters({ dateRange: undefined });
                  }
                }}
                numberOfMonths={2}
                className="rounded-md border-0"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
