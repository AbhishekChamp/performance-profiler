import { useEffect, useId, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getScoreColor } from '@/core/scoring';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  glowOnHighScore?: boolean;
}

const sizes = {
  sm: { width: 60, strokeWidth: 6, fontSize: 16 },
  md: { width: 100, strokeWidth: 8, fontSize: 24 },
  lg: { width: 140, strokeWidth: 10, fontSize: 32 },
  xl: { width: 180, strokeWidth: 12, fontSize: 40 },
};

/**
 * Animated circular progress ring with gradient
 * Shows score with smooth animation and optional glow effect
 */
export function ScoreRing({
  score,
  size = 'md',
  showValue = true,
  showLabel = true,
  label,
  animate = true,
  glowOnHighScore = true,
}: ScoreRingProps): JSX.Element {
  const [animatedScore, setAnimatedScore] = useState(() => {
    const prefersReducedMotion = typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;
    return prefersReducedMotion || !animate ? score : 0;
  });

  const dimensions = sizes[size];
  const radius = (dimensions.width - dimensions.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);
  const isHighScore = score >= 90;

  // Generate unique gradient ID using React's useId hook
  const uniqueId = useId();
  const gradientId = useMemo(() => `score-gradient-${uniqueId.replace(/:/g, '')}`, [uniqueId]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion || !animate) {
      return;
    }

    const duration = 1500;
    const startTime = performance.now();

    const animateScore = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(score * easeOut);

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      }
    };

    requestAnimationFrame(animateScore);
  }, [score, animate]);

  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center">
      <div
        className={`relative ${glowOnHighScore && isHighScore ? 'animate-pulse-glow' : ''}`}
        style={{
          filter: glowOnHighScore && isHighScore ? `drop-shadow(0 0 10px ${color}40)` : undefined,
        }}
      >
        <svg
          width={dimensions.width}
          height={dimensions.width}
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Background ring */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.width / 2}
            r={radius}
            fill="none"
            stroke="var(--dev-border)"
            strokeWidth={dimensions.strokeWidth}
            opacity="0.3"
          />

          {/* Progress ring */}
          <motion.circle
            cx={dimensions.width / 2}
            cy={dimensions.width / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={dimensions.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>

        {/* Center value */}
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="font-mono font-bold"
              style={{
                fontSize: dimensions.fontSize,
                color,
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {Math.round(animatedScore)}
            </motion.span>
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && label !== undefined && label !== '' && (
        <motion.span
          className="mt-2 text-xs text-dev-text-muted uppercase tracking-wider"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}

interface MiniScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Compact score ring for inline use
 */
export function MiniScoreRing({
  score,
  size = 24,
  strokeWidth = 3,
}: MiniScoreRingProps): JSX.Element {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--dev-border)"
        strokeWidth={strokeWidth}
        opacity="0.3"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  );
}
