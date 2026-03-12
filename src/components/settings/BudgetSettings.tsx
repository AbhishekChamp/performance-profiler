import { useBudgetStore, checkBudget } from '@/stores/budgetStore';
import type { AnalysisReport } from '@/types';
import { DollarSign, Download, Upload, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { useCallback, useMemo } from 'react';

interface BudgetSettingsProps {
  report?: AnalysisReport;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function BudgetSettings({ report }: BudgetSettingsProps) {
  const { budget, setBudget, resetBudget, exportBudget, importBudget } = useBudgetStore();

  const handleExport = useCallback(() => {
    const json = exportBudget();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'performance-budget.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [exportBudget]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          importBudget(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  }, [importBudget]);

  const budgetStatuses = useMemo(() => {
    if (!report) return [];
    const result = checkBudget(budget, {
      bundleSize: report.bundle?.totalSize,
      imageSize: report.images?.totalSize,
      cssSize: report.css ? report.css.totalRules * 100 : undefined,
      jsSize: report.javascript?.reduce((sum, f) => sum + f.size, 0),
      domNodes: report.dom?.totalNodes,
      maxDepth: report.dom?.maxDepth,
      unusedCSS: report.css ? (report.css.unusedRules / report.css.totalRules) * 100 : undefined,
      overallScore: report.score.overall,
    });
    return result.statuses;
  }, [report, budget]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-dev-accent" />
          <h2 className="text-lg font-semibold text-dev-text">Performance Budget</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="dev-button-secondary flex items-center gap-2 text-sm py-1.5 px-3"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="dev-button-secondary flex items-center gap-2 text-sm py-1.5 px-3 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={resetBudget}
            className="p-2 text-dev-text-muted hover:text-dev-text rounded"
            title="Reset to defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Budget Status */}
      {report && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text">Current Status</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetStatuses.map((status) => (
              <div
                key={status.metric}
                className={`p-3 rounded-lg border ${
                  status.status === 'pass'
                    ? 'border-green-500/30 bg-green-500/5'
                    : status.status === 'warning'
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-dev-text">{status.metric}</span>
                  {status.status === 'pass' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 ${
                      status.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                    }`} />
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-mono font-semibold text-dev-text">
                    {typeof status.current === 'number' && status.current > 1000
                      ? formatBytes(status.current)
                      : Math.round(status.current)}
                  </span>
                  <span className="text-xs text-dev-text-muted">
                    / {typeof status.limit === 'number' && status.limit > 1000
                      ? formatBytes(status.limit)
                      : status.limit}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-dev-surface-hover rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      status.status === 'pass'
                        ? 'bg-green-400'
                        : status.status === 'warning'
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, status.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Configuration */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text">Budget Configuration</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Bundle Size */}
          <div>
            <label className="flex items-center justify-between text-sm text-dev-text mb-2">
              <span>Bundle Size</span>
              <span className="text-dev-text-muted">{formatBytes(budget.bundleSize)}</span>
            </label>
            <input
              type="range"
              min="102400"
              max="2097152"
              step="10240"
              value={budget.bundleSize}
              onChange={(e) => setBudget({ bundleSize: parseInt(e.target.value) })}
              className="w-full h-2 bg-dev-surface-hover rounded-lg appearance-none cursor-pointer accent-dev-accent"
            />
            <div className="flex justify-between text-xs text-dev-text-subtle mt-1">
              <span>100 KB</span>
              <span>2 MB</span>
            </div>
          </div>

          {/* Image Size */}
          <div>
            <label className="flex items-center justify-between text-sm text-dev-text mb-2">
              <span>Total Image Size</span>
              <span className="text-dev-text-muted">{formatBytes(budget.imageSize)}</span>
            </label>
            <input
              type="range"
              min="512000"
              max="10485760"
              step="102400"
              value={budget.imageSize}
              onChange={(e) => setBudget({ imageSize: parseInt(e.target.value) })}
              className="w-full h-2 bg-dev-surface-hover rounded-lg appearance-none cursor-pointer accent-dev-accent"
            />
            <div className="flex justify-between text-xs text-dev-text-subtle mt-1">
              <span>500 KB</span>
              <span>10 MB</span>
            </div>
          </div>

          {/* CSS Size */}
          <div>
            <label className="flex items-center justify-between text-sm text-dev-text mb-2">
              <span>CSS Size</span>
              <span className="text-dev-text-muted">{formatBytes(budget.cssSize)}</span>
            </label>
            <input
              type="range"
              min="10240"
              max="512000"
              step="5120"
              value={budget.cssSize}
              onChange={(e) => setBudget({ cssSize: parseInt(e.target.value) })}
              className="w-full h-2 bg-dev-surface-hover rounded-lg appearance-none cursor-pointer accent-dev-accent"
            />
            <div className="flex justify-between text-xs text-dev-text-subtle mt-1">
              <span>10 KB</span>
              <span>500 KB</span>
            </div>
          </div>

          {/* DOM Nodes */}
          <div>
            <label className="flex items-center justify-between text-sm text-dev-text mb-2">
              <span>Max DOM Nodes</span>
              <span className="text-dev-text-muted">{budget.domNodes}</span>
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={budget.domNodes}
              onChange={(e) => setBudget({ domNodes: parseInt(e.target.value) })}
              className="w-full h-2 bg-dev-surface-hover rounded-lg appearance-none cursor-pointer accent-dev-accent"
            />
            <div className="flex justify-between text-xs text-dev-text-subtle mt-1">
              <span>500</span>
              <span>5000</span>
            </div>
          </div>

          {/* Max Depth */}
          <div>
            <label className="flex items-center justify-between text-sm text-dev-text mb-2">
              <span>Max DOM Depth</span>
              <span className="text-dev-text-muted">{budget.maxDepth}</span>
            </label>
            <input
              type="range"
              min="10"
              max="64"
              step="2"
              value={budget.maxDepth}
              onChange={(e) => setBudget({ maxDepth: parseInt(e.target.value) })}
              className="w-full h-2 bg-dev-surface-hover rounded-lg appearance-none cursor-pointer accent-dev-accent"
            />
            <div className="flex justify-between text-xs text-dev-text-subtle mt-1">
              <span>10</span>
              <span>64</span>
            </div>
          </div>

          {/* Overall Score */}
          <div>
            <label className="flex items-center justify-between text-sm text-dev-text mb-2">
              <span>Minimum Overall Score</span>
              <span className="text-dev-text-muted">{budget.overallScore}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={budget.overallScore}
              onChange={(e) => setBudget({ overallScore: parseInt(e.target.value) })}
              className="w-full h-2 bg-dev-surface-hover rounded-lg appearance-none cursor-pointer accent-dev-accent"
            />
            <div className="flex justify-between text-xs text-dev-text-subtle mt-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>

      {/* CI/CD Integration */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text">CI/CD Integration</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-dev-text-muted mb-3">
            Export this budget configuration and use it in your CI/CD pipeline:
          </p>
          <pre className="bg-dev-surface-hover p-3 rounded text-xs text-dev-text overflow-x-auto">
{`# Example GitHub Actions workflow step
- name: Check Performance Budget
  run: |
    npx performance-budget check \
      --config performance-budget.json \
      --report ./report.json`}
          </pre>
        </div>
      </div>
    </div>
  );
}
