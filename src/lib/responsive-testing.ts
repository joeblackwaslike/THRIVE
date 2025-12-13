/**
 * Responsive Design Testing Utilities
 * Test and validate responsive behavior
 */

import { createThrottledFn } from './pacer';

export interface Breakpoint {
  name: string;
  width: number;
  height?: number;
}

/**
 * Common device breakpoints for testing
 */
export const BREAKPOINTS: Record<string, Breakpoint> = {
  // Mobile
  'iphone-se': { name: 'iPhone SE', width: 375, height: 667 },
  'iphone-12': { name: 'iPhone 12', width: 390, height: 844 },
  'iphone-14-pro': { name: 'iPhone 14 Pro', width: 393, height: 852 },
  'samsung-s21': { name: 'Samsung S21', width: 360, height: 800 },
  'pixel-5': { name: 'Google Pixel 5', width: 393, height: 851 },

  // Tablet
  'ipad-mini': { name: 'iPad Mini', width: 744, height: 1133 },
  'ipad-air': { name: 'iPad Air', width: 820, height: 1180 },
  'ipad-pro-11': { name: 'iPad Pro 11"', width: 834, height: 1194 },
  'ipad-pro-13': { name: 'iPad Pro 13"', width: 1024, height: 1366 },

  // Desktop
  laptop: { name: 'Laptop', width: 1366, height: 768 },
  desktop: { name: 'Desktop', width: 1920, height: 1080 },
  'desktop-large': { name: 'Large Desktop', width: 2560, height: 1440 },
  '4k': { name: '4K Monitor', width: 3840, height: 2160 },

  // Custom
  'mobile-small': { name: 'Small Mobile', width: 320, height: 568 },
  'tablet-landscape': { name: 'Tablet Landscape', width: 1024, height: 768 },
};

/**
 * Tailwind CSS breakpoints
 */
export const TAILWIND_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Get current active breakpoint
 */
