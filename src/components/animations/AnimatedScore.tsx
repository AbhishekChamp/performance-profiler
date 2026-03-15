import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { getScoreColor } from '@/core/scoring';

interface AnimatedScoreProps {
  value: number;
  duration?: number;
  className?: string;
  showDecimal?: boolean;
  prefix?: string;
  suffix?: string;
}

/**
 * Animated score component with smooth count-up effect
 * Uses Framer Motion's spring physics for natural animation
 */
export function AnimatedScore({
  value,
  duration = 1.5,
  className = '',
  showDecimal = false,
  prefix = '',
  suffix = '',
}: AnimatedScoreProps): React.ReactNode {
  const hasAnimated = useRef(false);

  // Lazy state initialization to check motion preference once
  const [displayValue, setDisplayValue] = useState(() => {
    const prefersReducedMotion = typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;
    return prefersReducedMotion ? value : 0;
  });

  // Spring animation for smooth, natural motion
  const springValue = useSpring(0, {
    damping: 30,
    stiffness: 100,
    duration: duration * 1000,
  });

  // Transform spring value to display value
  const display = useTransform(springValue, (latest) => {
    if (showDecimal) {
      return latest.toFixed(1);
    }
    return Math.round(latest).toString();
  });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      return;
    }

    if (!hasAnimated.current) {
      hasAnimated.current = true;
      springValue.set(value);

      const unsubscribe = display.on('change', (latest) => {
        setDisplayValue(parseFloat(latest));
      });

      return () => unsubscribe();
    }
  }, [value, springValue, display]);

  const color = getScoreColor(value);

  return (
    <motion.span
      className={`font-mono font-semibold ${className}`}
      style={{ color }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {showDecimal ? displayValue.toFixed(1) : Math.round(displayValue)}
      {suffix}
    </motion.span>
  );
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: 'number' | 'percentage' | 'bytes' | 'ms';
  className?: string;
}

/**
 * Animated counter with formatting options
 */
export function AnimatedCounter({
  value,
  duration = 1,
  format = 'number',
  className = '',
}: AnimatedCounterProps): React.ReactNode {
  const [displayValue, setDisplayValue] = useState(() => {
    const prefersReducedMotion = typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;
    return prefersReducedMotion ? value : 0;
  });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number): void => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * easeOut);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  const formatValue = (val: number): string => {
    switch (format) {
      case 'percentage':
        return `${Math.round(val)}%`;
      case 'bytes': {
        if (val === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(val) / Math.log(k));
        return `${(val / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
      }
      case 'ms':
        return `${Math.round(val)}ms`;
      default:
        return Math.round(val).toLocaleString();
    }
  };

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {formatValue(displayValue)}
    </motion.span>
  );
}

interface ScoreChangeIndicatorProps {
  change: number;
  className?: string;
}

/**
 * Shows score change with animation (up/down arrow)
 */
export function ScoreChangeIndicator({ change, className = '' }: ScoreChangeIndicatorProps): React.ReactNode {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  if (isNeutral) {
    return (
      <span className={`text-dev-text-subtle ${className}`}>
        —
      </span>
    );
  }

  return (
    <motion.span
      className={`inline-flex items-center gap-1 ${
        isPositive ? 'text-dev-success-bright' : 'text-dev-danger-bright'
      } ${className}`}
      initial={{ opacity: 0, y: isPositive ? 10 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{ transform: isPositive ? 'rotate(0deg)' : 'rotate(180deg)' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      {Math.abs(change).toFixed(1)}
    </motion.span>
  );
}
