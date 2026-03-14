import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockHandlers = {
    onNextSection: vi.fn(),
    onPreviousSection: vi.fn(),
    onGoToSection: vi.fn(),
    onCycleTheme: vi.fn(),
    onExport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register keyboard shortcuts when enabled', () => {
    renderHook(() => useKeyboardShortcuts({
      ...mockHandlers,
      enabled: true,
    }));

    // Simulate keydown
    const event = new KeyboardEvent('keydown', { key: 'j' });
    document.dispatchEvent(event);

    expect(mockHandlers.onNextSection).toHaveBeenCalled();
  });

  it('should not trigger when disabled', () => {
    renderHook(() => useKeyboardShortcuts({
      ...mockHandlers,
      enabled: false,
    }));

    const event = new KeyboardEvent('keydown', { key: 'j' });
    document.dispatchEvent(event);

    expect(mockHandlers.onNextSection).not.toHaveBeenCalled();
  });

  it('should handle numeric keys for section navigation', () => {
    renderHook(() => useKeyboardShortcuts({
      ...mockHandlers,
      enabled: true,
    }));

    const event = new KeyboardEvent('keydown', { key: '5' });
    document.dispatchEvent(event);

    expect(mockHandlers.onGoToSection).toHaveBeenCalledWith(4);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts({
      ...mockHandlers,
      enabled: true,
    }));

    unmount();

    const event = new KeyboardEvent('keydown', { key: 'j' });
    document.dispatchEvent(event);

    expect(mockHandlers.onNextSection).not.toHaveBeenCalled();
  });

  it('should handle question mark for help', () => {
    const onShowHelp = vi.fn();
    
    renderHook(() => useKeyboardShortcuts({
      ...mockHandlers,
      onShowHelp,
      enabled: true,
    }));

    const event = new KeyboardEvent('keydown', { key: '?' });
    document.dispatchEvent(event);

    expect(onShowHelp).toHaveBeenCalled();
  });
});
