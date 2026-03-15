import { useCallback, useEffect, useRef, useState } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook for triggering animations when elements enter viewport
 */
interface ScrollRevealReturn<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  isVisible: boolean;
}

export function useScrollReveal<T extends HTMLElement>(
  options: ScrollRevealOptions = {}
): ScrollRevealReturn<T> {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const ref = useRef<T>(null);
  // Initialize visibility based on reduced motion preference (for SSR compatibility)
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasTriggered(true);
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref, isVisible };
}

/**
 * Hook for staggered animations on multiple elements
 */
interface StaggeredRevealReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  visibleItems: boolean[];
}

export function useStaggeredReveal(itemCount: number, baseDelay: number = 100): StaggeredRevealReturn {
  // Initialize visibility based on reduced motion preference (for SSR compatibility)
  const [visibleItems, setVisibleItems] = useState<boolean[]>(() => {
    if (typeof window === 'undefined') return new Array(itemCount).fill(false);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return new Array(itemCount).fill(prefersReducedMotion);
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVisibleItems(new Array(itemCount).fill(true));
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Trigger staggered animations
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems(prev => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, i * baseDelay);
          }
          observer.unobserve(container);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [itemCount, baseDelay]);

  return { containerRef, visibleItems };
}

/**
 * Hook for parallax scrolling effect
 */
interface ParallaxReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  offset: number;
}

export function useParallax(speed: number = 0.5): ParallaxReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);

  const handleScroll = useCallback((): void => {
    if (rafRef.current != null) return;
    
    rafRef.current = requestAnimationFrame(() => {
      if (ref.current) {
        const _rect = ref.current.getBoundingClientRect();
        const scrolled = window.scrollY;
        const rate = scrolled * speed;
        setOffset(rate);
      }
      rafRef.current = undefined;
    });
  }, [speed]);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll]);

  return { ref, offset };
}
