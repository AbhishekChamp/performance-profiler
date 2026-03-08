import type { ThirdPartyAnalysis } from '@/types';
import { ExternalLink, Shield, AlertTriangle, TrendingUp, Clock, Database } from 'lucide-react';

interface ThirdPartySectionProps {
  thirdParty: ThirdPartyAnalysis;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'analytics':
      return 'bg-blue-500/20 text-blue-400';
    case 'advertising':
      return 'bg-red-500/20 text-red-400';
    case 'widget':
      return 'bg-purple-500/20 text-purple-400';
    case 'social':
      return 'bg-pink-500/20 text-pink-400';
    case 'cdn':
      return 'bg-green-500/20 text-green-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

export function ThirdPartySection({ thirdParty }: ThirdPartySectionProps) {
  const { scripts, totalSize, totalLoadTime, highPrivacyRisk, renderBlocking, recommendations } = thirdParty;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ExternalLink className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">Third-Party Scripts</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Total Scripts</span>
          <span className="metric-value">{scripts.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total Size</span>
          <span className="metric-value">{formatBytes(totalSize)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Est. Load Time</span>
          <span className="metric-value">{totalLoadTime.toFixed(2)}s</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">High Privacy Risk</span>
          <span className={`metric-value ${highPrivacyRisk > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {highPrivacyRisk}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {renderBlocking > 0 && (
        <div className="dev-panel border-yellow-500/30">
          <div className="flex items-start gap-3 p-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-400">
                {renderBlocking} Render-Blocking Scripts
              </h3>
              <p className="text-sm text-dev-text-muted mt-1">
                These scripts delay initial page render. Consider adding async/defer attributes.
              </p>
            </div>
          </div>
        </div>
      )}

      {highPrivacyRisk > 0 && (
        <div className="dev-panel border-red-500/30">
          <div className="flex items-start gap-3 p-4">
            <Shield className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-400">
                {highPrivacyRisk} High Privacy Risk Scripts
              </h3>
              <p className="text-sm text-dev-text-muted mt-1">
                These scripts may collect user data. Consider privacy-friendly alternatives.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scripts List */}
      {scripts.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text">Detected Scripts ({scripts.length})</h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {scripts.map((script, i) => (
              <div key={i} className="px-4 py-3 hover:bg-dev-surface-hover">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(script.category)}`}>
                      {script.category}
                    </span>
                    <span className="font-medium text-dev-text">{script.name}</span>
                    {script.privacyImpact === 'high' && (
                      <Shield className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <span className="text-xs text-dev-text-subtle">{formatBytes(script.estimatedSize)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-dev-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {script.estimatedLoadTime.toFixed(2)}s
                  </span>
                  {script.blockingType !== 'none' && (
                    <span className="text-yellow-400">
                      {script.blockingType === 'render' ? 'Render blocking' : 'Parser blocking'}
                    </span>
                  )}
                  {script.hasAsync && <span className="text-green-400">async</span>}
                  {script.hasDefer && <span className="text-green-400">defer</span>}
                </div>
                {script.alternatives && script.alternatives.length > 0 && (
                  <div className="mt-2 text-xs">
                    <span className="text-dev-text-muted">Alternatives: </span>
                    <span className="text-dev-accent">{script.alternatives.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
                <TrendingUp className="w-4 h-4 text-dev-accent shrink-0 mt-0.5" />
                <span className="text-sm text-dev-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text">Category Breakdown</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['analytics', 'advertising', 'widget', 'social', 'cdn', 'other'].map((category) => {
              const count = scripts.filter((s) => s.category === category).length;
              if (count === 0) return null;
              return (
                <div key={category} className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-dev-text-muted" />
                  <span className="text-sm text-dev-text capitalize">{category}:</span>
                  <span className="text-sm font-mono text-dev-text">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
