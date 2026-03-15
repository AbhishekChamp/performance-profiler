import { ScoreGauge } from '@/components/charts/ScoreGauge';
import type { AnalysisReport } from '@/types';
import { Accessibility, AlertTriangle, CheckCircle, Gauge, Lightbulb, Search, Shield, Zap } from 'lucide-react';

interface OverviewSectionProps {
  report: AnalysisReport;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getRiskBadge(level: string): React.ReactNode {
  switch (level) {
    case 'low':
      return <span className="status-badge-success">Low Risk</span>;
    case 'medium':
      return <span className="status-badge-warning">Medium Risk</span>;
    case 'high':
      return <span className="status-badge-danger">High Risk</span>;
    case 'critical':
      return <span className="status-badge-danger">Critical</span>;
    default:
      return null;
  }
}

function ScoreCard({ 
  label, 
  score, 
  icon: Icon 
}: { 
  label: string; 
  score: number | undefined; 
  icon: React.ElementType;
}): React.ReactNode {
  if (score === undefined) return null;
  
  return (
    <div className="metric-card flex flex-col justify-center">
      <div className="flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3 text-dev-text-subtle" />
        <span className="metric-label text-xs">{label}</span>
      </div>
      <span className="metric-value" style={{ 
        color: score >= 70 ? '#3fb950' : score >= 50 ? '#d29922' : '#f85149' 
      }}>
        {score}
      </span>
    </div>
  );
}

export function OverviewSection({ report }: OverviewSectionProps): React.ReactNode {
  const { score, renderRisk, summary, bundle, webVitals } = report;

  return (
    <section aria-labelledby="overview-heading" className="space-y-6">
      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="col-span-2 dev-panel p-6 flex items-center gap-6">
          <ScoreGauge score={score.overall} size={140} aria-label={`Overall performance score: ${score.overall} out of 100`} />
          <div>
            <h2 id="overview-heading" className="text-lg font-semibold text-dev-text mb-1">Overall Score</h2>
            <p className="text-sm text-dev-text-muted mb-3">
              {score.overall >= 70 
                ? 'Performance is good' 
                : score.overall >= 50 
                  ? 'Some improvements needed'
                  : 'Significant issues detected'
              }
            </p>
            <div className="flex items-center gap-2">
              {getRiskBadge(renderRisk.level)}
            </div>
          </div>
        </div>

        <ScoreCard label="Bundle" score={score.bundle} icon={Zap} />
        <ScoreCard label="DOM" score={score.dom} icon={CheckCircle} />
        <ScoreCard label="CSS" score={score.css} icon={CheckCircle} />
        <ScoreCard label="Assets" score={score.assets} icon={CheckCircle} />
        <ScoreCard label="JavaScript" score={score.javascript} icon={CheckCircle} />
        <ScoreCard label="Web Vitals" score={score.webVitals} icon={Gauge} />
        <ScoreCard label="Accessibility" score={score.accessibility} icon={Accessibility} />
        <ScoreCard label="SEO" score={score.seo} icon={Search} />
        <ScoreCard label="Security" score={score.security} icon={Shield} />
      </div>

      {/* Web Vitals Quick View */}
      {webVitals && (
        <section aria-labelledby="webvitals-heading" className="dev-panel p-4">
          <h3 id="webvitals-heading" className="text-sm font-semibold text-dev-text mb-3 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-dev-accent" aria-hidden="true" />
            Web Vitals Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {webVitals.metrics.map((metric) => (
              <div key={metric.name} className="text-center">
                <div className={`
                  text-2xl font-mono font-semibold
                  ${metric.score === 'good' ? 'text-green-400' :
                    metric.score === 'needs-improvement' ? 'text-yellow-400' :
                    'text-red-400'}
                `}>
                  {metric.value}
                  <span className="text-xs text-dev-text-subtle ml-0.5">{metric.unit}</span>
                </div>
                <div className="text-xs text-dev-text-muted">{metric.name}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Summary Stats */}
      <section aria-label="Summary statistics" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="dev-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dev-surface-hover flex items-center justify-center">
              <Zap className="w-5 h-5 text-dev-warning" />
            </div>
            <div>
              <p className="text-2xl font-mono font-semibold text-dev-text">{summary.totalIssues}</p>
              <p className="text-xs text-dev-text-muted">Total Issues</p>
            </div>
          </div>
        </div>

        <div className="dev-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dev-danger/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-dev-danger-bright" />
            </div>
            <div>
              <p className="text-2xl font-mono font-semibold text-dev-danger-bright">{summary.criticalIssues}</p>
              <p className="text-xs text-dev-text-muted">Critical</p>
            </div>
          </div>
        </div>

        <div className="dev-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dev-accent/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-dev-accent" />
            </div>
            <div>
              <p className="text-2xl font-mono font-semibold text-dev-text">{summary.optimizations.length}</p>
              <p className="text-xs text-dev-text-muted">Optimizations</p>
            </div>
          </div>
        </div>

        <div className="dev-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dev-surface-hover flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-dev-success-bright" />
            </div>
            <div>
              <p className="text-2xl font-mono font-semibold text-dev-text">
                {bundle ? formatBytes(bundle.totalSize) : '—'}
              </p>
              <p className="text-xs text-dev-text-muted">Bundle Size</p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Status Summary -->
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {accessibility && (
          <div className={`dev-panel p-4 border-l-4 ${
            accessibility.score >= 80 ? 'border-green-400' : 
            accessibility.score >= 60 ? 'border-yellow-400' : 'border-red-400'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Accessibility className="w-4 h-4 text-dev-accent" />
              <span className="text-xs text-dev-text-muted">Accessibility</span>
            </div>
            <p className="text-lg font-semibold text-dev-text">{accessibility.score}/100</p>
            <p className="text-xs text-dev-text-subtle">WCAG {accessibility.wcagLevel}</p>
          </div>
        )}
        
        {seo && (
          <div className={`dev-panel p-4 border-l-4 ${
            seo.score >= 80 ? 'border-green-400' : 
            seo.score >= 60 ? 'border-yellow-400' : 'border-red-400'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-4 h-4 text-dev-accent" />
              <span className="text-xs text-dev-text-muted">SEO</span>
            </div>
            <p className="text-lg font-semibold text-dev-text">{seo.score}/100</p>
            <p className="text-xs text-dev-text-subtle">
              {seo.issues.length} {seo.issues.length === 1 ? 'issue' : 'issues'}
            </p>
          </div>
        )}
        
        {security && (
          <div className={`dev-panel p-4 border-l-4 ${
            security.score >= 80 ? 'border-green-400' : 
            security.score >= 60 ? 'border-yellow-400' : 
            security.score >= 40 ? 'border-orange-400' : 'border-red-400'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-dev-accent" />
              <span className="text-xs text-dev-text-muted">Security</span>
            </div>
            <p className="text-lg font-semibold text-dev-text">{security.score}/100</p>
            <p className="text-xs text-dev-text-subtle">
              {security.stats.critical + security.stats.high} high severity
            </p>
          </div>
        )}
        
        {webVitals && (
          <div className={`dev-panel p-4 border-l-4 ${
            webVitals.overallScore >= 80 ? 'border-green-400' : 
            webVitals.overallScore >= 60 ? 'border-yellow-400' : 'border-red-400'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-4 h-4 text-dev-accent" />
              <span className="text-xs text-dev-text-muted">Web Vitals</span>
            </div>
            <p className="text-lg font-semibold text-dev-text">{webVitals.overallScore}/100</p>
            <p className="text-xs text-dev-text-subtle">
              {webVitals.criticalIssues.length} critical
            </p>
          </div>
        )}
      </div>

      {/* Risk Analysis -->
      {renderRisk.reasons.length > 0 && (
        <section aria-labelledby="risk-heading" className="dev-panel p-4">
          <h3 id="risk-heading" className="text-sm font-semibold text-dev-text mb-3">Risk Factors</h3>
          <div className="space-y-2">
            {renderRisk.reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-dev-warning mt-0.5 shrink-0" />
                <span className="text-sm text-dev-text-muted">{reason}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Recommendations */}
      {summary.optimizations.length > 0 && (
        <section aria-labelledby="recommendations-heading" className="dev-panel p-4">
          <h3 id="recommendations-heading" className="text-sm font-semibold text-dev-text mb-3">Top Recommendations</h3>
          <div className="space-y-3">
            {summary.optimizations.slice(0, 5).map((opt, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-dev-surface-hover rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  opt.impact === 'high' ? 'bg-dev-danger' : 
                  opt.impact === 'medium' ? 'bg-dev-warning' : 'bg-dev-accent'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-dev-text">{opt.title}</p>
                  <p className="text-xs text-dev-text-muted mt-1">{opt.description}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  opt.impact === 'high' ? 'bg-dev-danger/10 text-dev-danger-bright' :
                  opt.impact === 'medium' ? 'bg-dev-warning/10 text-dev-warning-bright' :
                  'bg-dev-accent/10 text-dev-accent'
                }`}>
                  {opt.impact} impact
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
