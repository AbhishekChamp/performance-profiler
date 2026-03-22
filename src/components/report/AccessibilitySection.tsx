import { motion } from 'framer-motion';
import { 
  Accessibility, 
  AlertCircle, 
  CheckCircle, 
  ChevronDown,
  ChevronUp,
  Code,
  Eye,
  Info,
  MousePointer,
  Shield,
  Volume2
} from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import { useState } from 'react';
import type { A11yViolation, AccessibilityAnalysis } from '@/types';

interface AccessibilitySectionProps {
  analysis?: AccessibilityAnalysis;
}

const WCAG_LEVELS = {
  A: { label: 'Level A', color: 'var(--dev-warning)', description: 'Minimum accessibility' },
  AA: { label: 'Level AA', color: 'var(--dev-success)', description: 'Industry standard' },
  AAA: { label: 'Level AAA', color: 'var(--dev-accent)', description: 'Enhanced accessibility' },
};

const SEVERITY_CONFIG = {
  critical: { color: 'var(--dev-danger)', bg: 'bg-[var(--dev-danger)]/10', icon: AlertCircle, badge: 'danger' },
  serious: { color: 'var(--dev-warning)', bg: 'bg-[var(--dev-warning)]/10', icon: AlertCircle, badge: 'warning' },
  moderate: { color: 'var(--dev-info)', bg: 'bg-[var(--dev-info)]/10', icon: Info, badge: 'info' },
  minor: { color: 'var(--dev-text-muted)', bg: 'bg-[var(--dev-text-subtle)]/10', icon: Info, badge: 'default' },
} as const;

const VIOLATION_CATEGORIES = [
  { icon: Eye, label: 'Visual', rules: ['color-contrast', 'image-alt', 'visual'] },
  { icon: MousePointer, label: 'Interactive', rules: ['keyboard', 'focus', 'interactive'] },
  { icon: Volume2, label: 'Screen Reader', rules: ['aria', 'label', 'screen-reader'] },
  { icon: Code, label: 'Structure', rules: ['structure', 'heading', 'landmark'] },
];

function categorizeViolation(violation: A11yViolation): string {
  const rule = violation.rule.toLowerCase();
  for (const cat of VIOLATION_CATEGORIES) {
    if (cat.rules.some(r => rule.includes(r))) return cat.label;
  }
  return 'Other';
}

