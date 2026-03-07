import { BarChart } from '../charts/BarChart';
import type { DOMAnalysis } from '@/types';
import { FileCode, AlertTriangle, Image } from 'lucide-react';

interface DOMSectionProps {
  dom: DOMAnalysis;
}

export function DOMSection({ dom }: DOMSectionProps) {
  const depthData = Object.entries(dom.nodesPerLevel)
    .slice(0, 15)
    .map(([depth, count]) => ({
      label: `Level ${depth}`,
      value: count as number,
      color: (count as number) > 100 ? '#f85149' : (count as number) > 50 ? '#d29922' : '#58a6ff',
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileCode className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">DOM Complexity Analysis</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Total Nodes</span>
          <span className={`metric-value ${
            dom.totalNodes > 1500 ? 'text-dev-danger-bright' : 
            dom.totalNodes > 800 ? 'text-dev-warning-bright' : 'text-dev-success-bright'
          }`}>
            {dom.totalNodes.toLocaleString()}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Max Depth</span>
          <span className={`metric-value ${
            dom.maxDepth > 24 ? 'text-dev-danger-bright' : 
            dom.maxDepth > 16 ? 'text-dev-warning-bright' : 'text-dev-success-bright'
          }`}>
            {dom.maxDepth}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Leaf Nodes</span>
          <span className="metric-value">{dom.leafNodes.toLocaleString()}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Largest Subtree</span>
          <span className="metric-value text-sm">{dom.largestSubtree.tag}</span>
          <span className="text-xs text-dev-text-muted">{dom.largestSubtree.nodeCount} nodes</span>
        </div>
      </div>

      {/* Warnings */}
      {dom.warnings.length > 0 && (
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-3">Warnings</h3>
          <div className="space-y-2">
            {dom.warnings.map((warning, i) => (
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
                  {warning.element && (
                    <p className="text-xs text-dev-text-muted mt-1">Element: {warning.element}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nodes Per Level Chart */}
      <div className="dev-panel p-4">
        <h3 className="text-sm font-semibold text-dev-text mb-4">Nodes per Depth Level</h3>
        <BarChart data={depthData} height={300} />
      </div>

      {/* Image Analysis */}
      {(dom.imagesWithoutLazy > 0 || dom.imagesWithoutDimensions > 0 || dom.largeImages.length > 0) && (
        <div className="dev-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Image className="w-4 h-4 text-dev-accent" />
            <h3 className="text-sm font-semibold text-dev-text">Image Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-dev-surface-hover rounded-lg">
              <p className="text-2xl font-mono font-semibold text-dev-text">{dom.imagesWithoutLazy}</p>
              <p className="text-xs text-dev-text-muted">Without lazy loading</p>
            </div>
            <div className="p-3 bg-dev-surface-hover rounded-lg">
              <p className="text-2xl font-mono font-semibold text-dev-text">{dom.imagesWithoutDimensions}</p>
              <p className="text-xs text-dev-text-muted">Missing dimensions</p>
            </div>
            <div className="p-3 bg-dev-surface-hover rounded-lg">
              <p className="text-2xl font-mono font-semibold text-dev-text">{dom.largeImages.length}</p>
              <p className="text-xs text-dev-text-muted">Large images ({'>'}1MB)</p>
            </div>
          </div>

          {dom.largeImages.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-dev-text-muted">Large images detected:</p>
              {dom.largeImages.slice(0, 5).map((img, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-dev-surface-hover rounded text-sm">
                  <code className="text-dev-text truncate max-w-md">{img.src}</code>
                  <span className="text-dev-text-subtle">
                    {!img.hasWidth && !img.hasHeight && 'Missing dimensions'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
