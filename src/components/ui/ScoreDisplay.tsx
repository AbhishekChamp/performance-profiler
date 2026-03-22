import { motion, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ScoreDisplayProps {
  score: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  animate?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 60, strokeWidth: 6, fontSize: 'text-lg' },
  md: { width: 100, strokeWidth: 8, fontSize: 'text-2xl' },
  lg: { width: 140, strokeWidth: 10, fontSize: 'text-3xl' },
  xl: { width: 180, strokeWidth: 12, fontSize: 'text-4xl' },
};

function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--dev-success)';
  if (score >= 70) return 'var(--dev-success-bright)';
  if (score >= 50) return 'var(--dev-warning)';
  if (score >= 30) return 'var(--dev-warning-bright)';
  return 'var(--dev-danger)';
}

export function ScoreDisplay({
  score,
  max = 100,
  size = 'md',
  label,
  animate = true,
  className = '',
}: ScoreDisplayProps): React.ReactNode {
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score / max);
  
  const [displayScore, setDisplayScore] = useState(0);
  const count = useMotionValue(0);

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    const duration = 1000;
    const startTime = Date.now();
    const startValue = 0;

    const updateScore = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (score - startValue) * easeProgress);
      
      setDisplayScore(current);
      count.set(current);

      if (progress < 1) {
        requestAnimationFrame(updateScore);
      }
    };

    requestAnimationFrame(updateScore);
  }, [score, animate, count]);

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <div style={{ width: config.width, height: config.width }}>
        <svg width={config.width} height={config.width} className="transform -rotate-90">
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="var(--dev-surface-hover)"
            strokeWidth={config.strokeWidth}
          />
          <motion.circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${config.fontSize}`} style={{ color: getScoreColor(score) }}>
            {displayScore}
          </span>
        </div>
      </div>
      {label !== undefined && label !== '' && (
        <span className="mt-2 text-sm text-[var(--dev-text-muted)] text-center">{label}</span>
      )}
    </div>
  );
}
