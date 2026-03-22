import { motion } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  Gauge, 
  LayoutGrid,
  Minus,
  MousePointer,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { WebVitalsAnalysis } from '@/types';

interface WebVitalsSectionProps {
  analysis?: WebVitalsAnalysis;
}

const THRESHOLDS = {
  LCP: { good: 2.5, poor: 4.0, unit: 's' },
  FID: { good: 100, poor: 300, unit: 'ms' },
  CLS: { good: 0.1, poor: 0.25, unit: '' },
  FCP: { good: 1.8, poor: 3.0, unit: 's' },
  TTFB: { good: 600, poor: 800, unit: 'ms' },
  INP: { good: 200, poor: 500, unit: 'ms' },
  TBT: { good: 200, poor: 600, unit: 'ms' },
} as const;

type WebVitalName = keyof typeof THRESHOLDS;

interface WebVitalData {
  name: WebVitalName;
  value: number;
  category: 'loading' | 'interactivity' | 'visual_stability';
  description: string;
  icon: React.ElementType;
}

const CATEGORIES = {
  loading: { label: 'Loading', color: 'var(--dev-accent)', icon: Clock },
  interactivity: { label: 'Interactivity', color: 'var(--dev-success)', icon: MousePointer },
  visual_stability: { label: 'Visual Stability', color: 'var(--dev-warning)', icon: LayoutGrid },
};

function getVitalStatus(name: WebVitalName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function formatValue(name: WebVitalName, value: number): string {
  const threshold = THRESHOLDS[name];
  if (threshold.unit === 's') return `${value.toFixed(2)}s`;
  if (threshold.unit === 'ms') return `${Math.round(value)}ms`;
  return value.toFixed(3);
}

function VitalCard({ vital, index }: { vital: WebVitalData; index: number }): React.ReactNode {
  const status = getVitalStatus(vital.name, vital.value);
  const threshold = THRESHOLDS[vital.name];
  const maxValue = threshold.poor * 1.2;
  
  const statusConfig = {
    good: { badge: 'success', icon: TrendingUp, text: 'Good' },
    'needs-improvement': { badge: 'warning', icon: Minus, text: 'Needs Improvement' },
    poor: { badge: 'danger', icon: TrendingDown, text: 'Poor' },
  }[status];

  const category = CATEGORIES[vital.category];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      <ModernCard className="p-4 h-full">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20">
              <svg className="transform -rotate-90" width={80} height={80}>
                <circle
                  cx={40}
                  cy={40}
                  r={32}
                  fill="none"
                  stroke="var(--dev-surface-hover)"
                  strokeWidth={8}
                />
                <motion.circle
                  cx={40}
                  cy={40}
                  r={32}
                  fill="none"
                  stroke={status === 'good' ? 'var(--dev-success)' : status === 'needs-improvement' ? 'var(--dev-warning)' : 'var(--dev-danger)'}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 32}
                  initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - Math.min(vital.value / maxValue, 1)) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <vital.icon className="w-4 h-4 mb-0.5 text-[var(--dev-text-muted)]" />
                <span className="text-sm font-bold text-[var(--dev-text)]">
                  {formatValue(vital.name, vital.value)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-[var(--dev-text)]">{vital.name}</span>
              <AnimatedBadge variant={statusConfig.badge as 'success' | 'warning' | 'danger'} size="sm">
                {statusConfig.text}
              </AnimatedBadge>
            </div>
            <p className="text-xs text-[var(--dev-text-muted)] line-clamp-2">{vital.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <category.icon className="w-3 h-3" style={{ color: category.color }} />
              <span className="text-xs" style={{ color: category.color }}>{category.label}</span>
            </div>
          </div>
        </div>
      </ModernCard>
    </motion.div>
  );
}

