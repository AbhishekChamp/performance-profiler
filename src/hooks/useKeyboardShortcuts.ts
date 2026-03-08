import { useEffect, useCallback } from 'react';
import type { KeyboardShortcut } from '@/types';

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrl: true,
    action: 'commandPalette',
    description: 'Open command palette',
  },
  {
    key: 'ArrowUp',
    action: 'navigateUp',
    description: 'Navigate to previous section',
  },
  {
    key: 'ArrowDown',
    action: 'navigateDown',
    description: 'Navigate to next section',
  },
  {
    key: 'Enter',
    action: 'selectSection',
    description: 'Select current section',
  },
  {
    key: 'r',
    action: 'rerunAnalysis',
    description: 'Re-run analysis',
  },
  {
    key: 'e',
    action: 'exportReport',
    description: 'Export report',
  },
  {
    key: '?',
    shift: true,
    action: 'showHelp',
    description: 'Show keyboard shortcuts',
  },
  {
    key: 'Escape',
    action: 'closeModal',
    description: 'Close modal/dialog',
  },
  {
    key: 'p',
    ctrl: true,
    action: 'toggleTheme',
    description: 'Toggle theme',
  },
  {
    key: 'f',
    ctrl: true,
    action: 'search',
    description: 'Search in report',
  },
];

interface UseKeyboardShortcutsOptions {
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onSelect?: () => void;
  onRerun?: () => void;
  onExport?: () => void;
  onToggleTheme?: () => void;
  onShowHelp?: () => void;
  onClose?: () => void;
  onSearch?: () => void;
  onCommandPalette?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const {
    onNavigateUp,
    onNavigateDown,
    onSelect,
    onRerun,
    onExport,
    onToggleTheme,
    onShowHelp,
    onClose,
    onSearch,
    onCommandPalette,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        // Allow Escape to close even when in input
        if (event.key !== 'Escape') return;
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
          onNavigateUp?.();
          break;
        case 'navigateDown':
          onNavigateDown?.();
          break;
        case 'selectSection':
          onSelect?.();
          break;
        case 'rerunAnalysis':
          onRerun?.();
          break;
        case 'exportReport':
          onExport?.();
          break;
        case 'toggleTheme':
          onToggleTheme?.();
          break;
        case 'showHelp':
          onShowHelp?.();
          break;
        case 'closeModal':
          onClose?.();
          break;
        case 'search':
          onSearch?.();
          break;
        case 'commandPalette':
          onCommandPalette?.();
          break;
      }
    },
    [
      enabled,
      onNavigateUp,
      onNavigateDown,
      onSelect,
      onRerun,
      onExport,
      onToggleTheme,
      onShowHelp,
      onClose,
      onSearch,
      onCommandPalette,
    ]
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
  parts.push(shortcut.key);
  return parts.join(' + ');
}
