import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCelebration } from '../useCelebration';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

import confetti from 'canvas-confetti';

describe('useCelebration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('should trigger score celebration for excellent scores', () => {
    const { result } = renderHook(() => useCelebration());

    act(() => {
      result.current.triggerScoreCelebration(95);
    });

    expect(confetti).toHaveBeenCalled();
  });

  it('should reset celebration state', () => {
    const { result } = renderHook(() => useCelebration());

    act(() => {
      result.current.triggerScoreCelebration(95);
      result.current.resetCelebration();
      result.current.triggerScoreCelebration(95);
    });

    expect(confetti).toHaveBeenCalledTimes(2);
  });
});
