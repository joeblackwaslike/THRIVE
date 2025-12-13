import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RangeSlider } from './range-slider';

interface RatingSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  showValue?: boolean;
}

const RATING_MIN = 0;
const RATING_MAX = 5;
const RATING_STEP = 0.5;

export function RatingSlider({
  value,
  onChange,
  label,
  className,
  disabled = false,
  showValue = true,
}: RatingSliderProps) {
  const handleChange = (values: number[]) => {
    onChange(values[0]);
  };

  const formatRating = (val: number) => {
    return val.toFixed(1);
  };

  // Calculate number of filled stars
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(<Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        // Half star
        stars.push(
          <div key={i} className="relative h-3.5 w-3.5">
            <Star className="absolute inset-0 h-3.5 w-3.5 text-yellow-400" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>,
        );
      } else {
        // Empty star
        stars.push(<Star key={i} className="h-3.5 w-3.5 text-yellow-400" />);
      }
    }

    return stars;
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and value display */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showValue && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums">{formatRating(value)}</span>
              <div className="flex items-center gap-0.5">{renderStars()}</div>
            </div>
          )}
        </div>
      )}

      {/* Slider */}
      <RangeSlider
        min={RATING_MIN}
        max={RATING_MAX}
        step={RATING_STEP}
        values={[value]}
        onChange={handleChange}
        formatValue={formatRating}
        disabled={disabled}
        className={className}
      />

      {/* Tick marks with star indicators */}
      <div className="flex justify-between px-1">
        {[0, 1, 2, 3, 4, 5].map((rating) => (
          <div key={rating} className="flex flex-col items-center gap-0.5">
            <Star
              className={cn(
                'h-2.5 w-2.5',
                value >= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30',
              )}
            />
            <span className="text-[10px] text-muted-foreground">{rating}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
