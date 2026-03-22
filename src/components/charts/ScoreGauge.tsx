import { motion } from 'framer-motion';

interface ScoreGaugeProps {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ScoreGauge({ 
  score, 
  max = 100, 
  size = 120, 
  strokeWidth = 10,
  label 
}: ScoreGaugeProps): React.ReactNode {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = score / max;
  const strokeDashoffset = circumference * (1 - percentage);

  // Color based on score
  const getColor = (): string => {
    if (score >= 90) return 'var(--dev-success)';
    if (score >= 70) return 'var(--dev-success-bright)';
    if (score >= 50) return 'var(--dev-warning)';
    if (score >= 30) return 'var(--dev-warning-bright)';
    return 'var(--dev-danger)';
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <div style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--dev-surface-hover)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold"
            style={{ color: getColor() }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-[var(--dev-text-muted)]">/{max}</span>
        </div>
      </div>
      {label !== undefined && label !== '' && (
        <span className="mt-2 text-sm text-[var(--dev-text-muted)]">{label}</span>
      )}
    </div>
  );
}
