import { motion } from 'framer-motion';
import { useState } from 'react';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  maxValue?: number;
  height?: number;
  showValues?: boolean;
}

export function BarChart({ 
  data, 
  maxValue, 
  height = 200,
  showValues = true 
}: BarChartProps): React.ReactNode {
  const max = maxValue ?? Math.max(...data.map(d => d.value));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, index) => {
          const percentage = (item.value / max) * 100;
          const isHovered = hoveredIndex === index;
          const itemColor = item.color ?? 'var(--dev-accent)';

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end h-full group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Value label */}
              {showValues && (
                <motion.span
                  className="text-xs text-[var(--dev-text-muted)] mb-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ y: 10 }}
                  animate={{ y: isHovered ? 0 : 10 }}
                >
                  {item.value}
                </motion.span>
              )}
              {/* Bar */}
              <motion.div
                className="w-full max-w-[60px] rounded-t-lg relative overflow-hidden cursor-pointer"
                style={{
                  backgroundColor: itemColor,
                  boxShadow: isHovered ? `0 0 20px ${itemColor}40` : 'none',
                }}
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </motion.div>
              {/* Label */}
              <span className="text-xs text-[var(--dev-text-muted)] mt-2 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
