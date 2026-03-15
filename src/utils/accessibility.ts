/**
 * Accessibility Utilities
 * 
 * Helper functions for accessibility features and testing.
 * 
 * @module accessibility
 */

/**
 * Generate unique ID for accessibility attributes
 */
export function generateId(prefix = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Announce message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Trap focus within an element
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };
  
  element.addEventListener('keydown', handleKeyDown);
  
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Check color contrast ratio
 * Returns WCAG compliance level
 */
export function checkContrast(
  foreground: string,
  background: string
): { ratio: number; aa: boolean; aaa: boolean } {
  // Calculate relative luminance
  const getLuminance = (color: string): number => {
    const rgb = parseColor(color);
    if (!rgb) return 1;
    
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  const ratio = (lighter + 0.05) / (darker + 0.05);
  
  return {
    ratio,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
  };
}

/**
 * Parse color string to RGB array
 */
function parseColor(color: string): [number, number, number] | null {
  // Hex
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }
  
  // RGB/RGBA
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3]),
    ];
  }
  
  return null;
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string;
  modifiers?: Array<'ctrl' | 'alt' | 'shift' | 'meta'>;
  description: string;
  action: () => void;
}

/**
 * Parse keyboard shortcut from string (e.g., "ctrl+k")
 */
export function parseShortcut(shortcut: string): { key: string; modifiers: string[] } {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts.pop() ?? '';
  const modifiers = parts;
  
  return { key, modifiers };
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: string): string {
  const { key, modifiers } = parseShortcut(shortcut);
  const modifierSymbols: Record<string, string> = {
    ctrl: '⌃',
    alt: '⌥',
    shift: '⇧',
    meta: '⌘',
  };
  
  const modifierStr = modifiers.map(m => modifierSymbols[m] || m).join('');
  return modifierStr + key.toUpperCase();
}

/**
 * Test if element is visible to assistive technologies
 */
export function isAccessible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  
  // Check if hidden
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  
  // Check ARIA hidden
  if (element.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  
  return true;
}

/**
 * Accessibility test results
 */
export interface A11yTestResult {
  passed: boolean;
  violations: Array<{
    rule: string;
    element: string;
    message: string;
    severity: 'critical' | 'serious' | 'moderate' | 'minor';
  }>;
}

/**
 * Run basic accessibility tests on element
 */
export function runA11yTests(element: HTMLElement): A11yTestResult {
  const violations: A11yTestResult['violations'] = [];
  
  // Check images for alt text
  const images = element.querySelectorAll('img:not([alt])');
  images.forEach(img => {
    violations.push({
      rule: 'image-alt',
      element: img.tagName.toLowerCase(),
      message: 'Image missing alt text',
      severity: 'critical',
    });
  });
  
  // Check form inputs for labels
  const inputs = element.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
  inputs.forEach(input => {
    const id = input.id;
    const hasLabel = id !== '' && element.querySelector(`label[for="${id}"]`) != null;
    if (!hasLabel) {
      violations.push({
        rule: 'label',
        element: input.tagName.toLowerCase(),
        message: 'Form input missing label',
        severity: 'critical',
      });
    }
  });
  
  // Check buttons for accessible names
  const buttons = element.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
  buttons.forEach(btn => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- textContent may be null for some element types
    if ((btn.textContent?.trim() ?? '') === '' && btn.getAttribute('aria-label') == null) {
      violations.push({
        rule: 'button-name',
        element: 'button',
        message: 'Button missing accessible name',
        severity: 'serious',
      });
    }
  });
  
  // Check links for discernible text
  const links = element.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
  links.forEach(link => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- textContent may be null for some element types
    if ((link.textContent?.trim() ?? '') === '' && link.querySelector('img[alt]') == null) {
      violations.push({
        rule: 'link-name',
        element: 'a',
        message: 'Link missing discernible text',
        severity: 'serious',
      });
    }
  });
  
  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * High contrast preference
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Dark mode preference
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
