import { useThrottledCallback } from '@tanstack/react-pacer';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScrollIndicatorProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  threshold?: number;
}

type ScrollDirection = 'horizontal' | 'vertical' | null;

export function ScrollIndicator({ containerRef, threshold = 50 }: ScrollIndicatorProps) {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const defaultRef = useRef<HTMLDivElement>(null);
  const targetRef = containerRef || defaultRef;

  const checkScroll = useCallback(() => {
    const element = targetRef.current;
    if (!element) {
      setScrollDirection(null);
      return;
    }

    const { scrollWidth, clientWidth, scrollLeft, scrollHeight, clientHeight, scrollTop } = element;

    // Check horizontal scroll
    const hasHorizontalScroll = scrollWidth > clientWidth + 5; // 5px tolerance
    const isNearRightEnd = scrollWidth - (scrollLeft + clientWidth) < threshold;

    // Check vertical scroll
    const hasVerticalScroll = scrollHeight > clientHeight + 5; // 5px tolerance
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < threshold;

    // Prioritize showing vertical scroll indicator if both exist
    if (hasVerticalScroll && !isNearBottom) {
      setScrollDirection('vertical');
    } else if (hasHorizontalScroll && !isNearRightEnd) {
      setScrollDirection('horizontal');
    } else {
      setScrollDirection(null);
    }
  }, [targetRef, threshold]);

  // Throttle scroll checks to 150ms for smooth but performant updates
  const throttledCheckScroll = useThrottledCallback(checkScroll, { wait: 150 });

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    // Initial check
    checkScroll();

    // Add throttled scroll listener
    element.addEventListener('scroll', throttledCheckScroll);

    // Add resize observer to detect content changes
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener('scroll', throttledCheckScroll);
      resizeObserver.disconnect();
    };
  }, [targetRef, checkScroll, throttledCheckScroll]);

  if (!scrollDirection) return null;

  const isVertical = scrollDirection === 'vertical';

  return (
    <div
      className={cn(
        'pointer-events-none absolute z-10',
        isVertical ? 'bottom-4 left-1/2 -translate-x-1/2' : 'right-4 top-1/2 -translate-y-1/2',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center',
          'rounded-full bg-background/80 backdrop-blur-sm',
          'border border-border/50 shadow-lg',
          'w-10 h-10',
          isVertical ? 'animate-bounce' : 'animate-pulse',
          'opacity-60 hover:opacity-100 transition-opacity',
        )}
      >
        {isVertical ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
