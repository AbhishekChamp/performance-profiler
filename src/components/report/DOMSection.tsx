import { motion } from 'framer-motion';
import { AlertTriangle, Info, Layout } from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { DOMAnalysis } from '@/types';

interface DOMSectionProps {
  analysis?: DOMAnalysis;
}

export function DOMSection({ analysis }: DOMSectionProps): React.ReactNode {
  if (analysis === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No DOM analysis data available</p>
      </motion.div>
    );
  }

  const { totalNodes, maxDepth, leafNodes, imagesWithoutLazy, warnings } = analysis;

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUpVariants}>
        <ModernCard className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <p className="text-2xl font-bold text-[var(--dev-text)]">{totalNodes.toLocaleString()}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Total Nodes</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <p className="text-2xl font-bold text-[var(--dev-text)]">{maxDepth}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Max Depth</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <p className="text-2xl font-bold text-[var(--dev-text)]">{leafNodes.toLocaleString()}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Leaf Nodes</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-warning)]/10">
            <p className="text-2xl font-bold text-[var(--dev-warning)]">{imagesWithoutLazy}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">No Lazy Load</p>
          </div>
        </ModernCard>
      </motion.div>

      {warnings.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="DOM Warnings"
                subtitle={`${warnings.length} potential issues`}
                icon={<AlertTriangle className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dev-warning)]/5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Info className="w-5 h-5 text-[var(--dev-warning)]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--dev-text)]">{warning.message}</p>
                    <p className="text-xs text-[var(--dev-text-muted)]">{warning.element}</p>
                  </div>
                  <AnimatedBadge variant="warning" size="sm">{warning.severity}</AnimatedBadge>
                </motion.div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.section>
  );
}
