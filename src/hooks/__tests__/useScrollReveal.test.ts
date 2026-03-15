import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useParallax, useScrollReveal, useStaggeredReveal } from '../useScrollReveal';

describe('useScrollReveal', () => {
  it('should return ref and isVisible state', () => {
    const { result } = renderHook(() => useScrollReveal());
    
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
    expect(result.current.isVisible).toBe(false);
  });

  it('should respect reduced motion preference', async () => {
    // Mock matchMedia to return reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      })),
    });

    const { result } = renderHook(() => useScrollReveal());
    
    // Should be visible immediately when reduced motion is preferred
    // The hook sets visibility via requestAnimationFrame in useEffect
    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
    });
  });
});

describe('useStaggeredReveal', () => {
  it('should return containerRef and visibleItems array', () => {
    // Mock matchMedia to return false for reduced motion (default behavior)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
      })),
    });

    const { result } = renderHook(() => useStaggeredReveal(5));
    
    expect(result.current.containerRef).toBeDefined();
    expect(result.current.visibleItems).toHaveLength(5);
    expect(result.current.visibleItems.every(v => !v)).toBe(true);
  });

  it('should respect reduced motion preference', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      })),
    });

    const { result } = renderHook(() => useStaggeredReveal(3));
    
    // All items should be visible immediately when reduced motion is preferred
    // The hook sets visibility via setState in useEffect
    await waitFor(() => {
      expect(result.current.visibleItems.every(v => v)).toBe(true);
    });
  });
});

describe('useParallax', () => {
  it('should return ref and offset', () => {
    const { result } = renderHook(() => useParallax(0.5));
    
    expect(result.current.ref).toBeDefined();
    expect(result.current.offset).toBe(0);
  });

  it('should not apply parallax when reduced motion is preferred', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      })),
    });

    const { result } = renderHook(() => useParallax(0.5));
    
    // Effect should not attach scroll listener
    expect(result.current.offset).toBe(0);
  });
});
