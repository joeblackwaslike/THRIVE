/**
 * Accessibility Utilities
 * Helper functions and hooks for improving accessibility
 */

/**
 * Get ARIA label for status badges
 */
export function getStatusAriaLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    target: 'Status: Target - Identified for application',
    applied: 'Status: Applied - Application submitted',
    screening: 'Status: Screening - Initial review',
    interview: 'Status: Interview - In interview process',
    assessment: 'Status: Assessment - Technical assessment phase',
    offer: 'Status: Offer - Offer received',
    accepted: 'Status: Accepted - Offer accepted',
    rejected: 'Status: Rejected - Application declined',
    withdrawn: 'Status: Withdrawn - Application withdrawn',
    archived: 'Status: Archived',
  };

  return statusLabels[status] || `Status: ${status}`;
}

/**
 * Get ARIA label for priority badges
 */
export function getPriorityAriaLabel(priority: string): string {
  const priorityLabels: Record<string, string> = {
    low: 'Priority: Low',
    medium: 'Priority: Medium',
    high: 'Priority: High - Requires attention',
  };

  return priorityLabels[priority] || `Priority: ${priority}`;
}

/**
 * Format date for screen readers
 */
export function formatDateForScreenReader(date: Date | string | null | undefined): string {
  if (!date) return 'No date set';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Create descriptive label for action buttons
 */
export function createActionLabel(action: string, item: string, identifier?: string): string {
  const actionLabels: Record<string, string> = {
    edit: 'Edit',
    delete: 'Delete',
    view: 'View details for',
    archive: 'Archive',
    restore: 'Restore',
    duplicate: 'Duplicate',
  };

  const actionText = actionLabels[action] || action;
  return identifier ? `${actionText} ${item}: ${identifier}` : `${actionText} ${item}`;
}

/**
 * Check if element is visible (for focus management)
 */
export function isElementVisible(element: HTMLElement): boolean {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetParent !== null
  );
}

/**
 * Get readable text content from an element (strips HTML)
 */
export function getTextContent(element: HTMLElement): string {
  return element.textContent?.trim() || '';
}

/**
 * Create ARIA described by text for complex components
 */
export function createDescribedBy(
  description: string,
  id: string,
): { 'aria-describedby': string; description: string; id: string } {
  return {
    'aria-describedby': id,
    description,
    id,
  };
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get appropriate transition duration based on user preferences
 */
export function getTransitionDuration(defaultMs: number = 200): number {
  return prefersReducedMotion() ? 0 : defaultMs;
}

/**
 * Announce to screen readers (uses global announcer)
 */
export function announceToScreenReader(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite',
): void {
  const region = document.getElementById('global-announcer');
  if (region) {
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
      region.setAttribute('aria-live', politeness);
    }, 100);
  }
}

/**
 * Create accessible form field props
 */
export function createFormFieldProps(
  id: string,
  label: string,
  required: boolean = false,
  error?: string,
): {
  id: string;
  'aria-label': string;
  'aria-required': boolean;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
} {
  const props = {
    id,
    'aria-label': label,
    'aria-required': required,
    'aria-invalid': !!error,
  };

  if (error) {
    return {
      ...props,
      'aria-describedby': `${id}-error`,
    };
  }

  return props;
}

/**
 * Get current focus element
 */
export function getCurrentFocus(): HTMLElement | null {
  return document.activeElement as HTMLElement | null;
}

/**
 * Move focus to element safely
 */
export function moveFocusTo(element: HTMLElement | null, preventScroll: boolean = false): void {
  if (element && isElementVisible(element)) {
    element.focus({ preventScroll });
  }
}

/**
 * ARIA live region manager
 */
class LiveRegionManager {
  private regions: Map<string, HTMLElement> = new Map();

  createRegion(id: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    if (this.regions.has(id)) return;

    const region = document.createElement('div');
    region.id = id;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);

    this.regions.set(id, region);
  }

  announce(id: string, message: string): void {
    const region = this.regions.get(id);
    if (region) {
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }

  removeRegion(id: string): void {
    const region = this.regions.get(id);
    if (region) {
      document.body.removeChild(region);
      this.regions.delete(id);
    }
  }
}

export const liveRegionManager = new LiveRegionManager();
