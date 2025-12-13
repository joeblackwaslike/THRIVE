import { cn } from '@/lib/utils';
import { RangeSlider } from './range-slider';

interface TimePeriod {
  label: string;
  shortLabel: string;
  value: string;
  days?: number;
}

interface TimePeriodSliderProps {
  periods: TimePeriod[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  showLabels?: boolean;
}

export function TimePeriodSlider({
  periods,
  selectedValue,
  onChange,
  className,
  disabled = false,
  showLabels = true,
}: TimePeriodSliderProps) {
  // Find the index of the selected period
  const selectedIndex = periods.findIndex((p) => p.value === selectedValue);
  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const handleChange = (values: number[]) => {
    const newIndex = Math.round(values[0]);
    if (newIndex >= 0 && newIndex < periods.length) {
      onChange(periods[newIndex].value);
    }
  };

  const selectedPeriod = periods[currentIndex];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Current selection display */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Time Period</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{selectedPeriod.label}</span>
          {selectedPeriod.days && (
            <span className="text-xs text-muted-foreground">({selectedPeriod.days} days)</span>
          )}
        </div>
      </div>

      {/* Slider */}
      <RangeSlider
        min={0}
        max={periods.length - 1}
        step={1}
        values={[currentIndex]}
        onChange={handleChange}
        formatValue={(index) => periods[index]?.shortLabel || ''}
        disabled={disabled}
        className={className}
      />

      {/* Period labels */}
      {showLabels && (
        <div className="flex justify-between px-1">
          {periods.map((period, index) => (
            <button
              key={period.value}
              type="button"
              onClick={() => !disabled && onChange(period.value)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-0.5 text-xs transition-colors',
                'hover:text-foreground',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                currentIndex === index ? 'text-primary font-medium' : 'text-muted-foreground',
              )}
              title={period.label}
            >
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors',
                  currentIndex === index ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              />
              <span>{period.shortLabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
