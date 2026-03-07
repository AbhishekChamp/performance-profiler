import { ScoreGauge } from '@/components/charts/ScoreGauge';
import type { AnalysisReport } from '@/types';
import { AlertTriangle, CheckCircle, Lightbulb, Zap } from 'lucide-react';

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

function getRiskBadge(level: string) {
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

export function OverviewSection({ report }: OverviewSectionProps) {
  const { score, renderRisk, summary, bundle } = report;

  return (
    <div className="space-y-6">
      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="col-span-2 md:col-span-3 lg:col-span-2 dev-panel p-6 flex items-center gap-6">
          <ScoreGauge score={score.overall} size={140} />
          <div>
            <h3 className="text-lg font-semibold text-dev-text mb-1">Overall Score</h3>
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

        <div className="metric-card flex flex-col justify-center">
          <span className="metric-label">Bundle</span>
          <span className="metric-value" style={{ color: score.bundle >= 70 ? '#3fb950' : score.bundle >= 50 ? '#d29922' : '#f85149' }}>
            {score.bundle}
          </span>
        </div>

        <div className="metric-card flex flex-col justify-center">
          <span className="metric-label">DOM</span>
          <span className="metric-value" style={{ color: score.dom >= 70 ? '#3fb950' : score.dom >= 50 ? '#d29922' : '#f85149' }}>
            {score.dom}
          </span>
        </div>

        <div className="metric-card flex flex-col justify-center">
          <span className="metric-label">CSS</span>
          <span className="metric-value" style={{ color: score.css >= 70 ? '#3fb950' : score.css >= 50 ? '#d29922' : '#f85149' }}>
            {score.css}
          </span>
        </div>

        <div className="metric-card flex flex-col justify-center">
          <span className="metric-label">Assets</span>
          <span className="metric-value" style={{ color: score.assets >= 70 ? '#3fb950' : score.assets >= 50 ? '#d29922' : '#f85149' }}>
            {score.assets}
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Risk Analysis */}
      {renderRisk.reasons.length > 0 && (
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-3">Risk Factors</h3>
          <div className="space-y-2">
            {renderRisk.reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-dev-warning mt-0.5 shrink-0" />
                <span className="text-sm text-dev-text-muted">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Recommendations */}
      {summary.optimizations.length > 0 && (
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-3">Top Recommendations</h3>
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
        </div>
      )}
    </div>
  );
}
