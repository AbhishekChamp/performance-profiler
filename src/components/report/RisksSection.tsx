import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, Lightbulb, ShieldAlert } from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { AnalysisReport } from '@/types';

interface RisksSectionProps {
  report?: AnalysisReport;
}

export function RisksSection({ report }: RisksSectionProps): React.ReactNode {
  if (!report) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No risk analysis data available</p>
      </motion.div>
    );
  }

  const { renderRisk, summary } = report;

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Risk Level */}
      <motion.div variants={fadeUpVariants}>
        <ModernCard className="text-center p-8">
          <ShieldAlert className={`w-16 h-16 mx-auto mb-4 ${
            renderRisk.level === 'low' ? 'text-[var(--dev-success)]' :
            renderRisk.level === 'medium' ? 'text-[var(--dev-warning)]' :
            'text-[var(--dev-danger)]'
          }`} />
          <p className="text-3xl font-bold text-[var(--dev-text)] capitalize">
            {renderRisk.level} Risk
          </p>
          <p className="text-sm text-[var(--dev-text-muted)] mt-2">
            Score: {renderRisk.score}/100
          </p>
          <p className="text-sm text-[var(--dev-text-muted)]">
            {renderRisk.reasons.length} risk factors identified
          </p>
        </ModernCard>
      </motion.div>

      {/* Risk Reasons */}
      {renderRisk.reasons.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Risk Factors"
                subtitle="Performance bottlenecks and concerns"
                icon={<AlertTriangle className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-2">
              {renderRisk.reasons.map((reason, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dev-warning)]/5">
                  <Info className="w-5 h-5 text-[var(--dev-warning)]" />
                  <span className="text-sm text-[var(--dev-text)]">{reason}</span>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}

      {/* Recommendations */}
      {renderRisk.recommendations.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Recommendations"
                subtitle="Actions to reduce risk"
                icon={<Lightbulb className="w-5 h-5 text-[var(--dev-accent)]" />}
              />
            }
          >
            <div className="space-y-2">
              {renderRisk.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <CheckCircle className="w-5 h-5 text-[var(--dev-success)]" />
                  <span className="text-sm text-[var(--dev-text)]">{rec}</span>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}

      {/* Optimizations */}
      {summary.optimizations.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Optimization Opportunities"
                subtitle={`${summary.optimizations.length} potential improvements`}
                icon={<Lightbulb className="w-5 h-5 text-[var(--dev-accent)]" />}
              />
            }
          >
            <div className="space-y-2">
              {summary.optimizations.slice(0, 10).map((opt, index) => (
                <div key={index} className="p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <div className="flex items-center gap-2 mb-1">
                    <AnimatedBadge 
                      variant={opt.impact === 'high' ? 'danger' : opt.impact === 'medium' ? 'warning' : 'info'} 
                      size="sm"
                    >
                      {opt.impact}
                    </AnimatedBadge>
                    <span className="text-sm font-medium text-[var(--dev-text)]">{opt.title}</span>
                  </div>
                  <p className="text-xs text-[var(--dev-text-muted)]">{opt.description}</p>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.section>
  );
}
