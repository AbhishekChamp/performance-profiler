import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Type } from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { FontAnalysis } from '@/types';

interface FontsSectionProps {
  analysis?: FontAnalysis;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function FontsSection({ analysis }: FontsSectionProps): React.ReactNode {
  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No font analysis data available</p>
      </motion.div>
    );
  }

  const { fonts, totalFontSize, fontsWithoutDisplay, missingPreloads, recommendations, score } = analysis;

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Score Card */}
      <motion.div variants={fadeUpVariants}>
        <ModernCard className="flex flex-col md:flex-row items-center gap-8 p-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-[var(--dev-text)]">{score}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Score</p>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
              <p className="text-2xl font-bold text-[var(--dev-text)]">{fonts.length}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Total Fonts</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
              <p className="text-2xl font-bold text-[var(--dev-text)]">{formatBytes(totalFontSize)}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Total Size</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-warning)]/10">
              <p className="text-2xl font-bold text-[var(--dev-warning)]">{fontsWithoutDisplay}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">No font-display</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-info)]/10">
              <p className="text-2xl font-bold text-[var(--dev-info)]">{missingPreloads.length}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Missing Preloads</p>
            </div>
          </div>
        </ModernCard>
      </motion.div>

      {/* Font List */}
      <motion.div variants={fadeUpVariants}>
        <ModernCard
          header={
            <CardHeader
              title="Fonts"
              subtitle={`${fonts.length} web fonts loaded`}
              icon={<Type className="w-5 h-5 text-[var(--dev-accent)]" />}
            />
          }
        >
          <div className="space-y-2">
            {fonts.map((font, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                <div>
                  <p className="text-sm font-medium text-[var(--dev-text)]">{font.family}</p>
                  <p className="text-xs text-[var(--dev-text-muted)]">{font.format} • {font.display}</p>
                </div>
                {font.display === 'auto' && (
                  <AnimatedBadge variant="warning" size="sm">No swap</AnimatedBadge>
                )}
              </div>
            ))}
          </div>
        </ModernCard>
      </motion.div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Recommendations"
                subtitle="Font optimization suggestions"
                icon={<AlertTriangle className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <CheckCircle className="w-5 h-5 text-[var(--dev-success)]" />
                  <span className="text-sm text-[var(--dev-text)]">{rec}</span>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.section>
  );
}
