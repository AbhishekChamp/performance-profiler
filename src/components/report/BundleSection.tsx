import { Treemap } from '../charts/Treemap';
import { PieChart } from '../charts/PieChart';
import type { BundleAnalysis } from '@/types';
import { AlertTriangle, Package } from 'lucide-react';

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
      <div className="flex items-center gap-3">
        <Package className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">Bundle Analysis</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Total Size</span>
          <span className="metric-value">{formatBytes(bundle.totalSize)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Gzipped</span>
          <span className="metric-value">{formatBytes(bundle.gzippedSize)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Modules</span>
          <span className="metric-value">{bundle.moduleCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Vendor %</span>
          <span className="metric-value">{bundle.vendorPercentage.toFixed(1)}%</span>
        </div>
      </div>

      {/* Duplicates Warning */}
      {bundle.duplicateLibraries.length > 0 && (
        <div className="dev-panel p-4 border-dev-warning/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-dev-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-dev-warning-bright mb-2">
                Duplicate Libraries Detected
              </h3>
              <div className="space-y-2">
                {bundle.duplicateLibraries.map((lib, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-dev-surface-hover rounded">
                    <div>
                      <p className="text-sm font-medium text-dev-text">{lib.name}</p>
                      <p className="text-xs text-dev-text-muted">
                        {lib.instances} instances: {lib.versions.join(', ')}
                      </p>
                    </div>
                    <span className="text-xs text-dev-text-subtle">
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
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-4">Module Size Treemap</h3>
          <Treemap modules={bundle.modules} />
        </div>

        {/* Pie Chart */}
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-4">Vendor vs Application</h3>
          <PieChart data={pieData} width={280} height={280} />
        </div>
      </div>

      {/* Largest Modules */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text">Largest Modules</h3>
        </div>
        <div className="divide-y divide-dev-border-subtle">
          {bundle.largestModules.map((module, i) => (
            <div key={module.id} className="px-4 py-3 flex items-center justify-between hover:bg-dev-surface-hover transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xs text-dev-text-subtle w-6">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-dev-text">{module.name}</p>
                  <p className="text-xs text-dev-text-muted">{module.path}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono text-dev-text">{formatBytes(module.size)}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  module.type === 'vendor' 
                    ? 'bg-dev-accent/10 text-dev-accent' 
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
