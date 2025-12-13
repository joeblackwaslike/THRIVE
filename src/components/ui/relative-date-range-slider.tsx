import { addDays, startOfDay, subDays } from 'date-fns';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { RangeSlider } from './range-slider';

export interface RelativeDateRange {
  label: string;
  shortLabel: string;
  value: string;
  days: number;
  direction: 'past' | 'future' | 'both';
}

interface RelativeDateRangeSliderProps {
  ranges: RelativeDateRange[];
  selectedValue: string;
  onChange: (value: string, dateRange: { start: Date; end: Date }) => void;
  className?: string;
  disabled?: boolean;
  showLabels?: boolean;
}

/**
 * Relative Date Range Slider Component
 *
 * Provides quick preset date range selection using a visual slider.
 * Complements calendar pickers by offering common relative ranges.
 *
 * @example
 * ```tsx
 * const RELATIVE_RANGES: RelativeDateRange[] = [
 *   { label: 'Last 7 days', shortLabel: '7d', value: 'last-7d', days: 7, direction: 'past' },
 *   { label: 'Last 30 days', shortLabel: '30d', value: 'last-30d', days: 30, direction: 'past' },
 *   { label: 'Next 7 days', shortLabel: '+7d', value: 'next-7d', days: 7, direction: 'future' },
 * ];
 *
 * <RelativeDateRangeSlider
 *   ranges={RELATIVE_RANGES}
 *   selectedValue="last-7d"
 *   onChange={(value, dateRange) => {
 *     console.log('Selected:', value, dateRange);
 *   }}
 * />
 * ```
 */
export function RelativeDateRangeSlider({
  ranges,
  selectedValue,
  onChange,
  className,
  disabled = false,
  showLabels = true,
}: RelativeDateRangeSliderProps) {
  // Find the index of the selected range
  const selectedIndex = ranges.findIndex((r) => r.value === selectedValue);
  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const currentRange = ranges[currentIndex];

  // Calculate actual date range for current selection
  const calculatedDateRange = useMemo(() => {
    if (!currentRange) return null;

    const now = startOfDay(new Date());

    if (currentRange.direction === 'past') {
      return {
        start: subDays(now, currentRange.days),
        end: now,
      };
    } else if (currentRange.direction === 'future') {
      return {
        start: now,
        end: addDays(now, currentRange.days),
      };
    } else {
      // 'both' - centered around today
      const halfDays = Math.floor(currentRange.days / 2);
      return {
        start: subDays(now, halfDays),
        end: addDays(now, halfDays),
      };
    }
  }, [currentRange]);

  const handleSliderChange = (values: number[]) => {
    const index = Math.round(values[0]);
    const range = ranges[index];

    if (range && range.value !== selectedValue) {
      const now = startOfDay(new Date());
      let dateRange: { start: Date; end: Date };

      if (range.direction === 'past') {
        dateRange = {
          start: subDays(now, range.days),
          end: now,
        };
      } else if (range.direction === 'future') {
        dateRange = {
          start: now,
          end: addDays(now, range.days),
        };
      } else {
        const halfDays = Math.floor(range.days / 2);
        dateRange = {
          start: subDays(now, halfDays),
          end: addDays(now, halfDays),
        };
      }

      onChange(range.value, dateRange);
    }
  };

  const handleRangeClick = (index: number) => {
    if (!disabled) {
      const range = ranges[index];
      if (range && range.value !== selectedValue) {
        handleSliderChange([index]);
      }
    }
  };

  const formatRangeInfo = () => {
    if (!currentRange || !calculatedDateRange) return '';

    const directionLabel =
      currentRange.direction === 'past'
        ? '← Past'
        : currentRange.direction === 'future'
          ? 'Future →'
          : '← Today →';

    return `${currentRange.days} days ${directionLabel}`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current selection display */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{currentRange?.label || 'Select range'}</span>
        <span className="text-muted-foreground">{formatRangeInfo()}</span>
      </div>

      {/* Slider */}
      <div className="px-2">
        <RangeSlider
          min={0}
          max={ranges.length - 1}
          step={1}
          values={[currentIndex]}
          onChange={handleSliderChange}
          disabled={disabled}
          formatValue={(value) => {
            const range = ranges[Math.round(value)];
            return range?.shortLabel || '';
          }}
        />
      </div>

      {/* Tick marks with labels */}
      {showLabels && (
        <div className="relative px-2">
          <div className="flex justify-between">
            {ranges.map((range, index) => (
              <button
                key={range.value}
                type="button"
                onClick={() => handleRangeClick(index)}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-center gap-1 cursor-pointer transition-colors',
                  'hover:text-foreground focus:outline-none focus:text-foreground',
                  index === currentIndex ? 'text-foreground' : 'text-muted-foreground',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
                style={{ width: `${100 / ranges.length}%` }}
              >
                {/* Tick mark */}
                <div
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    index === currentIndex
                      ? 'bg-primary'
                      : index < currentIndex
                        ? 'bg-primary/50'
                        : 'bg-muted',
                  )}
                />
                {/* Label */}
                <span className="text-xs font-medium">{range.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Direction indicator */}
      {currentRange && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {currentRange.direction === 'past' && (
            <>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
              <span>← Looking back</span>
            </>
          )}
          {currentRange.direction === 'future' && (
            <>
              <span>Looking ahead →</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent" />
            </>
          )}
          {currentRange.direction === 'both' && (
            <>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
              <span>← Centered on today →</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