export function getCurrentBreakpoint(): keyof typeof TAILWIND_BREAKPOINTS | 'xs' {
  const width = window.innerWidth;

  if (width >= TAILWIND_BREAKPOINTS['2xl']) return '2xl';
  if (width >= TAILWIND_BREAKPOINTS.xl) return 'xl';
  if (width >= TAILWIND_BREAKPOINTS.lg) return 'lg';
  if (width >= TAILWIND_BREAKPOINTS.md) return 'md';
  if (width >= TAILWIND_BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Check if viewport matches a specific breakpoint
 */
export function matchesBreakpoint(breakpoint: keyof typeof TAILWIND_BREAKPOINTS): boolean {
  return window.innerWidth >= TAILWIND_BREAKPOINTS[breakpoint];
}

/**
 * Test if element is visible in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Test if element is partially visible in viewport
 */
export function isPartiallyInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const vertInView = rect.top <= windowHeight && rect.top + rect.height >= 0;
  const horInView = rect.left <= windowWidth && rect.left + rect.width >= 0;

  return vertInView && horInView;
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions(): { width: number; height: number } {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
}

/**
 * Check if viewport is in landscape mode
 */
export function isLandscape(): boolean {
  const { width, height } = getViewportDimensions();
  return width > height;
}

/**
 * Check if viewport is in portrait mode
 */
export function isPortrait(): boolean {
  return !isLandscape();
}

/**
 * Get scroll position
 */
export function getScrollPosition(): { x: number; y: number } {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };
}

/**
 * Check if page is scrolled
 */
export function isScrolled(threshold: number = 0): boolean {
  const { y } = getScrollPosition();
  return y > threshold;
}

/**
 * Create a responsive test suite
 */
export class ResponsiveTest {
  private results: Map<string, boolean> = new Map();
  private deviceName: string;

  constructor(deviceName: string) {
    this.deviceName = deviceName;
  }

  testElement(name: string, selector: string, condition: (el: HTMLElement) => boolean): void {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      console.warn(`Element not found: ${selector}`);
      this.results.set(name, false);
      return;
    }

    const passed = condition(element);
    this.results.set(name, passed);
  }

  testVisibility(name: string, selector: string): void {
    this.testElement(name, selector, (el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  testTouchTarget(name: string, selector: string, minSize: number = 44): void {
    this.testElement(name, selector, (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width >= minSize && rect.height >= minSize;
    });
  }

  testOverflow(name: string, selector: string): void {
    this.testElement(name, selector, (el) => {
      return el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight;
    });
  }

  testContrast(name: string, selector: string): void {
    this.testElement(name, selector, (el) => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      // Simplified check - full contrast calculation would be more complex
      return color !== backgroundColor;
    });
  }

  getResults(): Map<string, boolean> {
    return this.results;
  }

  printResults(): void {
    console.group(`📱 Responsive Test Results: ${this.deviceName}`);

    const passed = Array.from(this.results.entries()).filter(([, result]) => result);
    const failed = Array.from(this.results.entries()).filter(([, result]) => !result);

    console.log(`✅ Passed: ${passed.length}/${this.results.size}`);
    console.log(`❌ Failed: ${failed.length}/${this.results.size}`);

    if (failed.length > 0) {
      console.group('Failed Tests:');
      failed.forEach(([name]) => {
        console.log(`- ${name}`);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }
}

/**
 * Simulate viewport resize (for testing)
 */
export function simulateResize(width: number, height: number): void {
  // Note: This won't actually resize the browser window
  // It's mainly for triggering resize event listeners in tests
  window.dispatchEvent(new Event('resize'));
  console.log(`Simulated resize to ${width}x${height}`);
}

/**
 * Get element dimensions
 */
export function getElementDimensions(element: HTMLElement): {
  width: number;
  height: number;
  offsetWidth: number;
  offsetHeight: number;
  scrollWidth: number;
  scrollHeight: number;
} {
  return {
    width: element.clientWidth,
    height: element.clientHeight,
    offsetWidth: element.offsetWidth,
    offsetHeight: element.offsetHeight,
    scrollWidth: element.scrollWidth,
    scrollHeight: element.scrollHeight,
  };
}

/**
 * Check if element has horizontal overflow
 */
export function hasHorizontalOverflow(element: HTMLElement): boolean {
  return element.scrollWidth > element.clientWidth;
}

/**
 * Check if element has vertical overflow
 */
export function hasVerticalOverflow(element: HTMLElement): boolean {
  return element.scrollHeight > element.clientHeight;
}

/**
 * Get computed style value
 */
export function getComputedStyleValue(element: HTMLElement, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Create a responsive breakpoint observer
 */
export function observeBreakpoints(
  callback: (breakpoint: keyof typeof TAILWIND_BREAKPOINTS | 'xs') => void,
): () => void {
  let currentBreakpoint = getCurrentBreakpoint();

  const handleResize = () => {
    const newBreakpoint = getCurrentBreakpoint();
    if (newBreakpoint !== currentBreakpoint) {
      currentBreakpoint = newBreakpoint;
      callback(newBreakpoint);
    }
  };

  // Throttle resize events to 150ms for better performance
  const throttledResize = createThrottledFn(handleResize, 150);

  window.addEventListener('resize', throttledResize);

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', throttledResize);
  };
}

/**
 * Log responsive state to console (for debugging)
 */
export function logResponsiveState(): void {
  const breakpoint = getCurrentBreakpoint();
  const { width, height } = getViewportDimensions();
  const orientation = isLandscape() ? 'Landscape' : 'Portrait';
  const scrolled = isScrolled(100) ? 'Yes' : 'No';

  console.group('📐 Responsive State');
  console.log('Viewport:', `${width}x${height}`);
  console.log('Breakpoint:', breakpoint);
  console.log('Orientation:', orientation);
  console.log('Scrolled:', scrolled);
  console.groupEnd();
}
