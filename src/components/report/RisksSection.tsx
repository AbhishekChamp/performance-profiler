import { AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import type { Optimization, RenderRisk } from '@/types';

interface RisksSectionProps {
  risk: RenderRisk;
  optimizations: Optimization[];
}

function getRiskColor(level: RenderRisk['level']): string {
  switch (level) {
    case 'low': return '#3fb950';
    case 'medium': return '#d29922';
    case 'high': return '#f85149';
    case 'critical': return '#da3633';
    default: return '#8b949e';
  }
}

function getImpactColor(impact: Optimization['impact']): string {
  switch (impact) {
    case 'high': return 'bg-dev-danger/10 text-dev-danger-bright border-dev-danger/30';
    case 'medium': return 'bg-dev-warning/10 text-dev-warning-bright border-dev-warning/30';
    case 'low': return 'bg-dev-accent/10 text-dev-accent border-dev-accent/30';
    default: return 'bg-dev-accent/10 text-dev-accent border-dev-accent/30';
  }
}

function getEffortColor(effort: Optimization['effort']): string {
  switch (effort) {
    case 'high': return 'text-dev-danger-bright';
    case 'medium': return 'text-dev-warning-bright';
    case 'low': return 'text-dev-success-bright';
    default: return 'text-dev-text-muted';
  }
}

export function RisksSection({ risk, optimizations }: RisksSectionProps): React.ReactNode {
  const riskColor = getRiskColor(risk.level);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">Risk Analysis</h2>
      </div>

      {/* Risk Score */}
      <div className="dev-panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-dev-text-muted mb-1">Render Risk Score</h3>
            <div className="flex items-baseline gap-3">
              <span 
                className="text-4xl font-mono font-bold"
                style={{ color: riskColor }}
              >
                {risk.score}
              </span>
              <span 
                className="text-lg font-medium px-3 py-1 rounded"
                style={{ 
                  backgroundColor: `${riskColor}20`,
                  color: riskColor,
                  border: `1px solid ${riskColor}40`
                }}
              >
                {risk.level.toUpperCase()}
              </span>
            </div>
          </div>
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${riskColor}15` }}
          >
            <AlertTriangle className="w-10 h-10" style={{ color: riskColor }} />
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {risk.reasons.length > 0 && (
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-4">Risk Factors</h3>
          <div className="space-y-3">
            {risk.reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-dev-surface-hover rounded-lg">
                <AlertTriangle className="w-5 h-5 text-dev-warning shrink-0 mt-0.5" />
                <span className="text-sm text-dev-text">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {risk.recommendations.length > 0 && (
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-4">Recommendations</h3>
          <div className="space-y-3">
            {risk.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-dev-accent/5 rounded-lg border border-dev-accent/20">
                <ArrowRight className="w-5 h-5 text-dev-accent shrink-0 mt-0.5" />
                <span className="text-sm text-dev-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimizations */}
      {optimizations.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text">Optimization Opportunities</h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {optimizations.map((opt, i) => (
              <div key={i} className="px-4 py-4 hover:bg-dev-surface-hover">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-dev-text">{opt.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getImpactColor(opt.impact)}`}>
                        {opt.impact} impact
                      </span>
                    </div>
                    <p className="text-sm text-dev-text-muted mb-2">{opt.description}</p>
                    <p className={`text-xs ${getEffortColor(opt.effort)}`}>
                      Effort: {opt.effort}
                    </p>
                    {opt.code != null && (
                      <pre className="mt-3 p-3 bg-dev-bg rounded text-xs text-dev-text-muted overflow-x-auto">
                        <code>{opt.code}</code>
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
