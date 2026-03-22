import { motion } from 'framer-motion';
import { AlertTriangle, Palette } from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { CSSAnalysis } from '@/types';

interface CSSSectionProps {
  analysis?: CSSAnalysis;
}

export function CSSSection({ analysis }: CSSSectionProps): React.ReactNode {
  if (analysis === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No CSS analysis data available</p>
      </motion.div>
    );
  }

  const { totalRules, unusedRules, inlineStyles, importantCount, unusedSelectors, warnings } = analysis;

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUpVariants}>
        <ModernCard className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6">
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <p className="text-2xl font-bold text-[var(--dev-text)]">{totalRules.toLocaleString()}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Total Rules</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-warning)]/10">
            <p className="text-2xl font-bold text-[var(--dev-warning)]">{unusedRules}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Unused Rules</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-info)]/10">
            <p className="text-2xl font-bold text-[var(--dev-info)]">{inlineStyles}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Inline Styles</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-danger)]/10">
            <p className="text-2xl font-bold text-[var(--dev-danger)]">{importantCount}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">!important</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <p className="text-2xl font-bold text-[var(--dev-text)]">{unusedSelectors.length}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Unused Selectors</p>
          </div>
        </ModernCard>
      </motion.div>

      {unusedSelectors.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Unused Selectors"
                subtitle={`${unusedSelectors.length} selectors not found in DOM`}
                icon={<Palette className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="flex flex-wrap gap-2">
              {unusedSelectors.slice(0, 20).map((selector, index) => (
                <code key={index} className="px-2 py-1 rounded bg-[var(--dev-bg)] text-sm text-[var(--dev-text)]">
                  {selector}
                </code>
              ))}
              {unusedSelectors.length > 20 && (
                <span className="text-sm text-[var(--dev-text-muted)]">+{unusedSelectors.length - 20} more</span>
              )}
            </div>
          </ModernCard>
        </motion.div>
      )}

      {warnings.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="CSS Warnings"
                subtitle={`${warnings.length} potential issues`}
                icon={<AlertTriangle className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="p-3 rounded-lg bg-[var(--dev-warning)]/5">
                  <p className="text-sm text-[var(--dev-text)]">{warning.message}</p>
                  <p className="text-xs text-[var(--dev-text-muted)]">{warning.selector ?? 'unknown'}</p>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.section>
  );
}
