import { motion } from 'framer-motion';
import { ModernCard } from './ModernCard';

interface LoadingStateProps {
  title?: string;
  description?: string;
  progress?: number;
}

export function LoadingState({ 
  title = 'Loading...', 
  description,
  progress 
}: LoadingStateProps): React.ReactNode {
  return (
    <ModernCard className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="relative w-16 h-16 mb-6">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-[var(--dev-surface-hover)]"
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--dev-accent)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-3 h-3 rounded-full bg-[var(--dev-accent)]" />
        </motion.div>
      </div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg font-medium text-[var(--dev-text)]"
      >
        {title}
      </motion.h3>

      {description !== undefined && description !== '' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-sm text-[var(--dev-text-muted)]"
        >
          {description}
        </motion.p>
      )}

      {progress !== undefined && (
        <div className="w-64 mt-6">
          <div className="h-2 bg-[var(--dev-surface-hover)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--dev-accent)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--dev-text-muted)]">{progress}%</p>
        </div>
      )}

      <div className="flex items-center gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--dev-accent)]"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </ModernCard>
  );
}

interface SkeletonCardProps {
  lines?: number;
}

export function SkeletonCard({ lines = 3 }: SkeletonCardProps): React.ReactNode {
  return (
    <ModernCard className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--dev-surface-hover)] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[var(--dev-surface-hover)] rounded w-1/3 animate-pulse" />
          <div className="h-3 bg-[var(--dev-surface-hover)] rounded w-1/2 animate-pulse" />
        </div>
      </div>
      
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className="h-3 bg-[var(--dev-surface-hover)] rounded animate-pulse"
            style={{ width: `${80 + ((i * 7) % 20)}%` }}
          />
        ))}
      </div>
    </ModernCard>
  );
}
