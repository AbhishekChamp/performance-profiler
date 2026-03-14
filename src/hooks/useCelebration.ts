import { useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
  disableForReducedMotion?: boolean;
}

/**
 * Hook for triggering celebration animations with canvas-confetti
 * Respects prefers-reduced-motion by default
 */
export function useCelebration(): {
  triggerConfetti: (options?: CelebrationOptions) => void;
  triggerSuccess: () => void;
  triggerScoreCelebration: (score: number) => void;
  resetCelebration: () => void;
} {
  const hasCelebrated = useRef(false);

  const triggerConfetti = useCallback((options: CelebrationOptions = {}) => {
    const {
      particleCount = 100,
      spread = 70,
      origin = { y: 0.6 },
      colors = ['#238636', '#58a6ff', '#d29922', '#da3633'],
      disableForReducedMotion = true,
    } = options;

    // Check for reduced motion preference
    if (disableForReducedMotion && typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;
    }

    confetti({
      particleCount,
      spread,
      origin,
      colors,
      disableForReducedMotion,
    });
  }, []);

  const triggerSuccess = useCallback((): void => {
    const end = Date.now() + 1000;
    const colors = ['#238636', '#3fb950'];

    const frame = (): void => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        disableForReducedMotion: true,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const triggerScoreCelebration = useCallback((score: number) => {
    if (score < 90 || hasCelebrated.current) return;
    
    hasCelebrated.current = true;
    
    // Different celebration based on score
    if (score >= 95) {
      // Epic celebration for excellent scores
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number): number => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    } else {
      // Standard celebration for good scores
      triggerConfetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#238636', '#58a6ff', '#d29922'],
      });
    }
  }, [triggerConfetti]);

  const resetCelebration = useCallback(() => {
    hasCelebrated.current = false;
  }, []);

  return {
    triggerConfetti,
    triggerSuccess,
    triggerScoreCelebration,
    resetCelebration,
  };
}
