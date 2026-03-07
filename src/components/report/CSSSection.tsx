import { BarChart } from '../charts/BarChart';
import type { CSSAnalysis } from '@/types';
import { Palette, AlertTriangle } from 'lucide-react';

interface CSSSectionProps {
  css: CSSAnalysis;
}

export function CSSSection({ css }: CSSSectionProps) {
  const fileData = css.largeFiles.map(f => ({
    label: f.path.split('/').pop() || f.path,
    value: f.size,
    color: f.size > 200 * 1024 ? '#f85149' : f.size > 100 * 1024 ? '#d29922' : '#58a6ff',
  }));

  const unusedPercentage = css.totalRules > 0 ? (css.unusedRules / css.totalRules) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Palette className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">CSS Analysis</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Total Rules</span>
          <span className="metric-value">{css.totalRules.toLocaleString()}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Unused Rules</span>
          <span className={`metric-value ${unusedPercentage > 30 ? 'text-dev-danger-bright' : 'text-dev-warning-bright'}`}>
            {css.unusedRules.toLocaleString()}
          </span>
          <span className="text-xs text-dev-text-muted">{unusedPercentage.toFixed(1)}%</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Inline Styles</span>
          <span className={`metric-value ${css.inlineStyles > 10 ? 'text-dev-warning-bright' : 'text-dev-text'}`}>
            {css.inlineStyles}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">!important</span>
          <span className={`metric-value ${css.importantCount > 20 ? 'text-dev-danger-bright' : 'text-dev-text'}`}>
            {css.importantCount}
          </span>
        </div>
      </div>

      {/* Warnings */}
      {css.warnings.length > 0 && (
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-3">Warnings</h3>
          <div className="space-y-2">
            {css.warnings.map((warning, i) => (
              <div 
                key={i} 
                className={`flex items-start gap-3 p-3 rounded ${
                  warning.severity === 'error' ? 'bg-dev-danger/10 border border-dev-danger/30' :
                  warning.severity === 'warning' ? 'bg-dev-warning/10 border border-dev-warning/30' :
                  'bg-dev-accent/10 border border-dev-accent/30'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  warning.severity === 'error' ? 'text-dev-danger-bright' :
                  warning.severity === 'warning' ? 'text-dev-warning-bright' :
                  'text-dev-accent'
                }`} />
                <div>
                  <p className="text-sm text-dev-text">{warning.message}</p>
                  {warning.selector && (
                    <code className="text-xs text-dev-text-muted mt-1 block">{warning.selector}</code>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Large Files */}
      {fileData.length > 0 && (
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-4">Large CSS Files</h3>
          <BarChart 
            data={fileData} 
            height={200}
            formatValue={(v) => `${(v / 1024).toFixed(1)} KB`}
          />
        </div>
      )}

      {/* Unused Selectors */}
      {css.unusedSelectors.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dev-text">Unused Selectors</h3>
            <span className="text-xs text-dev-text-muted">
              Showing first {Math.min(20, css.unusedSelectors.length)} of {css.unusedSelectors.length}
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {css.unusedSelectors.map((selector, i) => (
              <div 
                key={i} 
                className="px-4 py-2 border-b border-dev-border-subtle last:border-0 hover:bg-dev-surface-hover"
              >
                <code className="text-sm text-dev-text">{selector}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
