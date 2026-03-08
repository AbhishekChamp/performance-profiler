import { useComparisonStore } from '@/stores/comparisonStore';
import { GitCompare, ArrowRight, TrendingUp, TrendingDown, ArrowLeftRight, RotateCcw } from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function ReportComparison() {
  const { comparison, baseline, current, clearComparison, swapReports } = useComparisonStore();

  if (!comparison) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <GitCompare className="w-12 h-12 text-dev-text-muted mb-4" />
        <p className="text-dev-text-muted mb-2">No comparison available</p>
        <p className="text-sm text-dev-text-subtle">
          Select two reports to compare
        </p>
      </div>
    );
  }

  const { changes, improvements, regressions } = comparison;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitCompare className="w-5 h-5 text-dev-accent" />
          <h2 className="text-lg font-semibold text-dev-text">Report Comparison</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={swapReports}
            className="dev-button-secondary flex items-center gap-2 text-sm py-1.5 px-3"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Swap
          </button>
          <button
            onClick={clearComparison}
            className="dev-button-secondary flex items-center gap-2 text-sm py-1.5 px-3"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Report Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="dev-panel p-4">
          <div className="text-xs text-dev-text-muted mb-1">Baseline</div>
          <div className="text-sm font-medium text-dev-text truncate">
            Report from {new Date(baseline?.timestamp || 0).toLocaleDateString()}
          </div>
          <div className="text-xs text-dev-text-subtle mt-1">
            Score: {baseline?.score.overall}
          </div>
        </div>
        <div className="dev-panel p-4">
          <div className="text-xs text-dev-text-muted mb-1">Current</div>
          <div className="text-sm font-medium text-dev-text truncate">
            Report from {new Date(current?.timestamp || 0).toLocaleDateString()}
          </div>
          <div className="text-xs text-dev-text-subtle mt-1">
            Score: {current?.score.overall}
          </div>
        </div>
      </div>

      {/* Overall Score Change */}
      <div className="dev-panel p-6">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-dev-text">{changes.overall.before}</div>
            <div className="text-xs text-dev-text-muted mt-1">Baseline</div>
          </div>
          <ArrowRight className="w-6 h-6 text-dev-text-muted" />
          <div className="text-center">
            <div className={`text-3xl font-bold ${
              changes.overall.delta > 0 ? 'text-green-400' :
              changes.overall.delta < 0 ? 'text-red-400' :
              'text-dev-text'
            }`}>
              {changes.overall.after}
            </div>
            <div className="text-xs text-dev-text-muted mt-1">Current</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold ${
              changes.overall.delta > 0 ? 'text-green-400' :
              changes.overall.delta < 0 ? 'text-red-400' :
              'text-dev-text-muted'
            }`}>
              {changes.overall.delta > 0 ? '+' : ''}{changes.overall.delta}
            </div>
            <div className={`text-xs ${
              changes.overall.delta > 0 ? 'text-green-400' :
              changes.overall.delta < 0 ? 'text-red-400' :
              'text-dev-text-muted'
            }`}>
              {changes.overall.percentageChange > 0 ? '+' : ''}{changes.overall.percentageChange}%
            </div>
          </div>
        </div>
      </div>

      {/* Metric Changes */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text">Metric Changes</h3>
        </div>
        <div className="divide-y divide-dev-border-subtle">
          {Object.entries(changes)
            .filter(([key]) => key !== 'overall')
            .map(([key, diff]) => {
              if (!diff) return null;
              const isPositive = key === 'overall' ? diff.delta > 0 : diff.delta < 0;
              return (
                <div key={key} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-dev-text capitalize">{key}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-dev-text-muted">
                      {key === 'bundle' || key === 'assets' || key === 'css'
                        ? formatBytes(diff.before)
                        : diff.before}
                    </span>
                    <div className={`flex items-center gap-1 text-sm ${
                      isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>
                        {key === 'bundle' || key === 'assets' || key === 'css'
                          ? formatBytes(Math.abs(diff.delta))
                          : Math.abs(diff.delta)}
                      </span>
                    </div>
                    <span className="text-sm text-dev-text">
                      {key === 'bundle' || key === 'assets' || key === 'css'
                        ? formatBytes(diff.after)
                        : diff.after}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Improvements */}
      {improvements.length > 0 && (
        <div className="dev-panel border-green-500/30">
          <div className="px-4 py-3 border-b border-green-500/30 bg-green-500/5">
            <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Improvements ({improvements.length})
            </h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {improvements.map((improvement, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm text-dev-text">{improvement}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regressions */}
      {regressions.length > 0 && (
        <div className="dev-panel border-red-500/30">
          <div className="px-4 py-3 border-b border-red-500/30 bg-red-500/5">
            <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Regressions ({regressions.length})
            </h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {regressions.map((regression, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <TrendingDown className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-sm text-dev-text">{regression}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {improvements.length === 0 && regressions.length === 0 && (
        <div className="dev-panel p-8 text-center">
          <p className="text-dev-text-muted">No significant changes detected between reports</p>
        </div>
      )}
    </div>
  );
}
