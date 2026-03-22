import { motion } from 'framer-motion';
import { useState } from 'react';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glowOnHover?: boolean;
  animate?: boolean;
  isLoading?: boolean;
  delay?: number;
  header?: React.ReactNode;
}

export function ModernCard({
  children,
  className = '',
  hoverable = false,
  glowOnHover = false,
  animate = true,
  isLoading = false,
  delay = 0,
  header,
}: ModernCardProps): React.ReactNode {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles = 'relative rounded-xl overflow-hidden';
  const glassStyles = 'bg-[var(--dev-surface)]/80 backdrop-blur-xl border border-[var(--dev-border)]';
  const hoverStyles = hoverable ? 'cursor-pointer' : '';

  const content = (
    <div
      className={`${baseStyles} ${glassStyles} ${hoverStyles} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered && glowOnHover
          ? '0 0 30px rgba(88, 166, 255, 0.15)'
          : '0 4px 20px rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
        transform: isHovered && hoverable ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Gradient border on hover */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: 'linear-gradient(135deg, var(--dev-accent), var(--dev-success))',
            padding: '1px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      {/* Header */}
      {header !== undefined && header}
      
      {/* Content */}
      <div className="relative z-10">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="h-4 bg-[var(--dev-surface-hover)] rounded animate-pulse w-1/3" />
            <div className="space-y-2">
              <div className="h-3 bg-[var(--dev-surface-hover)] rounded animate-pulse" />
              <div className="h-3 bg-[var(--dev-surface-hover)] rounded animate-pulse w-4/5" />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {content}
    </motion.div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function CardHeader({ title, subtitle, icon, actions }: CardHeaderProps): React.ReactNode {
  return (
    <div className="flex items-start justify-between p-4 border-b border-[var(--dev-border)]">
      <div className="flex items-center gap-3">
        {icon !== undefined && (
          <div className="p-2 rounded-lg bg-[var(--dev-accent)]/10">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-[var(--dev-text)]">{title}</h3>
          {subtitle !== undefined && subtitle !== '' && (
            <p className="text-sm text-[var(--dev-text-muted)]">{subtitle}</p>
          )}
        </div>
      </div>
      {actions !== undefined && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

interface CardStatsProps {
  stats: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
  }>;
}

export function CardStats({ stats }: CardStatsProps): React.ReactNode {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="text-center"
        >
          <p className="text-2xl font-bold text-[var(--dev-text)]">{stat.value}</p>
          <p className="text-xs text-[var(--dev-text-muted)] uppercase tracking-wider">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
