import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, FileType, Settings } from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { TypeScriptAnalysis } from '@/types';

interface TypeScriptSectionProps {
  analysis?: TypeScriptAnalysis;
}

export function TypeScriptSection({ analysis }: TypeScriptSectionProps): React.ReactNode {
  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <FileType className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No TypeScript analysis data available</p>
      </motion.div>
    );
  }

  const { score, strictMode, anyCount, typeCoverage, issues, tsConfigChecks, recommendations } = analysis;

  const warnings = issues.filter(i => i.severity === 'warning');
  const info = issues.filter(i => i.severity === 'info');

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
          <ScoreDisplay score={score} size="lg" label="TypeScript Score" animate />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
              <p className="text-2xl font-bold text-[var(--dev-text)]">{strictMode ? '✓' : '✗'}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Strict Mode</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-warning)]/10">
              <p className="text-2xl font-bold text-[var(--dev-warning)]">{anyCount}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">any Types</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-success)]/10">
              <p className="text-2xl font-bold text-[var(--dev-success)]">{typeCoverage.toFixed(0)}%</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Type Coverage</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-info)]/10">
              <p className="text-2xl font-bold text-[var(--dev-info)]">{issues.length}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Issues</p>
            </div>
          </div>
        </ModernCard>
      </motion.div>

      {/* tsconfig.json Checks */}
      <motion.div variants={fadeUpVariants}>
        <ModernCard
          header={
            <CardHeader
              title="TSConfig Checks"
              subtitle="Compiler configuration validation"
              icon={<Settings className="w-5 h-5 text-[var(--dev-accent)]" />}
            />
          }
        >
          <div className="space-y-2">
            {tsConfigChecks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                <span className="text-sm text-[var(--dev-text)]">{check.option}</span>
                <div className="flex items-center gap-2">
                  <AnimatedBadge variant={check.enabled ? 'success' : check.severity === 'error' ? 'danger' : 'warning'} size="sm">
                    {check.enabled ? 'Enabled' : 'Disabled'}
                  </AnimatedBadge>
                  {!check.enabled && check.recommended && (
                    <span className="text-xs text-[var(--dev-warning)]">(recommended)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ModernCard>
      </motion.div>

      {/* Issues */}
      {issues.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Type Issues"
                subtitle={`${warnings.length} warnings, ${info.length} info`}
                icon={<AlertTriangle className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <span className="text-sm text-[var(--dev-text)]">{issue.message}</span>
                  <AnimatedBadge variant={issue.severity === 'warning' ? 'warning' : 'info'} size="sm">
                    {issue.severity}
                  </AnimatedBadge>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Recommendations"
                subtitle="TypeScript best practices"
                icon={<CheckCircle className="w-5 h-5 text-[var(--dev-success)]" />}
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
