import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCelebration } from '../useCelebration';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

import confetti from 'canvas-confetti';

describe('useCelebration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock matchMedia to return false for reduced motion (allowing confetti to run)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
      })),
    });
  });

  it('should trigger confetti with default options', () => {
    const { result } = renderHook(() => useCelebration());

    act(() => {
      result.current.triggerConfetti();
    });

    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    );
  });

  it('should not trigger confetti for low scores', () => {
    const { result } = renderHook(() => useCelebration());

    act(() => {
      result.current.triggerScoreCelebration(80);
    });

    expect(confetti).not.toHaveBeenCalled();
  });

  it('should trigger score celebration for excellent scores', async () => {
    const { result } = renderHook(() => useCelebration());

    act(() => {
      result.current.triggerScoreCelebration(95);
    });

    // Wait for the interval-based confetti to fire (interval is 250ms)
    await waitFor(() => expect(confetti).toHaveBeenCalled(), { timeout: 500 });
  });

  it('should reset celebration state', async () => {
    const { result } = renderHook(() => useCelebration());

    // First celebration - use score 92 (90-94 range) which uses triggerConfetti directly
    act(() => {
      result.current.triggerScoreCelebration(92);
    });
    
    expect(confetti).toHaveBeenCalledTimes(1);
    
    // Reset and trigger again
    act(() => {
      result.current.resetCelebration();
      result.current.triggerScoreCelebration(92);
    });

    // Should be called again after reset
    expect(confetti).toHaveBeenCalledTimes(2);
  });
});
