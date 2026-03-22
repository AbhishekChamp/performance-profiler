import { motion } from 'framer-motion';
import { Box, FileX, Search } from 'lucide-react';
import { ModernCard } from './ModernCard';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: 'box' | 'search' | 'file';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const iconMap = {
  box: Box,
  search: Search,
  file: FileX,
};

export function EmptyState({ 
  icon = 'box', 
  title, 
  description,
  actionLabel,
  onAction 
}: EmptyStateProps): React.ReactNode {
  const Icon = iconMap[icon];

  return (
    <ModernCard className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 20 
        }}
        className="relative mb-6"
      >
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[var(--dev-accent)]/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[var(--dev-accent)]/10"
          animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        
        <div className="relative w-20 h-20 rounded-full bg-[var(--dev-surface-hover)] flex items-center justify-center">
          <Icon className="w-10 h-10 text-[var(--dev-accent)]" />
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-[var(--dev-text)]"
      >
        {title}
      </motion.h3>

      {description !== undefined && description !== '' && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-[var(--dev-text-muted)] max-w-sm"
        >
          {description}
        </motion.p>
      )}

      {actionLabel !== undefined && actionLabel !== '' && onAction !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Button onClick={onAction} variant="primary">
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </ModernCard>
  );
}
