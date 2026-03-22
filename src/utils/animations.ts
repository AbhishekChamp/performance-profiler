/**
 * Animation Utilities
 * 
 * Reusable animation variants and components for consistent
 * animations throughout the application.
 */

import type { Transition, Variants } from 'framer-motion';

// Check for reduced motion preference
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get animation duration based on user preference
export const getAnimationDuration = (defaultDuration: number): number => {
  return prefersReducedMotion() ? 0 : defaultDuration;
};

// Animation timing constants (respects reduced motion)
export const TIMING = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
} as const;

// Easing functions
export const EASING = {
  easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  bounce: { type: 'spring', stiffness: 400, damping: 10 },
};

// Fade animation variants
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: TIMING.normal, ease: EASING.easeOut }
  },
  exit: { 
    opacity: 0,
    transition: { duration: TIMING.fast, ease: EASING.easeIn }
  },
};

// Fade up animation variants
// Fade in up (alias for compatibility)
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: TIMING.normal, ease: EASING.easeOut }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: TIMING.fast, ease: EASING.easeIn }
  },
};

// Fade down animation variants
export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: TIMING.normal, ease: EASING.easeOut }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { duration: TIMING.fast, ease: EASING.easeIn }
  },
};

// Scale animation variants
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: TIMING.normal, ease: EASING.easeOut }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: TIMING.fast, ease: EASING.easeIn }
  },
};

// Slide in from left
export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: TIMING.normal, ease: EASING.easeOut }
  },
  exit: { 
    opacity: 0, 
    x: -30,
    transition: { duration: TIMING.fast, ease: EASING.easeIn }
  },
};

// Slide in from right
export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: TIMING.normal, ease: EASING.easeOut }
  },
  exit: { 
    opacity: 0, 
    x: 30,
    transition: { duration: TIMING.fast, ease: EASING.easeIn }
  },
};

// Stagger container variants
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

// Stagger item variants
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: TIMING.normal, ease: EASING.easeOut }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: TIMING.fast, ease: EASING.easeIn }
  },
};

// Card hover animation
export const cardHoverAnimation = {
  y: -4,
  scale: 1.01,
  transition: { duration: TIMING.fast, ease: EASING.easeOut },
};

// Card tap animation
export const cardTapAnimation = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

// Button hover animation
export const buttonHoverAnimation = {
  scale: 1.02,
  transition: { duration: TIMING.fast },
};

// Button tap animation
export const buttonTapAnimation = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

// Page transition variants
export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: TIMING.slow, 
      ease: EASING.easeOut,
      when: 'beforeChildren',
      staggerChildren: 0.05,
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: TIMING.normal, ease: EASING.easeIn }
  },
};

// Section transition variants
export const sectionTransitionVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: TIMING.normal, ease: EASING.easeOut }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: TIMING.fast, ease: EASING.easeIn }
  },
};

// Modal animation variants
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: TIMING.normal, ease: EASING.easeOut }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: TIMING.fast, ease: EASING.easeIn }
  },
};

// Backdrop animation variants
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Pulse animation for badges/alerts
export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Glow animation
export const glowAnimation = {
  boxShadow: [
    '0 0 0 0 rgba(var(--dev-accent-rgb), 0)',
    '0 0 20px 5px rgba(var(--dev-accent-rgb), 0.3)',
    '0 0 0 0 rgba(var(--dev-accent-rgb), 0)',
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Create custom transition
export function createTransition(
  duration: number = TIMING.normal,
  ease: [number, number, number, number] = EASING.easeOut
): Transition {
  return { duration, ease };
}

// Create stagger delay
export function createStaggerDelay(
  index: number,
  baseDelay: number = 0.05
): number {
  return index * baseDelay;
}

// Spring transition helper
export function createSpringTransition(
  stiffness: number = 300,
  damping: number = 30
): Transition {
  return { type: 'spring', stiffness, damping };
}
