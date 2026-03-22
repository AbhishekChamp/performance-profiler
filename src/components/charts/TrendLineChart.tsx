import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { RegressionPoint, TrendSeries } from '@/types';

interface TrendPoint {
  x: number;
  y: number;
  label?: string;
}

interface TrendLineChartProps {
  data?: TrendPoint[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  series?: TrendSeries[];
  regressions?: RegressionPoint[];
  enableZoom?: boolean;
}

export function TrendLineChart({ 
  data,
  width = 600, 
  height = 200,
  color = 'var(--dev-accent)',
  showArea = true,
  series,
}: TrendLineChartProps): React.ReactNode {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (series !== undefined && series.length > 0) {
    return (
      <SeriesTrendLineChart
        series={series}
        width={width}
        height={height}
      />
    );
  }

  if (data === undefined || data.length === 0) {
    return <div className="text-center py-8 text-[var(--dev-text-muted)]">No data</div>;
  }

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxX = Math.max(...data.map(d => d.x));
  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));
  const yRange = maxY - minY || 1;

  const getX = (x: number): number => padding + (x / maxX) * chartWidth;
  const getY = (y: number): number => padding + chartHeight - ((y - minY) / yRange) * chartHeight;

  const pathData = data.map((point, index) => {
    const x = getX(point.x);
    const y = getY(point.y);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaData = showArea 
    ? `${pathData} L ${getX(data[data.length - 1].x)} ${height - padding} L ${padding} ${height - padding} Z` 
    : '';

  return (
    <div className="relative">
      <svg width={width} height={height}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + chartHeight * ratio}
            x2={width - padding}
            y2={padding + chartHeight * ratio}
            stroke="var(--dev-surface-hover)"
            strokeWidth={1}
            strokeDasharray="4"
          />
        ))}

        {showArea && (
          <motion.path
            d={areaData}
            fill={color}
            opacity={0.2}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ duration: 0.5 }}
          />
        )}

        <motion.path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        {data.map((point, index) => {
          const isHovered = hoveredPoint === index;
          const x = getX(point.x);
          const y = getY(point.y);

          return (
            <g key={index}>
              <motion.circle
                cx={x}
                cy={y}
                r={isHovered ? 8 : 5}
                fill={color}
                stroke="var(--dev-bg)"
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              />
              {isHovered && point.label !== undefined && point.label !== '' && (
                <g>
                  <rect
                    x={x - 40}
                    y={y - 35}
                    width={80}
                    height={25}
                    fill="var(--dev-surface)"
                    stroke="var(--dev-border)"
                    rx={4}
                  />
                  <text
                    x={x}
                    y={y - 18}
                    textAnchor="middle"
                    fill="var(--dev-text)"
                    fontSize={12}
                  >
                    {point.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="var(--dev-text-muted)"
          strokeWidth={1}
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="var(--dev-text-muted)"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}

interface SeriesTrendLineChartProps {
  series: TrendSeries[];
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

function SeriesTrendLineChart({
  series,
  width,
  height,
}: SeriesTrendLineChartProps): React.ReactNode {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const allPoints: Point[] = useMemo(() => 
    series.flatMap(s => s.data),
    [series]
  );
  
  const maxX = Math.max(...allPoints.map(p => p.x));
  const minX = Math.min(...allPoints.map(p => p.x));
  const maxY = Math.max(...allPoints.map(p => p.y));
  const minY = Math.min(...allPoints.map(p => p.y));

  const getX = (x: number): number => {
    return padding + ((x - minX) / (maxX - minX || 1)) * chartWidth;
  };

  const getY = (y: number): number => {
    return padding + chartHeight - ((y - minY) / (maxY - minY || 1)) * chartHeight;
  };

  return (
    <div className="relative">
      <svg width={width} height={height}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + chartHeight * ratio}
            x2={width - padding}
            y2={padding + chartHeight * ratio}
            stroke="var(--dev-surface-hover)"
            strokeWidth={1}
            strokeDasharray="4"
          />
        ))}

        {series.map((s, seriesIndex) => {
          const pathData = s.data.map((point, i) => {
            const x = getX(point.x);
            const y = getY(point.y);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ');

          const lineColor = s.color;

          return (
            <motion.path
              key={s.metric}
              d={pathData}
              fill="none"
              stroke={lineColor}
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: seriesIndex * 0.1 }}
            />
          );
        })}

        <g transform={`translate(${padding}, 20)`}>
          {series.map((s, i) => (
            <g key={s.metric} transform={`translate(${i * 100}, 0)`}>
              <circle
                cx={0}
                cy={0}
                r={4}
                fill={s.color}
              />
              <text
                x={10}
                y={4}
                fontSize={12}
                fill="var(--dev-text)"
              >
                {s.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
