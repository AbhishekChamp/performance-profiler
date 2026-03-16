import { Treemap } from '../charts/Treemap';
import { PieChart } from '../charts/PieChart';
import type { BundleAnalysis } from '@/types';
import { AlertTriangle, FileCode, HardDrive, Layers, Package, Puzzle } from 'lucide-react';

interface BundleSectionProps {
  bundle: BundleAnalysis;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function BundleSection({ bundle }: BundleSectionProps): React.ReactNode {
  const pieData = [
    { label: 'Vendor', value: bundle.vendorSize, color: '#58a6ff' },
    { label: 'Application', value: bundle.totalSize - bundle.vendorSize, color: '#3fb950' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-dev-border">
        <div className="p-2 rounded-lg bg-dev-accent/10">
          <Package className="w-5 h-5 text-dev-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-dev-text">Bundle Analysis</h2>
          <p className="text-sm text-dev-text-muted">
            {bundle.moduleCount} modules • {formatBytes(bundle.totalSize)} total
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card hover-lift">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-dev-text-subtle" />
            <span className="metric-label">Total Size</span>
          </div>
          <span className="metric-value text-dev-text">{formatBytes(bundle.totalSize)}</span>
        </div>
        <div className="metric-card hover-lift">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-dev-text-subtle" />
            <span className="metric-label">Gzipped</span>
          </div>
          <span className="metric-value text-dev-text">{formatBytes(bundle.gzippedSize)}</span>
        </div>
        <div className="metric-card hover-lift">
          <div className="flex items-center gap-2 mb-2">
            <Puzzle className="w-4 h-4 text-dev-text-subtle" />
            <span className="metric-label">Modules</span>
          </div>
          <span className="metric-value text-dev-text">{bundle.moduleCount}</span>
        </div>
        <div className="metric-card hover-lift">
          <div className="flex items-center gap-2 mb-2">
            <FileCode className="w-4 h-4 text-dev-text-subtle" />
            <span className="metric-label">Vendor %</span>
          </div>
          <span className={`metric-value ${
            bundle.vendorPercentage > 70 ? 'text-dev-warning' : 
            bundle.vendorPercentage > 50 ? 'text-dev-warning-bright' : 'text-dev-success-bright'
          }`}>
            {bundle.vendorPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Duplicates Warning */}
      {bundle.duplicateLibraries.length > 0 && (
        <div className="dev-panel p-4 border-l-4 border-l-dev-warning border-dev-warning/30 rounded-r-lg">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-dev-warning/10">
              <AlertTriangle className="w-5 h-5 text-dev-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-dev-warning-bright mb-2">
                Duplicate Libraries Detected
              </h3>
              <div className="space-y-2">
                {bundle.duplicateLibraries.map((lib, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 bg-dev-surface-hover rounded-lg border border-dev-border-subtle"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-dev-text truncate">{lib.name}</p>
                      <p className="text-xs text-dev-text-muted mt-0.5">
                        {lib.instances} instances: <span className="font-mono">{lib.versions.join(', ')}</span>
                      </p>
                    </div>
                    <span className="text-xs font-mono px-2 py-1 bg-dev-surface rounded text-dev-text-subtle ml-3">
                      {formatBytes(lib.totalSize)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treemap */}
        <div className="dev-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dev-text">Module Size Treemap</h3>
            <span className="text-xs text-dev-text-subtle">Top 100 modules</span>
          </div>
          <Treemap modules={bundle.modules} />
        </div>

        {/* Pie Chart */}
        <div className="dev-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dev-text">Vendor vs Application</h3>
            <span className="text-xs text-dev-text-subtle">Size distribution</span>
          </div>
          <PieChart data={pieData} width={280} height={280} />
        </div>
      </div>

      {/* Largest Modules */}
      <div className="dev-panel overflow-hidden">
        <div className="px-5 py-4 border-b border-dev-border bg-dev-surface-hover/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dev-text">Largest Modules</h3>
            <span className="text-xs text-dev-text-subtle">
              Top {bundle.largestModules.length} by size
            </span>
          </div>
        </div>
        <div className="divide-y divide-dev-border-subtle">
          {bundle.largestModules.map((module, i) => (
            <div 
              key={module.id} 
              className="px-5 py-3.5 flex items-center justify-between hover:bg-dev-surface-hover transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <span className="flex items-center justify-center w-6 h-6 text-xs font-medium text-dev-text-subtle bg-dev-surface-hover rounded group-hover:bg-dev-surface transition-colors">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-dev-text truncate">{module.name}</p>
                  <p className="text-xs text-dev-text-muted truncate mt-0.5">{module.path}</p>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-mono text-dev-text">{formatBytes(module.size)}</p>
                <span className={`inline-flex items-center mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${
                  module.type === 'vendor' 
                    ? 'bg-dev-accent/10 text-dev-accent' 
                    : module.type === 'chunk'
                      ? 'bg-purple-500/10 text-purple-500'
                      : module.type === 'asset'
                        ? 'bg-dev-warning/10 text-dev-warning'
                        : 'bg-dev-success/10 text-dev-success-bright'
                }`}>
                  {module.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
