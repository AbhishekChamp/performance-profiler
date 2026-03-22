import { motion } from 'framer-motion';
import { 
  Accessibility, 
  AlertTriangle, 
  Braces, 
  CheckCircle, 
  Gauge, 
  Layout, 
  Lightbulb, 
  Package,
  Palette,
  Search,
  Shield
} from 'lucide-react';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { CardHeader, CardStats, ModernCard } from '@/components/ui/ModernCard';
import { AnimatedBadge, StatusBadge } from '@/components/ui/AnimatedBadge';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { AnalysisReport } from '@/types';

interface OverviewSectionProps {
  report: AnalysisReport;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-[var(--dev-success)]';
  if (score >= 70) return 'text-[var(--dev-success-bright)]';
  if (score >= 50) return 'text-[var(--dev-warning)]';
  if (score >= 30) return 'text-[var(--dev-warning-bright)]';
  return 'text-[var(--dev-danger)]';
}

function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-[var(--dev-success)]/10';
  if (score >= 70) return 'bg-[var(--dev-success-bright)]/10';
  if (score >= 50) return 'bg-[var(--dev-warning)]/10';
  if (score >= 30) return 'bg-[var(--dev-warning-bright)]/10';
  return 'bg-[var(--dev-danger)]/10';
}

const SCORE_CARDS = [
  { key: 'bundle', label: 'Bundle', icon: Package },
  { key: 'dom', label: 'DOM', icon: Layout },
  { key: 'css', label: 'CSS', icon: Palette },
  { key: 'assets', label: 'Assets', icon: CheckCircle },
  { key: 'javascript', label: 'JavaScript', icon: Braces },
  { key: 'webVitals', label: 'Web Vitals', icon: Gauge },
  { key: 'accessibility', label: 'Accessibility', icon: Accessibility },
  { key: 'seo', label: 'SEO', icon: Search },
  { key: 'security', label: 'Security', icon: Shield },
] as const;

function getWebVitalMetric(webVitals: AnalysisReport['webVitals'], name: string): number | undefined {
  if (webVitals === undefined) return undefined;
  const metric = webVitals.metrics.find(m => m.name === name);
  return metric?.value;
}

