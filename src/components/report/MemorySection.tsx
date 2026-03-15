import type { MemoryAnalysis } from '@/types';
import { AlertCircle, AlertTriangle, Brain, CheckCircle, Zap } from 'lucide-react';

interface MemorySectionProps {
  memory: MemoryAnalysis;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getSeverityIcon(severity: string): React.ReactNode {
  switch (severity) {
    case 'high':
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case 'medium':
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    case 'low':
      return <AlertCircle className="w-4 h-4 text-blue-400" />;
    default:
      return <AlertCircle className="w-4 h-4 text-dev-text-muted" />;
  }
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'event-listener': 'Event Listener',
    'closure': 'Closure',
    'global-variable': 'Global Variable',
    'dom-reference': 'DOM Reference',
    'interval': 'Timer/Interval',
  };
  return labels[type] || type;
}

export function MemorySection({ memory }: MemorySectionProps): React.ReactNode {
  const { estimatedHeapSize, leakRisks, highRiskCount, mediumRiskCount, recommendations } = memory;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">Memory Analysis</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Est. Heap Size</span>
          <span className="metric-value">{formatBytes(estimatedHeapSize)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total Risks</span>
          <span className="metric-value">{leakRisks.length}</span>
        </div>
        <div className="metric-card border-red-500/30">
          <span className="metric-label text-red-400">High Risk</span>
          <span className="metric-value text-red-400">{highRiskCount}</span>
        </div>
        <div className="metric-card border-yellow-500/30">
          <span className="metric-label text-yellow-400">Medium Risk</span>
          <span className="metric-value text-yellow-400">{mediumRiskCount}</span>
        </div>
      </div>

      {/* Status */}
      {leakRisks.length === 0 ? (
        <div className="dev-panel border-green-500/30 bg-green-500/5">
          <div className="flex items-center justify-center gap-3 p-8">
            <CheckCircle className="w-12 h-12 text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-green-400">No Memory Leak Risks Detected</h3>
              <p className="text-sm text-dev-text-muted">Your code appears to handle memory properly.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* High Risk Leaks */}
          {highRiskCount > 0 && (
            <div className="dev-panel border-red-500/30">
              <div className="px-4 py-3 border-b border-red-500/30 bg-red-500/5">
                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  High Risk Memory Leaks ({highRiskCount})
                </h3>
              </div>
              <div className="divide-y divide-dev-border-subtle">
                {leakRisks
                  .filter((risk) => risk.severity === 'high')
                  .map((risk, i) => (
                    <div key={i} className="p-4">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(risk.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-dev-text">{getTypeLabel(risk.type)}</span>
                            <span className="text-xs text-dev-text-subtle">
                              {risk.file}:{risk.line}
                            </span>
                          </div>
                          <p className="text-sm text-dev-text-muted mb-2">{risk.description}</p>
                          <div className="flex items-start gap-2 text-sm">
                            <Zap className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <span className="text-dev-text">{risk.fix}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Other Risks */}
          {leakRisks.filter((r) => r.severity !== 'high').length > 0 && (
            <div className="dev-panel">
              <div className="px-4 py-3 border-b border-dev-border">
                <h3 className="text-sm font-semibold text-dev-text">Other Memory Risks</h3>
              </div>
              <div className="divide-y divide-dev-border-subtle">
                {leakRisks
                  .filter((risk) => risk.severity !== 'high')
                  .map((risk, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-dev-text">{getTypeLabel(risk.type)}</span>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(risk.severity)}
                          <span className="text-xs text-dev-text-subtle">
                            {risk.file}:{risk.line}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-dev-text-muted">{risk.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text">Recommendations</h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {recommendations.map((rec, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <Zap className="w-4 h-4 text-dev-accent shrink-0 mt-0.5" />
                <span className="text-sm text-dev-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory Best Practices */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text">Memory Best Practices</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Always remove event listeners</p>
              <p className="text-xs text-dev-text-muted">
                Use removeEventListener or AbortController for cleanup
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Clear intervals and timeouts</p>
              <p className="text-xs text-dev-text-muted">
                Store timer IDs and clear them in cleanup functions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Avoid global variables</p>
              <p className="text-xs text-dev-text-muted">
                Use module scope or state management instead
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Release DOM references</p>
              <p className="text-xs text-dev-text-muted">
                Set DOM element references to null when done
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
