/**
 * Keyboard Navigation Utilities
 * Helper functions and constants for keyboard accessibility
 */

export const Keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

/**
 * Check if key is an action key (Enter or Space)
 */
export function isActionKey(event: React.KeyboardEvent): boolean {
  return event.key === Keys.ENTER || event.key === Keys.SPACE;
}

/**
 * Check if key is an arrow key
 */
export function isArrowKey(event: React.KeyboardEvent): boolean {
  const arrowKeys = [Keys.ARROW_UP, Keys.ARROW_DOWN, Keys.ARROW_LEFT, Keys.ARROW_RIGHT];
  return arrowKeys.includes(event.key as (typeof arrowKeys)[number]);
}

/**
 * Handle keyboard navigation for lists/menus
 */
export function handleListKeyDown(
  event: React.KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelect?: (index: number) => void,
): number {
  let newIndex = currentIndex;

  switch (event.key) {
    case Keys.ARROW_DOWN:
      event.preventDefault();
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      break;
    case Keys.ARROW_UP:
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      break;
    case Keys.HOME:
      event.preventDefault();
      newIndex = 0;
      break;
    case Keys.END:
      event.preventDefault();
      newIndex = items.length - 1;
      break;
    case Keys.ENTER:
    case Keys.SPACE:
      event.preventDefault();
      if (onSelect) {
        onSelect(currentIndex);
      }
      return currentIndex;
    default:
      return currentIndex;
  }

  // Focus the new item
  if (items[newIndex]) {
    items[newIndex].focus();
  }

  return newIndex;
}

/**
 * Make an element keyboard accessible
 * Adds role, tabindex, and keyboard handlers
 */
export function makeKeyboardAccessible(
  element: HTMLElement,
  onClick: () => void,
  role: string = 'button',
): void {
  element.setAttribute('role', role);
  element.setAttribute('tabindex', '0');

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === Keys.ENTER || event.key === Keys.SPACE) {
      event.preventDefault();
      onClick();
    }
  };

  element.addEventListener('keydown', handleKeyDown);
}

/**
 * Focus trap helper - get all focusable elements in a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex^="-"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selectors));
}

/**
 * Restore focus after an action
 */
export function restoreFocus(previousElement: HTMLElement | null): void {
  if (previousElement && document.contains(previousElement)) {
    previousElement.focus();
  }
}

/**
 * Create a unique ID for ARIA labels
 */
let idCounter = 0;
export function generateId(prefix: string = 'a11y'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Debounce keyboard events to prevent rapid firing
 */
export function debounceKeyboard<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number = 300,
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
