import { motion } from 'framer-motion';
import { AlertCircle, Clock, Globe, Network } from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { NetworkAnalysis } from '@/types';

interface NetworkSectionProps {
  analysis?: NetworkAnalysis;
}

export function NetworkSection({ analysis }: NetworkSectionProps): React.ReactNode {
  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No network analysis data available</p>
      </motion.div>
    );
  }

  const { hints, missingHints, renderBlocking, criticalCSSSize, score } = analysis;

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Summary */}
      <motion.div variants={fadeUpVariants}>
        <ModernCard className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <div className="text-4xl font-bold text-[var(--dev-text)]">{score}</div>
            <div className="text-xs text-[var(--dev-text-muted)]">Score</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-info)]/10">
            <Network className="w-8 h-8 mx-auto mb-2 text-[var(--dev-info)]" />
            <p className="text-2xl font-bold text-[var(--dev-info)]">{hints.length}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Resource Hints</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-warning)]/10">
            <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--dev-warning)]" />
            <p className="text-2xl font-bold text-[var(--dev-warning)]">{renderBlocking.length}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Render Blocking</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <Globe className="w-8 h-8 mx-auto mb-2 text-[var(--dev-accent)]" />
            <p className="text-2xl font-bold text-[var(--dev-text)]">{(criticalCSSSize / 1024).toFixed(1)}KB</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Critical CSS</p>
          </div>
        </ModernCard>
      </motion.div>

      {/* Resource Hints */}
      {hints.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Resource Hints"
                subtitle="Preload and prefetch directives"
                icon={<Network className="w-5 h-5 text-[var(--dev-info)]" />}
              />
            }
          >
            <div className="space-y-2">
              {hints.map((hint, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <AnimatedBadge variant="info" size="sm">{hint.type}</AnimatedBadge>
                  <code className="text-sm text-[var(--dev-text)] flex-1 truncate">{hint.href}</code>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}

      {/* Render Blocking */}
      {renderBlocking.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            className="border-l-4 border-l-[var(--dev-warning)]"
            header={
              <CardHeader
                title="Render Blocking Resources"
                subtitle="Resources blocking initial render"
                icon={<AlertCircle className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-2">
              {renderBlocking.map((resource, index) => (
                <div key={index} className="p-3 rounded-lg bg-[var(--dev-warning)]/5">
                  <code className="text-sm text-[var(--dev-text)]">{resource.path}</code>
                  <p className="text-xs text-[var(--dev-text-muted)]">{resource.type} • {resource.reason}</p>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}

      {/* Missing Hints */}
      {missingHints.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Missing Resource Hints"
                subtitle="Consider adding these optimizations"
                icon={<Globe className="w-5 h-5 text-[var(--dev-accent)]" />}
              />
            }
          >
            <div className="space-y-2">
              {missingHints.map((hint, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <Clock className="w-5 h-5 text-[var(--dev-warning)]" />
                  <span className="text-sm text-[var(--dev-text)]">{hint}</span>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.section>
  );
}