export function OverviewSection({ report }: OverviewSectionProps): React.ReactNode {
  const { score, renderRisk, summary, bundle, webVitals } = report;

  const stats = [
    { label: 'Total Issues', value: summary.totalIssues },
    { label: 'Optimizations', value: summary.optimizations.length },
    { label: 'Bundle Size', value: bundle !== undefined ? formatBytes(bundle.totalSize) : 'N/A' },
    { label: 'Modules', value: bundle?.moduleCount ?? 'N/A' },
  ];

  const lcp = getWebVitalMetric(webVitals, 'LCP');
  const fid = getWebVitalMetric(webVitals, 'FID');
  const cls = getWebVitalMetric(webVitals, 'CLS');
  const ttfb = getWebVitalMetric(webVitals, 'TTFB');
  const fcp = getWebVitalMetric(webVitals, 'FCP');
  const inp = getWebVitalMetric(webVitals, 'INP');

  return (
    <motion.section 
      aria-labelledby="overview-heading" 
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
              score={score.overall} 
              size="lg"
              label="Overall Score"
              animate
            />

            <div className="flex-1 w-full">
              <CardStats stats={stats.map(s => ({ ...s, trend: 'neutral' }))} />
              
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-[var(--dev-text-muted)]">Risk Level:</span>
                <StatusBadge status={
                  renderRisk.level === 'low' ? 'success' :
                  renderRisk.level === 'medium' ? 'warning' :
                  renderRisk.level === 'high' ? 'danger' : 'danger'
                }>
                  {renderRisk.level === 'low' ? 'Low Risk' :
                   renderRisk.level === 'medium' ? 'Medium Risk' :
                   renderRisk.level === 'high' ? 'High Risk' : 'Critical'}
                </StatusBadge>
              </div>
            </div>
          </div>
        </ModernCard>
      </motion.div>

      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        variants={staggerContainerVariants}
      >
        {SCORE_CARDS.map((item, index) => {
          const scoreValue = score[item.key as keyof typeof score] as number | undefined;
          if (scoreValue === undefined) return null;
          
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <ModernCard 
                className="text-center p-4 cursor-pointer group"
                glowOnHover
              >
                <motion.div 
                  className={`
                    w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center
                    ${getScoreBgColor(scoreValue)}
                    group-hover:scale-110 transition-transform
                  `}
                >
                  <item.icon className={`w-6 h-6 ${getScoreColor(scoreValue)}`} />
                </motion.div>
                
                <p className="text-2xl font-bold text-[var(--dev-text)]">
                  {scoreValue}
                </p>
                <p className="text-xs text-[var(--dev-text-muted)] uppercase tracking-wider">
                  {item.label}
                </p>
              </ModernCard>
            </motion.div>
          );
        })}
      </motion.div>

      {webVitals !== undefined && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Web Vitals Summary"
                subtitle={`Score: ${webVitals.overallScore}/100`}
                icon={<Gauge className="w-5 h-5 text-[var(--dev-accent)]" />}
              />
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'LCP', value: lcp, unit: 's', threshold: 2.5 },
                { label: 'FID', value: fid, unit: 'ms', threshold: 100 },
                { label: 'CLS', value: cls, unit: '', threshold: 0.1 },
                { label: 'TTFB', value: ttfb, unit: 'ms', threshold: 600 },
                { label: 'FCP', value: fcp, unit: 's', threshold: 1.8 },
                { label: 'INP', value: inp, unit: 'ms', threshold: 200 },
              ].filter(m => m.value !== undefined).map((metric) => {
                const isGood = metric.value !== undefined && metric.value <= metric.threshold;
                return (
                  <motion.div 
                    key={metric.label}
                    className="text-center p-4 rounded-xl bg-[var(--dev-bg)]/50"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-xs text-[var(--dev-text-muted)] uppercase">{metric.label}</p>
                    <p className={`text-xl font-semibold mt-1 ${isGood ? 'text-[var(--dev-success)]' : 'text-[var(--dev-warning)]'}`}>
                      {metric.value}{metric.unit}
                    </p>
                    <AnimatedBadge 
                      variant={isGood ? 'success' : 'warning'} 
                      size="sm"
                      className="mt-2"
                    >
                      {isGood ? 'Good' : 'Poor'}
                    </AnimatedBadge>
                  </motion.div>
                );
              })}
            </div>
          </ModernCard>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Issues Summary"
                subtitle={`${summary.totalIssues} total issues`}
                icon={<AlertTriangle className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-danger)]/10">
                <span className="text-[var(--dev-text)]">Critical</span>
                <AnimatedBadge variant="danger" pulse={summary.criticalIssues > 0}>
                  {summary.criticalIssues}
                </AnimatedBadge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-warning)]/10">
                <span className="text-[var(--dev-text)]">Warnings</span>
                <AnimatedBadge variant="warning">{summary.warnings}</AnimatedBadge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-success)]/10">
                <span className="text-[var(--dev-text)]">Optimization Tips</span>
                <AnimatedBadge variant="success">{summary.optimizations.length}</AnimatedBadge>
              </div>
            </div>
          </ModernCard>
        </motion.div>

        {bundle !== undefined && (
          <motion.div variants={fadeUpVariants}>
            <ModernCard
              header={
                <CardHeader
                  title="Bundle Info"
                  subtitle={`${bundle.moduleCount} modules analyzed`}
                  icon={<Package className="w-5 h-5 text-[var(--dev-accent)]" />}
                />
              }
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <span className="text-[var(--dev-text-muted)]">Total Size</span>
                  <span className="text-[var(--dev-text)]">{formatBytes(bundle.totalSize)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <span className="text-[var(--dev-text-muted)]">Gzipped</span>
                  <span className="text-[var(--dev-text)]">{formatBytes(bundle.gzippedSize)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <span className="text-[var(--dev-text-muted)]">Vendor %</span>
                  <span className={bundle.vendorPercentage > 50 ? 'text-[var(--dev-warning)]' : 'text-[var(--dev-success)]'}>
                    {bundle.vendorPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </ModernCard>
          </motion.div>
        )}
      </div>

      {summary.optimizations.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Top Optimizations"
                subtitle={`${summary.optimizations.length} recommendations`}
                icon={<Lightbulb className="w-5 h-5 text-[var(--dev-accent)]" />}
              />
            }
          >
            <div className="space-y-2">
              {summary.optimizations.slice(0, 5).map((opt, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[var(--dev-surface-hover)] hover:bg-[var(--dev-surface-hover)]/80 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StatusBadge status={opt.impact === 'high' ? 'danger' : opt.impact === 'medium' ? 'warning' : 'info'}>
                    {opt.impact}
                  </StatusBadge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--dev-text)]">{opt.title}</p>
                    <p className="text-xs text-[var(--dev-text-muted)] truncate">{opt.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.section>
  );
}
