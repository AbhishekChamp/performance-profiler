import type { ImportAnalysis } from '@/types';
import { Package, AlertTriangle, TreePine, CheckCircle, Zap } from 'lucide-react';

interface ImportsSectionProps {
  imports: ImportAnalysis;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function ImportsSection({ imports }: ImportsSectionProps) {
  const {
    imports: importList,
    totalImportSize,
    duplicateImports,
    nonTreeShakableImports,
    barrelFileImports,
    recommendations,
  } = imports;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Package className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">Import Cost Analysis</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Total Imports</span>
          <span className="metric-value">{importList.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total Size</span>
          <span className="metric-value">{formatBytes(totalImportSize)}</span>
        </div>
        <div className="metric-card border-yellow-500/30">
          <span className="metric-label text-yellow-400">Duplicates</span>
          <span className="metric-value text-yellow-400">{duplicateImports.length}</span>
        </div>
        <div className="metric-card border-red-500/30">
          <span className="metric-label text-red-400">Non-Tree-Shakable</span>
          <span className="metric-value text-red-400">{nonTreeShakableImports.length}</span>
        </div>
      </div>

      {/* Alerts */}
      {barrelFileImports.length > 0 && (
        <div className="dev-panel border-yellow-500/30">
          <div className="flex items-start gap-3 p-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-400">
                {barrelFileImports.length} Barrel File Imports
              </h3>
              <p className="text-sm text-dev-text-muted mt-1">
                Importing from barrel files can prevent tree-shaking. Import specific modules instead.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Import List */}
      {importList.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text">Imports ({importList.length})</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-dev-surface-hover text-dev-text-subtle">
                <tr>
                  <th className="px-4 py-2 text-left">Package</th>
                  <th className="px-4 py-2 text-right">Size</th>
                  <th className="px-4 py-2 text-center">Tree-Shakable</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dev-border-subtle">
                {importList.map((imp, i) => (
                  <tr key={i} className="hover:bg-dev-surface-hover">
                    <td className="px-4 py-2">
                      <div className="truncate max-w-xs" title={imp.path}>
                        {imp.path}
                      </div>
                      <div className="text-xs text-dev-text-subtle">{imp.source}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{formatBytes(imp.size)}</td>
                    <td className="px-4 py-2 text-center">
                      {imp.isTreeShakable ? (
                        <TreePine className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <span className="text-xs text-red-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {imp.isDuplicate && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                            Duplicate
                          </span>
                        )}
                        {!imp.isTreeShakable && imp.size > 50000 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                            Heavy
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suggestions by Import */}
      {importList.filter((i) => i.suggestions.length > 0).length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text">Optimization Suggestions</h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {importList
              .filter((i) => i.suggestions.length > 0)
              .slice(0, 10)
              .map((imp, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="font-medium text-dev-text mb-1">{imp.path}</div>
                  <ul className="space-y-1">
                    {imp.suggestions.map((suggestion, j) => (
                      <li key={j} className="text-sm text-dev-text-muted flex items-start gap-2">
                        <Zap className="w-3 h-3 text-dev-accent shrink-0 mt-0.5" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
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
                <AlertTriangle className="w-4 h-4 text-dev-warning shrink-0 mt-0.5" />
                <span className="text-sm text-dev-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Practices */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text">Import Best Practices</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Import specific modules</p>
              <p className="text-xs text-dev-text-muted">
                import {'{'} debounce {'}'} from &apos;lodash/debounce&apos; instead of import _ from &apos;lodash&apos;
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Use ES modules</p>
              <p className="text-xs text-dev-text-muted">
                Prefer ES module imports for better tree-shaking
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Avoid barrel files</p>
              <p className="text-xs text-dev-text-muted">
                Import from the specific module file instead of index exports
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Consider alternatives</p>
              <p className="text-xs text-dev-text-muted">
                Replace moment.js with dayjs, lodash with lodash-es
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
