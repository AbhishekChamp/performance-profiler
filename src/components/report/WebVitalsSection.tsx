import type { WebVitalsAnalysis, WebVitalMetric } from '@/types';
import { Activity, AlertCircle, CheckCircle, Gauge, Info } from 'lucide-react';

interface WebVitalsSectionProps {
  webVitals: WebVitalsAnalysis;
}

function getScoreBadge(score: WebVitalMetric['score']) {
  switch (score) {
    case 'good':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
          <CheckCircle className="w-3 h-3" />
          Good
        </span>
      );
    case 'needs-improvement':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
          <AlertCircle className="w-3 h-3" />
          Needs Improvement
        </span>
      );
    case 'poor':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
          <AlertCircle className="w-3 h-3" />
          Poor
        </span>
      );
  }
}

function getMetricInfo(name: WebVitalMetric['name']) {
  switch (name) {
    case 'LCP':
      return {
        title: 'Largest Contentful Paint',
        description: 'Measures loading performance. Should occur within 2.5s of page load.',
        thresholds: 'Good: ≤2.5s, Needs Improvement: ≤4s, Poor: >4s',
      };
    case 'FID':
      return {
        title: 'First Input Delay',
        description: 'Measures interactivity. Should be less than 100ms.',
        thresholds: 'Good: ≤100ms, Needs Improvement: ≤300ms, Poor: >300ms',
      };
    case 'CLS':
      return {
        title: 'Cumulative Layout Shift',
        description: 'Measures visual stability. Should be less than 0.1.',
        thresholds: 'Good: ≤0.1, Needs Improvement: ≤0.25, Poor: >0.25',
      };
    case 'FCP':
      return {
        title: 'First Contentful Paint',
        description: 'Measures when first content appears. Should be under 1.8s.',
        thresholds: 'Good: ≤1.8s, Needs Improvement: ≤3s, Poor: >3s',
      };
    case 'TTFB':
      return {
        title: 'Time to First Byte',
        description: 'Measures server response time. Should be under 600ms.',
        thresholds: 'Good: ≤600ms, Needs Improvement: ≤1000ms, Poor: >1000ms',
      };
    case 'INP':
      return {
        title: 'Interaction to Next Paint',
        description: 'Measures responsiveness. Should be under 200ms.',
        thresholds: 'Good: ≤200ms, Needs Improvement: ≤500ms, Poor: >500ms',
      };
  }
}

export function WebVitalsSection({ webVitals }: WebVitalsSectionProps) {
  const { metrics, overallScore, criticalIssues, recommendations } = webVitals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Gauge className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">Web Vitals</h2>
      </div>

      {/* Overall Score */}
      <div className="dev-panel p-6">
        <div className="flex items-center gap-6">
          <div className={`
            w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold
            ${overallScore >= 90 ? 'bg-green-500/20 text-green-400' :
              overallScore >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
              overallScore >= 50 ? 'bg-orange-500/20 text-orange-400' :
              'bg-red-500/20 text-red-400'}
          `}>
            {overallScore}
          </div>
          <div>
            <h3 className="text-lg font-medium text-dev-text">Overall Web Vitals Score</h3>
            <p className="text-sm text-dev-text-muted mt-1">
              Based on estimated Core Web Vitals metrics
            </p>
            {criticalIssues.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {criticalIssues.length} critical metrics need attention
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const info = getMetricInfo(metric.name);
          return (
            <div key={metric.name} className="dev-panel p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-dev-text">{metric.name}</h4>
                    <span className="text-xs text-dev-text-subtle">{info.title}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`
                      text-2xl font-mono font-semibold
                      ${metric.score === 'good' ? 'text-green-400' :
                        metric.score === 'needs-improvement' ? 'text-yellow-400' :
                        'text-red-400'}
                    `}>
                      {metric.value}
                      <span className="text-sm text-dev-text-subtle ml-1">{metric.unit}</span>
                    </span>
                  </div>
                </div>
                {getScoreBadge(metric.score)}
              </div>

              <p className="text-xs text-dev-text-muted mb-2">{info.description}</p>
              <p className="text-xs text-dev-text-subtle">{info.thresholds}</p>

              {metric.factors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dev-border">
                  <div className="flex items-center gap-1 text-xs text-dev-text-muted mb-1">
                    <Activity className="w-3 h-3" />
                    Factors affecting this metric:
                  </div>
                  <ul className="text-xs text-dev-text-subtle space-y-1">
                    {metric.factors.slice(0, 3).map((factor, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-dev-accent">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-dev-accent" />
            Recommendations
          </h3>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-dev-text-muted">
                <span className="text-dev-accent mt-1">→</span>
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
