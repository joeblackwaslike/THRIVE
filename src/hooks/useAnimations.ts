import { useEffect, useRef, useState } from 'react';

/**
 * Hook to animate number transitions
 * @param value - Target value to animate to
 * @param duration - Animation duration in milliseconds
 * @returns Current animated value
 */
export function useAnimatedNumber(value: number, duration: number = 800): number {
  const [displayValue, setDisplayValue] = useState(value);
  const rafRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);
  const startValueRef = useRef(value);

  useEffect(() => {
    // If value hasn't changed, don't animate
    if (value === displayValue) return;

    startValueRef.current = displayValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - (1 - progress) ** 3;

      const current = startValueRef.current + (value - startValueRef.current) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration, displayValue]);

  return displayValue;
}

/**
 * Hook to detect changes in data and provide change indicators
 * @param value - Current value
 * @param debounceMs - Milliseconds to wait before clearing change indicator
 * @returns Object with current value and change indicator
 */
export function useChangeIndicator<T>(
  value: T,
  debounceMs: number = 2000,
): { value: T; hasChanged: boolean; isIncreasing: boolean | null } {
  const [hasChanged, setHasChanged] = useState(false);
  const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null);
  const previousValueRef = useRef<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const prevValue = previousValueRef.current;

    // Detect if value changed
    if (prevValue !== value) {
      setHasChanged(true);

      // Determine direction for numbers
      if (typeof value === 'number' && typeof prevValue === 'number') {
        setIsIncreasing(value > prevValue);
      }

      // Clear the change indicator after debounce period
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setHasChanged(false);
        setIsIncreasing(null);
      }, debounceMs);

      previousValueRef.current = value;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, debounceMs]);

  return { value, hasChanged, isIncreasing };
}

/**
 * Hook to create pulsing animation effect
 * @param trigger - Trigger to start pulse animation
 * @param duration - Duration of pulse in milliseconds
 * @returns Boolean indicating if should pulse
 */
export function usePulse(trigger: unknown, duration: number = 1000): boolean {
  const [isPulsing, setIsPulsing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const triggerRef = useRef(trigger);

  useEffect(() => {
    // Only trigger if the trigger value actually changed
    if (triggerRef.current === trigger) return;

    triggerRef.current = trigger;
    setIsPulsing(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsPulsing(false);
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [trigger, duration]);

  return isPulsing;
}

/**
 * Hook to track data freshness
 * @returns Timestamp of last update and function to mark as updated
 */
export function useDataFreshness(): { lastUpdated: number; markUpdated: () => void } {
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const markUpdated = () => {
    setLastUpdated(Date.now());
  };

  return { lastUpdated, markUpdated };
}
