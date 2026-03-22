import { motion } from 'framer-motion';
import { useState } from 'react';

interface TimelineEvent {
  name: string;
  start: number;
  duration: number;
  color?: string;
}

interface TimelineChartProps {
  events: TimelineEvent[];
  maxTime?: number;
  height?: number;
}

export function TimelineChart({ 
  events, 
  maxTime,
  height = 200 
}: TimelineChartProps): React.ReactNode {
  const max = maxTime ?? Math.max(...events.map(e => e.start + e.duration));
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  const colors = [
    'var(--dev-accent)',
    'var(--dev-success)',
    'var(--dev-warning)',
    'var(--dev-info)',
    'var(--dev-danger)',
  ];

  return (
    <div className="w-full" style={{ height }}>
      {/* Time markers */}
      <div className="flex justify-between text-xs text-[var(--dev-text-muted)] mb-2">
        <span>0ms</span>
        <span>{(max / 2).toFixed(0)}ms</span>
        <span>{max.toFixed(0)}ms</span>
      </div>

      {/* Timeline tracks */}
      <div className="relative h-full space-y-3">
        {events.map((event, index) => {
          const left = (event.start / max) * 100;
          const width = (event.duration / max) * 100;
          const isHovered = hoveredEvent === event.name;
          const eventColor = event.color ?? colors[index % colors.length];

          return (
            <div
              key={index}
              className="relative h-8 flex items-center"
              onMouseEnter={() => setHoveredEvent(event.name)}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              {/* Label */}
              <div className="w-32 pr-4 text-right text-sm text-[var(--dev-text)] truncate">
                {event.name}
              </div>

              {/* Bar */}
              <div className="flex-1 relative h-full bg-[var(--dev-surface-hover)] rounded-full overflow-hidden">
                <motion.div
                  className="absolute h-full rounded-full cursor-pointer"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: eventColor,
                    boxShadow: isHovered ? `0 0 15px ${eventColor}60` : 'none',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                </motion.div>
              </div>

              {/* Duration label */}
              <motion.span
                className="ml-3 text-xs text-[var(--dev-text-muted)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
              >
                {event.duration.toFixed(0)}ms
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
