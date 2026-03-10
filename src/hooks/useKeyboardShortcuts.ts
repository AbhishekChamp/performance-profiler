import { useEffect, useCallback, useRef } from 'react';
import type { KeyboardShortcut } from '@/types';

// Shortcut categories for organization
export type ShortcutCategory = 'navigation' | 'analysis' | 'view' | 'export' | 'general';

export interface EnhancedKeyboardShortcut extends KeyboardShortcut {
  category: ShortcutCategory;
  hidden?: boolean; // Don't show in help (for number keys)
}

export const KEYBOARD_SHORTCUTS: EnhancedKeyboardShortcut[] = [
  // Navigation
  {
    key: 'ArrowUp',
    action: 'navigateUp',
    description: 'Navigate to previous section',
    category: 'navigation',
  },
  {
    key: 'ArrowDown',
    action: 'navigateDown',
    description: 'Navigate to next section',
    category: 'navigation',
  },
  {
    key: 'j',
    action: 'navigateDown',
    description: 'Next section',
    category: 'navigation',
  },
  {
    key: 'k',
    action: 'navigateUp',
    description: 'Previous section',
    category: 'navigation',
  },
  {
    key: 'n',
    action: 'nextSection',
    description: 'Next section (alias)',
    category: 'navigation',
  },
  {
    key: 'p',
    action: 'previousSection',
    description: 'Previous section (alias)',
    category: 'navigation',
  },
  {
    key: 'Enter',
    action: 'selectSection',
    description: 'Select/activate current item',
    category: 'navigation',
  },
  {
    key: 'b',
    ctrl: true,
    action: 'toggleSidebar',
    description: 'Toggle sidebar',
    category: 'navigation',
  },
  
  // Section shortcuts (1-9, 0)
  ...Array.from({ length: 10 }, (_, i) => ({
    key: i === 9 ? '0' : String(i + 1),
    action: `goToSection-${i}` as const,
    description: `Go to section ${i + 1}`,
    category: 'navigation' as const,
    hidden: true,
  })),
  
  // Analysis
  {
    key: 'r',
    action: 'rerunAnalysis',
    description: 'Re-run analysis',
    category: 'analysis',
  },
  {
    key: 'n',
    ctrl: true,
    action: 'newAnalysis',
    description: 'New analysis',
    category: 'analysis',
  },
  {
    key: 'u',
    ctrl: true,
    action: 'focusUpload',
    description: 'Focus file upload',
    category: 'analysis',
  },
  
  // Export
  {
    key: 'e',
    ctrl: true,
    action: 'exportReport',
    description: 'Export report',
    category: 'export',
  },
  
  // View
  {
    key: 'f',
    ctrl: true,
    action: 'search',
    description: 'Search in report',
    category: 'view',
  },
  {
    key: 'l',
    ctrl: true,
    shift: true,
    action: 'cycleTheme',
    description: 'Cycle theme (Dark → Light → System)',
    category: 'view',
  },
  {
    key: 'k',
    ctrl: true,
    action: 'commandPalette',
    description: 'Open command palette',
    category: 'view',
  },
  
  // General
  {
    key: '?',
    shift: true,
    action: 'showHelp',
    description: 'Show keyboard shortcuts',
    category: 'general',
  },
  {
    key: 'Escape',
    action: 'closeModal',
    description: 'Close modal/dialog',
    category: 'general',
  },
  {
    key: 'h',
    action: 'showHelp',
    description: 'Show help (alias)',
    category: 'general',
  },
];

// Group shortcuts by category for display
export const SHORTCUT_CATEGORIES: Record<ShortcutCategory, { label: string; order: number }> = {
  navigation: { label: 'Navigation', order: 0 },
  analysis: { label: 'Analysis', order: 1 },
  view: { label: 'View', order: 2 },
  export: { label: 'Export', order: 3 },
  general: { label: 'General', order: 4 },
};

interface UseKeyboardShortcutsOptions {
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onNextSection?: () => void;
  onPreviousSection?: () => void;
  onSelect?: () => void;
  onRerun?: () => void;
  onNewAnalysis?: () => void;
  onExport?: () => void;
  onCycleTheme?: () => void;
  onShowHelp?: () => void;
  onClose?: () => void;
  onSearch?: () => void;
  onCommandPalette?: () => void;
  onToggleSidebar?: () => void;
  onFocusUpload?: () => void;
  onGoToSection?: (index: number) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const {
    onNavigateUp,
    onNavigateDown,
    onNextSection,
    onPreviousSection,
    onSelect,
    onRerun,
    onNewAnalysis,
    onExport,
    onCycleTheme,
    onShowHelp,
    onClose,
    onSearch,
    onCommandPalette,
    onToggleSidebar,
    onFocusUpload,
    onGoToSection,
    enabled = true,
  } = options;

  // Use refs to always have latest callbacks without re-registering
  const callbacksRef = useRef(options);
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isInputField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;

      if (isInputField) {
        // Allow Escape and some shortcuts even when in input
        if (event.key !== 'Escape') return;
      }

      // Check for number keys 1-9, 0 for section navigation
      const sectionMatch = event.key.match(/^[0-9]$/);
      if (sectionMatch && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        const sectionIndex = event.key === '0' ? 9 : parseInt(event.key, 10) - 1;
        callbacksRef.current.onGoToSection?.(sectionIndex);
        return;
      }

      const shortcut = KEYBOARD_SHORTCUTS.find((s) => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = !!s.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = !!s.shift === event.shiftKey;
        const altMatch = !!s.alt === event.altKey;
        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (!shortcut) return;

      event.preventDefault();

      switch (shortcut.action) {
        case 'navigateUp':
          callbacksRef.current.onNavigateUp?.();
          break;
        case 'navigateDown':
          callbacksRef.current.onNavigateDown?.();
          break;
        case 'nextSection':
          callbacksRef.current.onNextSection?.();
          break;
        case 'previousSection':
          callbacksRef.current.onPreviousSection?.();
          break;
        case 'selectSection':
          callbacksRef.current.onSelect?.();
          break;
        case 'rerunAnalysis':
          callbacksRef.current.onRerun?.();
          break;
        case 'newAnalysis':
          callbacksRef.current.onNewAnalysis?.();
          break;
        case 'exportReport':
          callbacksRef.current.onExport?.();
          break;
        case 'cycleTheme':
          callbacksRef.current.onCycleTheme?.();
          break;
        case 'showHelp':
          callbacksRef.current.onShowHelp?.();
          break;
        case 'closeModal':
          callbacksRef.current.onClose?.();
          break;
        case 'search':
          callbacksRef.current.onSearch?.();
          break;
        case 'commandPalette':
          callbacksRef.current.onCommandPalette?.();
          break;
        case 'toggleSidebar':
          callbacksRef.current.onToggleSidebar?.();
          break;
        case 'focusUpload':
          callbacksRef.current.onFocusUpload?.();
          break;
      }
    },
    [enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.meta) parts.push('⌘');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  
  // Format special keys
  const keyDisplay: Record<string, string> = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '↵',
    'Escape': 'Esc',
  };
  
  parts.push(keyDisplay[shortcut.key] || shortcut.key.toUpperCase());
  return parts.join(' + ');
}

// Hook for focus management
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element when trap is activated
    firstElement?.focus();

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [isActive, containerRef]);
}

// Hook for managing focus on mount/unmount
export function useFocusRestore() {
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    lastFocusedElement.current?.focus();
  }, []);

  return { saveFocus, restoreFocus };
}
