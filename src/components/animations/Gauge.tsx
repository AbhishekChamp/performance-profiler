import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getScoreColor } from '@/core/scoring';

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  label?: string;
  animate?: boolean;
}

const sizes = {
  sm: { width: 120, height: 80, fontSize: 24, strokeWidth: 8 },
  md: { width: 180, height: 120, fontSize: 32, strokeWidth: 12 },
  lg: { width: 240, height: 160, fontSize: 40, strokeWidth: 16 },
};

export function Gauge({
  value,
  min = 0,
  max = 100,
  size = 'md',
  showValue = true,
  label,
  animate = true,
}: GaugeProps): JSX.Element {
  const [animatedValue, setAnimatedValue] = useState(() => {
    const prefersReducedMotion = typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;
    return prefersReducedMotion || !animate ? value : min;
  });
  
  const dimensions = sizes[size];
  const color = getScoreColor(value);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion || !animate) {
      return;
    }

    const duration = 1500;
    const startTime = performance.now();

    const animateGauge = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(min + (value - min) * easeOut);

      if (progress < 1) {
        requestAnimationFrame(animateGauge);
      }
    };

    requestAnimationFrame(animateGauge);
  }, [value, min, animate]);

  const percentage = (animatedValue - min) / (max - min);
  const angle = -90 + percentage * 180;

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height - 10;
  const radius = dimensions.width / 2 - 20;

  const zones = [
    { color: '#da3633', start: 0, end: 0.25 },
    { color: '#d29922', start: 0.25, end: 0.5 },
    { color: '#3fb950', start: 0.5, end: 0.75 },
    { color: '#238636', start: 0.75, end: 1 },
  ];

  const ticks = Array.from({ length: 11 }, (_, i) => {
    const tickAngle = -90 + (i / 10) * 180;
    const tickRadians = (tickAngle * Math.PI) / 180;
    const innerR = radius - 15;
    const outerR = i % 5 === 0 ? radius - 5 : radius - 10;
    
    return {
      x1: centerX + Math.cos(tickRadians) * innerR,
      y1: centerY + Math.sin(tickRadians) * innerR,
      x2: centerX + Math.cos(tickRadians) * outerR,
      y2: centerY + Math.sin(tickRadians) * outerR,
      isMajor: i % 5 === 0,
    };
  });

  const needleRadians = (angle * Math.PI) / 180;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={dimensions.width} height={dimensions.height}>
        {zones.map((zone, index) => {
          const startAngle = -90 + zone.start * 180;
          const endAngle = -90 + zone.end * 180;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          const largeArc = zone.end - zone.start > 0.5 ? 1 : 0;
          
          const x1 = centerX + Math.cos(startRad) * radius;
          const y1 = centerY + Math.sin(startRad) * radius;
          const x2 = centerX + Math.cos(endRad) * radius;
          const y2 = centerY + Math.sin(endRad) * radius;
          
          return (
            <path
              key={index}
              d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={zone.color}
              opacity={0.2}
            />
          );
        })}

        {ticks.map((tick, index) => (
          <motion.line
            key={index}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="var(--dev-text-subtle)"
            strokeWidth={tick.isMajor ? 2 : 1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          />
        ))}

        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: angle }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ originX: centerX, originY: centerY }}
        >
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + Math.cos(needleRadians) * (radius - 5)}
            y2={centerY + Math.sin(needleRadians) * (radius - 5)}
            stroke={color}
            strokeWidth={dimensions.strokeWidth / 2}
            strokeLinecap="round"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={dimensions.strokeWidth / 2}
            fill={color}
          />
        </motion.g>

        {showValue && (
          <motion.text
            x={centerX}
            y={centerY - 20}
            textAnchor="middle"
            className="font-bold"
            style={{ fontSize: dimensions.fontSize, fill: color }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(animatedValue)}
          </motion.text>
        )}
      </svg>

      {label !== undefined && label !== '' && (
        <motion.span
          className="mt-2 text-sm text-dev-text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}
