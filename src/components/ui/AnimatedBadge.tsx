import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, InfoIcon, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface AnimatedBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  pulse?: boolean;
  glow?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)] border-[var(--dev-border)]',
  success: 'bg-[var(--dev-success)]/10 text-[var(--dev-success)] border-[var(--dev-success)]/30',
  warning: 'bg-[var(--dev-warning)]/10 text-[var(--dev-warning)] border-[var(--dev-warning)]/30',
  danger: 'bg-[var(--dev-danger)]/10 text-[var(--dev-danger)] border-[var(--dev-danger)]/30',
  info: 'bg-[var(--dev-accent)]/10 text-[var(--dev-accent)] border-[var(--dev-accent)]/30',
  neutral: 'bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)] border-[var(--dev-border)]',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function AnimatedBadge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  pulse = false,
  glow = false,
  className = '',
}: AnimatedBadgeProps): React.ReactNode {
  const baseStyles = 'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all';
  const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <motion.span
      className={styles}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      {...(pulse && {
        animate: { opacity: 1, scale: [1, 1.02, 1] },
        transition: { repeat: Infinity, duration: 2 },
      })}
      style={glow ? { boxShadow: `0 0 10px currentColor` } : undefined}
    >
      {icon}
      {children}
    </motion.span>
  );
}

// Status badge with predefined icons
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const statusIcons: Record<StatusBadgeProps['status'], LucideIcon> = {
  success: CheckCircle,
  warning: AlertTriangle,
  danger: XCircle,
  info: InfoIcon,
  neutral: InfoIcon,
};

export function StatusBadge({ status, children, size = 'md', pulse = false }: StatusBadgeProps): React.ReactNode {
  const Icon = statusIcons[status];
  const variantMap: Record<StatusBadgeProps['status'], BadgeVariant> = {
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info',
    neutral: 'neutral',
  };

  return (
    <AnimatedBadge variant={variantMap[status]} size={size} icon={<Icon className="w-3.5 h-3.5" />} pulse={pulse}>
      {children}
    </AnimatedBadge>
  );
}

// Score badge with color coding
interface ScoreBadgeProps {
  score: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, max = 100, size = 'md' }: ScoreBadgeProps): React.ReactNode {
  let variant: BadgeVariant = 'danger';
  if (score >= 90) variant = 'success';
  else if (score >= 70) variant = 'info';
  else if (score >= 50) variant = 'warning';

  return (
    <AnimatedBadge variant={variant} size={size}>
      {score}/{max}
    </AnimatedBadge>
  );
}

// Trend badge with arrow indicator
interface TrendBadgeProps {
  direction: 'up' | 'down' | 'neutral';
  value: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TrendBadge({ direction, value, size = 'md' }: TrendBadgeProps): React.ReactNode {
  const variant: BadgeVariant = direction === 'up' ? 'success' : direction === 'down' ? 'danger' : 'neutral';
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';

  return (
    <AnimatedBadge variant={variant} size={size}>
      {arrow} {value}
    </AnimatedBadge>
  );
}
