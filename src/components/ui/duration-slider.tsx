import { cn } from '@/lib/utils';
import { RangeSlider } from './range-slider';

type DurationUnit = 'seconds' | 'minutes' | 'hours';

interface DurationPreset {
  label: string;
  value: number;
}

interface DurationSliderProps {
  value: number; // Always in the base unit
  onChange: (value: number) => void;
  unit?: DurationUnit;
  min?: number;
  max?: number;
  step?: number;
  presets?: DurationPreset[];
  className?: string;
  disabled?: boolean;
  showPresets?: boolean;
}

/**
 * Duration Slider Component
 *
 * Interactive slider for selecting time durations with visual feedback.
 * Supports seconds, minutes, and hours with smart formatting.
 *
 * @example
 * ```tsx
 * // For practice sessions (seconds)
 * <DurationSlider
 *   value={duration}
 *   onChange={setDuration}
 *   unit="seconds"
 *   min={60}
 *   max={3600}
 *   presets={[
 *     { label: '5 min', value: 300 },
 *     { label: '15 min', value: 900 },
 *     { label: '30 min', value: 1800 },
 *   ]}
 * />
 *
 * // For time limits (minutes)
 * <DurationSlider
 *   value={timeLimit}
 *   onChange={setTimeLimit}
 *   unit="minutes"
 *   min={15}
 *   max={240}
 * />
 * ```
 */
export function DurationSlider({
  value,
  onChange,
  unit = 'minutes',
  min = 0,
  max = 120,
  step = 1,
  presets = [],
  className,
  disabled = false,
  showPresets = true,
}: DurationSliderProps) {
  // Format duration based on unit
  const formatDuration = (val: number): string => {
    if (val === 0) return '0';

    switch (unit) {
      case 'seconds': {
        if (val < 60) return `${val}s`;
        if (val < 3600) {
          const mins = Math.floor(val / 60);
          const secs = val % 60;
          return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
        }
        const hours = Math.floor(val / 3600);
        const remainingMins = Math.floor((val % 3600) / 60);
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
      }

      case 'minutes': {
        if (val < 60) return `${val} min`;
        const hrs = Math.floor(val / 60);
        const mins = val % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
      }

      case 'hours':
        return val === 1 ? '1 hour' : `${val} hours`;

      default:
        return `${val}`;
    }
  };

  // Get unit label
  const getUnitLabel = (): string => {
    switch (unit) {
      case 'seconds':
        return 'sec';
      case 'minutes':
        return 'min';
      case 'hours':
        return 'hrs';
      default:
        return '';
    }
  };

  const handlePresetClick = (presetValue: number) => {
    if (!disabled && presetValue !== value) {
      onChange(presetValue);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current duration display */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Duration</span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold">{formatDuration(value)}</span>
          <span className="text-xs text-muted-foreground">{getUnitLabel()}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="px-2">
        <RangeSlider
          min={min}
          max={max}
          step={step}
          values={[value]}
          onChange={(values) => onChange(values[0])}
          disabled={disabled}
          formatValue={formatDuration}
        />
      </div>

      {/* Quick presets */}
      {showPresets && presets.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Quick Select</div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetClick(preset.value)}
                disabled={disabled}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  'border border-input hover:bg-accent hover:text-accent-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  value === preset.value && 'bg-primary text-primary-foreground border-primary',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress indicator for longer durations */}
      {unit === 'seconds' &&
        max >= 1800 && ( // Show for 30+ minutes
          <div className="space-y-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  value < max * 0.33
                    ? 'bg-green-500'
                    : value < max * 0.66
                      ? 'bg-yellow-500'
                      : 'bg-orange-500',
                )}
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Quick</span>
              <span>Standard</span>
              <span>Extended</span>
            </div>
          </div>
        )}
    </div>
  );
}

// Preset collections for common use cases
export const PRACTICE_SESSION_PRESETS: DurationPreset[] = [
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '15 min', value: 900 },
  { label: '30 min', value: 1800 },
  { label: '45 min', value: 2700 },
  { label: '1 hour', value: 3600 },
];

export const TIME_LIMIT_PRESETS: DurationPreset[] = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
];

export const INTERVIEW_DURATION_PRESETS: DurationPreset[] = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];