function ViolationCard({ violation, index }: { violation: A11yViolation; index: number }): React.ReactNode {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[violation.severity];
  const Icon = config.icon;
  const category = categorizeViolation(violation);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl overflow-hidden border border-[var(--dev-border)] ${config.bg}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-[var(--dev-surface-hover)]/50 transition-colors"
      >
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: config.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <AnimatedBadge variant={config.badge as 'danger' | 'warning' | 'info' | 'default'}>
              {violation.severity}
            </AnimatedBadge>
            <AnimatedBadge variant="default" size="sm">{category}</AnimatedBadge>
            <AnimatedBadge variant="default" size="sm">WCAG {violation.wcagLevel}</AnimatedBadge>
          </div>
          <p className="mt-2 text-sm font-medium text-[var(--dev-text)]">{violation.message}</p>
          <p className="text-xs text-[var(--dev-text-muted)] truncate">{violation.element}</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--dev-text-muted)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--dev-text-muted)]" />
        )}
      </button>
      
      {expanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="px-4 pb-4 border-t border-[var(--dev-border)]/50"
        >
          <div className="pt-3 space-y-3">
            <div>
              <p className="text-xs text-[var(--dev-text-muted)] uppercase tracking-wider mb-1">Rule</p>
              <p className="text-sm text-[var(--dev-text)] font-mono">{violation.rule}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--dev-text-muted)] uppercase tracking-wider mb-1">Element</p>
              <code className="text-xs text-[var(--dev-text)] bg-[var(--dev-bg)] px-2 py-1 rounded block overflow-x-auto">
                {violation.element}
              </code>
            </div>
            <div>
              <p className="text-xs text-[var(--dev-text-muted)] uppercase tracking-wider mb-1">Suggested Fix</p>
              <p className="text-sm text-[var(--dev-text)]">{violation.fix}</p>
            </div>
            {violation.code !== undefined && violation.code !== '' && (
              <div>
                <p className="text-xs text-[var(--dev-text-muted)] uppercase tracking-wider mb-1">Code Example</p>
                <pre className="text-xs text-[var(--dev-text)] bg-[var(--dev-bg)] p-3 rounded-lg overflow-x-auto">
                  {violation.code}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function AccessibilitySection({ analysis }: AccessibilitySectionProps): React.ReactNode {
  if (analysis === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <Accessibility className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No accessibility analysis data available</p>
      </motion.div>
    );
  }

  const { score, violations, passed, wcagLevel, stats } = analysis;
  const wcagInfo = WCAG_LEVELS[wcagLevel];

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUpVariants}>
        <ModernCard className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--dev-accent)]/5 via-transparent to-[var(--dev-success)]/5 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-4">
            <ScoreDisplay 
              score={score} 
              size="lg"
              label="Accessibility Score"
              animate
            />

            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-[var(--dev-danger)]/10">
                  <p className="text-2xl font-bold text-[var(--dev-danger)]">{stats.critical}</p>
                  <p className="text-xs text-[var(--dev-text-muted)]">Critical</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--dev-warning)]/10">
                  <p className="text-2xl font-bold text-[var(--dev-warning)]">{stats.serious}</p>
                  <p className="text-xs text-[var(--dev-text-muted)]">Serious</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--dev-info)]/10">
                  <p className="text-2xl font-bold text-[var(--dev-info)]">{stats.moderate}</p>
                  <p className="text-xs text-[var(--dev-text-muted)]">Moderate</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--dev-success)]/10">
                  <p className="text-2xl font-bold text-[var(--dev-success)]">{passed.length}</p>
                  <p className="text-xs text-[var(--dev-text-muted)]">Passed</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-[var(--dev-text-muted)]">WCAG Compliance:</span>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: wcagInfo.color, color: '#fff' }}
                >
                  {wcagInfo.label}
                </span>
                <span className="text-xs text-[var(--dev-text-muted)]">{wcagInfo.description}</span>
              </div>
            </div>
          </div>
        </ModernCard>
      </motion.div>

      {violations.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Violations"
                subtitle={`${violations.length} accessibility issues found`}
                icon={<AlertCircle className="w-5 h-5 text-[var(--dev-danger)]" />}
              />
            }
          >
            <div className="flex flex-wrap gap-2 mb-6">
              {(['critical', 'serious', 'moderate', 'minor'] as const).map(severity => {
                const count = violations.filter(v => v.severity === severity).length;
                if (count === 0) return null;
                const config = SEVERITY_CONFIG[severity];
                return (
                  <AnimatedBadge
                    key={severity}
                    variant={config.badge as 'danger' | 'warning' | 'info' | 'default'}
                    size="md"
                    icon={<config.icon className="w-3 h-3" />}
                  >
                    {count} {severity}
                  </AnimatedBadge>
                );
              })}
            </div>

            <div className="space-y-3">
              {violations.map((violation, index) => (
                <ViolationCard key={index} violation={violation} index={index} />
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}

      {passed.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Passed Checks"
                subtitle={`${passed.length} accessibility requirements met`}
                icon={<CheckCircle className="w-5 h-5 text-[var(--dev-success)]" />}
              />
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {passed.map((check, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[var(--dev-success)]/5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <CheckCircle className="w-4 h-4 text-[var(--dev-success)] flex-shrink-0" />
                  <span className="text-sm text-[var(--dev-text)]">{check}</span>
                </motion.div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}

      <motion.div variants={fadeUpVariants}>
        <ModernCard
          header={
            <CardHeader
              title="Issue Categories"
              subtitle="Violations grouped by type"
              icon={<Shield className="w-5 h-5 text-[var(--dev-accent)]" />}
            />
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {VIOLATION_CATEGORIES.map((cat) => {
              const count = violations.filter(v => categorizeViolation(v) === cat.label).length;
              return (
                <motion.div
                  key={cat.label}
                  className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]"
                  whileHover={{ scale: 1.02 }}
                >
                  <cat.icon className="w-8 h-8 mx-auto mb-2 text-[var(--dev-accent)]" />
                  <p className="text-2xl font-bold text-[var(--dev-text)]">{count}</p>
                  <p className="text-xs text-[var(--dev-text-muted)]">{cat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </ModernCard>
      </motion.div>
    </motion.section>
  );
}
