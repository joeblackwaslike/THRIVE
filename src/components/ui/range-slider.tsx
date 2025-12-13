import { useRanger } from '@tanstack/react-ranger';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  values: number[];
  onChange: (values: number[]) => void;
  formatValue?: (value: number) => string;
  className?: string;
  disabled?: boolean;
}

export function RangeSlider({
  min,
  max,
  step,
  values,
  onChange,
  formatValue = (v) => v.toString(),
  className,
  disabled = false,
}: RangeSliderProps) {
  const rangerRef = useRef<HTMLDivElement>(null);

  const rangerInstance = useRanger({
    getRangerElement: () => rangerRef.current,
    min,
    max,
    stepSize: step,
    values,
    onChange: (instance) => onChange([...instance.sortedValues]),
  });

  return (
    <div className={cn('space-y-2', className)}>
      {/* Value display */}
      <div className="flex justify-between text-sm font-medium">
        {values.map((value, i) => (
          <span key={i} className="tabular-nums">
            {formatValue(value)}
          </span>
        ))}
      </div>

      {/* Slider track */}
      <div
        ref={rangerRef}
        className={cn(
          'relative h-2 rounded-full bg-secondary cursor-pointer touch-none',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        style={{ userSelect: 'none' }}
      >
        {/* Active range */}
        <div
          className="absolute h-full bg-primary rounded-full pointer-events-none"
          style={{
            left: `${rangerInstance.getPercentageForValue(values[0])}%`,
            right: `${100 - rangerInstance.getPercentageForValue(values[values.length - 1])}%`,
          }}
        />

        {/* Handles */}
        {rangerInstance.handles().map((handle, index) => {
          const percentage = rangerInstance.getPercentageForValue(handle.value);
          return (
            <div
              key={index}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              onKeyDown={handle.onKeyDownHandler}
              onMouseDown={handle.onMouseDownHandler}
              onTouchStart={handle.onTouchStart}
              aria-disabled={disabled}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
                'h-5 w-5 rounded-full border-2 border-primary bg-background',
                'shadow-md hover:shadow-lg transition-shadow',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'touch-manipulation cursor-grab active:cursor-grabbing',
                handle.isActive && 'shadow-lg scale-110',
              )}
              style={{
                left: `${percentage}%`,
              }}
              aria-label={`Slider handle ${index + 1}`}
              aria-valuenow={handle.value}
              aria-valuemin={min}
              aria-valuemax={max}
            />
          );
        })}
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
