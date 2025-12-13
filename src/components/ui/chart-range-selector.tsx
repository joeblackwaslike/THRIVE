import { useRanger } from '@tanstack/react-ranger';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ChartRangeConfig {
  min: number;
  max: number;
  step?: number;
  formatLabel?: (value: number) => string;
  onChange: (range: { start: number; end: number }) => void;
  initialRange?: { start: number; end: number };
}

interface ChartRangeSelectorProps extends ChartRangeConfig {
  className?: string;
  showLabels?: boolean;
  height?: number;
}

/**
 * ChartRangeSelector - Mini range selector for zooming/filtering chart data
 *
 * Features:
 * - Dual handles for selecting data range
 * - Visual representation of selected vs total data
 * - Compact design for placement below charts
 * - Auto-formats numeric labels or accepts custom formatter
 * - Smooth drag interactions
 *
 * @example
 * ```tsx
 * <ChartRangeSelector
 *   min={0}
 *   max={dataPoints.length - 1}
 *   formatLabel={(idx) => dataPoints[idx].date}
 *   onChange={({ start, end }) => setVisibleRange([start, end])}
 * />
 * ```
 */
export function ChartRangeSelector({
  min,
  max,
  step = 1,
  formatLabel = (value) => value.toString(),
  onChange,
  initialRange,
  className,
  showLabels = true,
  height = 40,
}: ChartRangeSelectorProps) {
  const [values, setValues] = useState<number[]>(
    initialRange ? [initialRange.start, initialRange.end] : [min, max],
  );

  const rangerRef = useRef<HTMLDivElement>(null);

  const rangerInstance = useRanger<HTMLDivElement>({
    getRangerElement: () => rangerRef.current,
    values,
    min,
    max,
    stepSize: step,
    onChange: (instance) => setValues([...instance.sortedValues]),
  });

  // Notify parent of range changes
  useEffect(() => {
    if (values[0] !== undefined && values[1] !== undefined) {
      onChange({ start: values[0], end: values[1] });
    }
  }, [values, onChange]);

  const selectedPercentage = ((values[1] - values[0]) / (max - min)) * 100;

  return (
    <div className={cn('w-full space-y-2', className)}>
      {/* Range Selector */}
      <div
        ref={rangerRef}
        className="relative w-full touch-none select-none"
        style={{ height: `${height}px` }}
      >
        {/* Background Track */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 w-full rounded-full bg-muted"
          style={{
            left: 0,
            right: 0,
          }}
        />

        {/* Selected Range */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-primary transition-all"
          style={{
            left: `${rangerInstance.getPercentageForValue(values[0])}%`,
            width: `${rangerInstance.getPercentageForValue(values[1]) - rangerInstance.getPercentageForValue(values[0])}%`,
          }}
        />

        {/* Handles */}
        {rangerInstance.handles().map((handle, index) => (
          <div
            key={index}
            onKeyDown={handle.onKeyDownHandler}
            onMouseDown={handle.onMouseDownHandler}
            onTouchStart={handle.onTouchStart}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary border-2 border-background shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            style={{
              left: `${rangerInstance.getPercentageForValue(handle.value)}%`,
              zIndex: handle.isActive ? 3 : 2,
            }}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={handle.value}
            aria-label={`Range ${index === 0 ? 'start' : 'end'}`}
            tabIndex={0}
          />
        ))}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{formatLabel(values[0])}</span>
            <span>→</span>
            <span className="font-medium text-foreground">{formatLabel(values[1])}</span>
          </div>
          <div className="text-right">
            <span className="font-medium text-primary">{selectedPercentage.toFixed(0)}%</span>
            <span className="ml-1">selected</span>
          </div>
        </div>
      )}

      {/* Mini Data Visualization (optional visual aid) */}
      <div className="flex items-center gap-0.5 h-1">
        {Array.from({ length: Math.min(50, max - min + 1) }).map((_, i) => {
          const dataIndex = Math.floor((i / 50) * (max - min)) + min;
          const isInRange = dataIndex >= values[0] && dataIndex <= values[1];
          return (
            <div
              key={i}
              className={cn(
                'flex-1 h-full rounded-sm transition-colors',
                isInRange ? 'bg-primary/60' : 'bg-muted/50',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Preset range buttons for common selections
 */
interface RangePresetsProps {
  onSelectRange: (range: { start: number; end: number }) => void;
  min: number;
  max: number;
  presets?: Array<{
    label: string;
    getRange: (min: number, max: number) => { start: number; end: number };
  }>;
}

export function RangePresets({ onSelectRange, min, max, presets }: RangePresetsProps) {
  const defaultPresets = [
    {
      label: 'All',
      getRange: (min: number, max: number) => ({ start: min, end: max }),
    },
    {
      label: 'Last 50%',
      getRange: (min: number, max: number) => ({
        start: Math.floor(min + (max - min) / 2),
        end: max,
      }),
    },
    {
      label: 'Last 25%',
      getRange: (min: number, max: number) => ({
        start: Math.floor(min + ((max - min) * 3) / 4),
        end: max,
      }),
    },
    {
      label: 'First 25%',
      getRange: (min: number, max: number) => ({
        start: min,
        end: Math.floor(min + (max - min) / 4),
      }),
    },
  ];

  const rangePresets = presets || defaultPresets;

  return (
    <div className="flex gap-1 flex-wrap">
      {rangePresets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => onSelectRange(preset.getRange(min, max))}
          className="px-2 py-1 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
