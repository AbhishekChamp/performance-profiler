import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animate = true,
}: SkeletonProps): React.ReactNode {
  const baseClasses = 'bg-dev-border';
  
  const variantClasses = {
    text: 'rounded h-4',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1rem' : undefined),
  };

  const SkeletonComponent = (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );

  if (!animate) {
    return SkeletonComponent;
  }

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={baseClasses}
    >
      {SkeletonComponent}
    </motion.div>
  );
}

// Preset skeleton layouts
interface SkeletonCardProps {
  hasImage?: boolean;
  lines?: number;
  className?: string;
}

export function SkeletonCard({ hasImage = false, lines = 3, className = '' }: SkeletonCardProps): React.ReactNode {
  return (
    <div className={`p-4 bg-dev-surface rounded-xl border border-dev-border ${className}`}>
      {hasImage && (
        <Skeleton variant="rectangular" height={160} className="mb-4 rounded-lg" />
      )}
      <Skeleton variant="text" width="70%" className="mb-2" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '40%' : '100%'}
          className="mb-2"
        />
      ))}
    </div>
  );
}

interface SkeletonStatsProps {
  count?: number;
  className?: string;
}

export function SkeletonStats({ count = 4, className = '' }: SkeletonStatsProps): React.ReactNode {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-dev-surface rounded-xl border border-dev-border">
          <Skeleton variant="text" width="60%" className="mb-2" />
          <Skeleton variant="text" width="40%" height={32} />
        </div>
      ))}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps): React.ReactNode {
  return (
    <div className={`bg-dev-surface rounded-xl border border-dev-border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-dev-border bg-dev-bg/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width="80%" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4 border-b border-dev-border last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width={colIndex === 0 ? '60%' : '80%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonListProps {
  items?: number;
  className?: string;
}

export function SkeletonList({ items = 5, className = '' }: SkeletonListProps): React.ReactNode {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-dev-surface rounded-lg border border-dev-border">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1">
            <Skeleton variant="text" width="40%" className="mb-2" />
            <Skeleton variant="text" width="70%" />
          </div>
        </div>
      ))}
    </div>
  );
}
