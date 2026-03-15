import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockHandlers = {
    onNextSection: vi.fn(),
    onPreviousSection: vi.fn(),
    onGoToSection: vi.fn(),
    onCycleTheme: vi.fn(),
    onExport: vi.fn(),
    onNavigateDown: vi.fn(),
    onNavigateUp: vi.fn(),
    onShowHelp: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register keyboard shortcuts when enabled', () => {
    renderHook(() => useKeyboardShortcuts({
      ...mockHandlers,
      enabled: true,
    }));

    // Simulate keydown on window (where the hook listens)
    const event = new KeyboardEvent('keydown', { key: 'j', bubbles: true });
    window.dispatchEvent(event);

    // 'j' key maps to 'navigateDown' action
    expect(mockHandlers.onNavigateDown).toHaveBeenCalled();
  });

  it('should not trigger when disabled', () => {
    renderHook(() => useKeyboardShortcuts({
      ...mockHandlers,
      enabled: false,
    }));

    const event = new KeyboardEvent('keydown', { key: 'j', bubbles: true });
    window.dispatchEvent(event);

    expect(mockHandlers.onNavigateDown).not.toHaveBeenCalled();
  });

  it('should handle numeric keys for section navigation', () => {
    renderHook(() => useKeyboardShortcuts({
      ...mockHandlers,
      enabled: true,
    }));

    const event = new KeyboardEvent('keydown', { key: '5', bubbles: true });
    window.dispatchEvent(event);

    expect(mockHandlers.onGoToSection).toHaveBeenCalledWith(4);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts({
      ...mockHandlers,
      enabled: true,
    }));

    unmount();

    const event = new KeyboardEvent('keydown', { key: 'j', bubbles: true });
    window.dispatchEvent(event);

    expect(mockHandlers.onNavigateDown).not.toHaveBeenCalled();
  });

  it('should handle question mark for help', () => {
    const onShowHelp = vi.fn();
    
    renderHook(() => useKeyboardShortcuts({
      ...mockHandlers,
      onShowHelp,
      enabled: true,
    }));

    // The '?' shortcut requires shift: true in the implementation
    const event = new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(onShowHelp).toHaveBeenCalled();
  });
});
