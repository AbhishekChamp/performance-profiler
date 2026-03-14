import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'number' | 'percentage' | 'bytes' | 'ms';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  isLoading?: boolean;
}

const colorClasses = {
  blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  red: 'from-red-500/20 to-pink-500/20 border-red-500/30',
  purple: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
};

const iconColors = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  purple: 'text-purple-400',
};

export function MetricCard({
  title,
  value,
  previousValue,
  format = 'number',
  icon,
  trend,
  color = 'blue',
  isLoading,
}: MetricCardProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const hasAnimated = useRef(false);

  const [displayValue, setDisplayValue] = useState(() => {
    const prefersReducedMotion = typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;
    return prefersReducedMotion ? value : 0;
  });

  const springValue = useSpring(0, {
    damping: 30,
    stiffness: 100,
    duration: 1500,
  });

  const display = useTransform(springValue, (latest) => {
    return formatValue(latest, format);
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
        setDisplayValue(parseFloat(latest.replace(/[^0-9.-]/g, '')));
      });

      return () => unsubscribe();
    }
  }, [value, springValue, display]);

  const calculatedTrend = trend ?? (previousValue !== undefined
    ? value > previousValue
      ? 'up'
      : value < previousValue
      ? 'down'
      : 'neutral'
    : 'neutral');

  const percentageChange = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : 0;

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorClasses[color]} p-6 cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3)',
        y: -4,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />

      {color === 'red' && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-red-500/50"
          animate={{ 
            scale: [1, 1.02, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon !== undefined && icon !== null && (
              <motion.div
                className={`p-2 rounded-lg bg-dev-surface/50 ${iconColors[color]}`}
                animate={{ 
                  rotate: isHovered ? [0, -10, 10, 0] : 0,
                }}
                transition={{ duration: 0.5 }}
              >
                {icon}
              </motion.div>
            )}
            <span className="text-sm font-medium text-dev-text-muted uppercase tracking-wider">
              {title}
            </span>
          </div>

          {previousValue !== undefined && (
            <motion.div
              className={`flex items-center gap-1 text-xs font-medium ${
                calculatedTrend === 'up'
                  ? 'text-green-400'
                  : calculatedTrend === 'down'
                  ? 'text-red-400'
                  : 'text-dev-text-muted'
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {calculatedTrend === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : calculatedTrend === 'down' ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {Math.abs(percentageChange).toFixed(1)}%
            </motion.div>
          )}
        </div>

        <motion.div
          className="text-3xl font-bold text-dev-text"
          animate={{ 
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {isLoading === true ? (
            <div className="h-9 w-24 bg-dev-surface animate-pulse rounded" />
          ) : (
            formatValue(displayValue, format)
          )}
        </motion.div>

        {value >= 90 && (
          <motion.div
            className="absolute top-0 right-0"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              delay: 1,
            }}
          >
            ✨
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function formatValue(value: number, format: MetricCardProps['format']): string {
  switch (format) {
    case 'percentage':
      return `${Math.round(value)}%`;
    case 'bytes': {
      if (value === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(value) / Math.log(k));
      return `${(value / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    }
    case 'ms':
      return `${Math.round(value)}ms`;
    default:
      return value.toLocaleString();
  }
}
