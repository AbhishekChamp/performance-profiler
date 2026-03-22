import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';

interface PieData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieData[];
  size?: number;
  donut?: boolean;
  donutWidth?: number;
}

interface PieSlice {
  label: string;
  value: number;
  color: string;
  pathData: string;
  percentage: number;
  endAngle: number;
}

export function PieChart({ 
  data, 
  size = 200, 
  donut = false,
  donutWidth = 40 
}: PieChartProps): React.ReactNode {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.reduce((acc, item) => acc + item.value, 0);
  
  const center = size / 2;
  const radius = size / 2 - 10;

  // Calculate slices using useMemo with reduce to avoid reassignment
  const slices = useMemo((): PieSlice[] => {
    return data.reduce<PieSlice[]>((acc, item, index) => {
      const previousAngle = index === 0 ? 0 : acc[index - 1].endAngle;
      const percentage = item.value / total;
      const angle = percentage * 360;
      const startAngle = previousAngle;
      const endAngle = previousAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = donut
        ? `M ${center + (radius - donutWidth) * Math.cos(startRad)} ${center + (radius - donutWidth) * Math.sin(startRad)} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${center + (radius - donutWidth) * Math.cos(endRad)} ${center + (radius - donutWidth) * Math.sin(endRad)} A ${radius - donutWidth} ${radius - donutWidth} 0 ${largeArcFlag} 0 ${center + (radius - donutWidth) * Math.cos(startRad)} ${center + (radius - donutWidth) * Math.sin(startRad)}`
        : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      acc.push({
        label: item.label,
        value: item.value,
        color: item.color,
        pathData,
        percentage: percentage * 100,
        endAngle,
      });
      return acc;
    }, []);
  }, [data, total, center, radius, donut, donutWidth]);

  return (
    <div className="relative inline-flex">
      <svg width={size} height={size}>
        {slices.map((slice, index) => {
          const isHovered = hoveredIndex === index;

          return (
            <motion.path
              key={index}
              d={slice.pathData}
              fill={slice.color}
              stroke="var(--dev-bg)"
              strokeWidth={2}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                filter: isHovered ? `drop-shadow(0 0 10px ${slice.color}80)` : 'none',
                cursor: 'pointer',
                transformOrigin: 'center',
              }}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="ml-4 flex flex-col justify-center gap-2">
        {slices.map((slice, index) => (
          <div
            key={index}
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-sm text-[var(--dev-text)]">
              {slice.label} ({slice.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>

      {/* Center text for donut */}
      {donut && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-2xl font-bold text-[var(--dev-text)]">{total}</span>
            <span className="text-xs text-[var(--dev-text-muted)] block">Total</span>
          </div>
        </div>
      )}
    </div>
  );
}
