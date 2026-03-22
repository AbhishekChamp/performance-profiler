import { motion } from 'framer-motion';
import { Lock, Shield } from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { SecurityAnalysis } from '@/types';

interface SecuritySectionProps {
  analysis?: SecurityAnalysis;
}

export function SecuritySection({ analysis }: SecuritySectionProps): React.ReactNode {
  if (analysis === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No security analysis data available</p>
      </motion.div>
    );
  }

  const { score, vulnerabilities, stats, recommendations } = analysis;

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUpVariants}>
        <ModernCard className="flex flex-col md:flex-row items-center gap-8 p-6">
          <ScoreDisplay score={score} size="lg" label="Security Score" animate />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="text-center p-4 rounded-xl bg-[var(--dev-danger)]/10">
              <p className="text-2xl font-bold text-[var(--dev-danger)]">{stats.critical}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Critical</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-warning)]/10">
              <p className="text-2xl font-bold text-[var(--dev-warning)]">{stats.high}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">High</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-info)]/10">
              <p className="text-2xl font-bold text-[var(--dev-info)]">{stats.medium}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Medium</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-text-subtle)]/10">
              <p className="text-2xl font-bold text-[var(--dev-text-muted)]">{stats.low}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Low</p>
            </div>
          </div>
        </ModernCard>
      </motion.div>

      {vulnerabilities.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            className="border-l-4 border-l-[var(--dev-danger)]"
            header={
              <CardHeader
                title="Security Vulnerabilities"
                subtitle={`${vulnerabilities.length} issues found`}
                icon={<Lock className="w-5 h-5 text-[var(--dev-danger)]" />}
              />
            }
          >
            <div className="space-y-2">
              {vulnerabilities.map((vuln, index) => (
                <div key={index} className="p-3 rounded-lg bg-[var(--dev-danger)]/5">
                  <div className="flex items-center gap-2 mb-1">
                    <AnimatedBadge 
                      variant={vuln.severity === 'critical' ? 'danger' : vuln.severity === 'high' ? 'warning' : 'info'} 
                      size="sm"
                    >
                      {vuln.severity}
                    </AnimatedBadge>
                    <span className="text-sm font-medium text-[var(--dev-text)]">{vuln.type}</span>
                  </div>
                  <p className="text-xs text-[var(--dev-text-muted)]">{vuln.message}</p>
                  <code className="text-xs text-[var(--dev-text-subtle)] block mt-1">{vuln.file}:{vuln.line}</code>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}

      {recommendations.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Security Recommendations"
                subtitle="Best practices to improve security"
                icon={<Shield className="w-5 h-5 text-[var(--dev-accent)]" />}
              />
            }
          >
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <Shield className="w-5 h-5 text-[var(--dev-success)]" />
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