export function WebVitalsSection({ analysis }: WebVitalsSectionProps): React.ReactNode {
  if (analysis === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <Gauge className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No Web Vitals data available</p>
      </motion.div>
    );
  }

  const { metrics, overallScore, criticalIssues, recommendations } = analysis;

  const vitalData: WebVitalData[] = metrics.map(m => {
    const descriptions: Record<string, string> = {
      LCP: 'Largest Contentful Paint - measures loading performance',
      FID: 'First Input Delay - measures interactivity',
      CLS: 'Cumulative Layout Shift - measures visual stability',
      FCP: 'First Contentful Paint - time to first visible content',
      TTFB: 'Time to First Byte - server response time',
      INP: 'Interaction to Next Paint - responsiveness',
      TBT: 'Total Blocking Time - main thread blocking',
    };

    const categories: Record<string, 'loading' | 'interactivity' | 'visual_stability'> = {
      LCP: 'loading',
      FID: 'interactivity',
      CLS: 'visual_stability',
      FCP: 'loading',
      TTFB: 'loading',
      INP: 'interactivity',
      TBT: 'interactivity',
    };

    const icons: Record<string, React.ElementType> = {
      LCP: Clock,
      FID: MousePointer,
      CLS: LayoutGrid,
      FCP: Zap,
      TTFB: Activity,
      INP: MousePointer,
      TBT: Clock,
    };

    return {
      name: m.name as WebVitalName,
      value: m.value,
      category: categories[m.name] ?? 'loading',
      description: descriptions[m.name] ?? '',
      icon: icons[m.name] ?? Activity,
    };
  });

  const poorVitals = vitalData.filter(v => getVitalStatus(v.name, v.value) === 'poor');
  const needsImprovementVitals = vitalData.filter(v => getVitalStatus(v.name, v.value) === 'needs-improvement');
  const goodVitals = vitalData.filter(v => getVitalStatus(v.name, v.value) === 'good');

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
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="transform -rotate-90" width={128} height={128}>
                  <circle
                    cx={64}
                    cy={64}
                    r={56}
                    fill="none"
                    stroke="var(--dev-surface-hover)"
                    strokeWidth={10}
                  />
                  <motion.circle
                    cx={64}
                    cy={64}
                    r={56}
                    fill="none"
                    stroke={overallScore >= 90 ? 'var(--dev-success)' : overallScore >= 50 ? 'var(--dev-warning)' : 'var(--dev-danger)'}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 56}
                    initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - overallScore / 100) }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-[var(--dev-text)]">{overallScore}</span>
                  <span className="text-xs text-[var(--dev-text-muted)]">/100</span>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--dev-text)]">Overall Score</p>
            </div>

            <div className="flex-1 w-full">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-[var(--dev-success)]/10">
                  <p className="text-2xl font-bold text-[var(--dev-success)]">{goodVitals.length}</p>
                  <p className="text-xs text-[var(--dev-text-muted)]">Good</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--dev-warning)]/10">
                  <p className="text-2xl font-bold text-[var(--dev-warning)]">{needsImprovementVitals.length}</p>
                  <p className="text-xs text-[var(--dev-text-muted)]">Needs Work</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--dev-danger)]/10">
                  <p className="text-2xl font-bold text-[var(--dev-danger)]">{poorVitals.length}</p>
                  <p className="text-xs text-[var(--dev-text-muted)]">Poor</p>
                </div>
              </div>
            </div>
          </div>
        </ModernCard>
      </motion.div>

      {criticalIssues.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            className="border-l-4 border-l-[var(--dev-danger)]"
            header={
              <CardHeader
                title="Critical Issues"
                subtitle={`${criticalIssues.length} issues requiring immediate attention`}
                icon={<Gauge className="w-5 h-5 text-[var(--dev-danger)]" />}
              />
            }
          >
            <div className="space-y-2">
              {criticalIssues.map((issue, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dev-danger)]/5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TrendingDown className="w-5 h-5 text-[var(--dev-danger)]" />
                  <span className="text-sm text-[var(--dev-text)]">{issue}</span>
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
              title="Core Web Vitals"
              subtitle="Detailed metrics breakdown"
              icon={<Gauge className="w-5 h-5 text-[var(--dev-accent)]" />}
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vitalData.map((vital, index) => (
              <VitalCard key={vital.name} vital={vital} index={index} />
            ))}
          </div>
        </ModernCard>
      </motion.div>

      {recommendations.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Recommendations"
                subtitle={`${recommendations.length} suggestions to improve performance`}
                icon={<Zap className="w-5 h-5 text-[var(--dev-accent)]" />}
              />
            }
          >
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[var(--dev-surface-hover)] hover:bg-[var(--dev-surface-hover)]/80 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Zap className="w-5 h-5 text-[var(--dev-accent)] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[var(--dev-text)]">{rec}</span>
                </motion.div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.section>
  );
}
