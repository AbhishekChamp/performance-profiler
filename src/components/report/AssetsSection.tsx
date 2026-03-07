import { PieChart } from '../charts/PieChart';
import { BarChart } from '../charts/BarChart';
import type { AssetAnalysis, Asset } from '@/types';
import { Images, File, FileCode, Type, Folder } from 'lucide-react';

interface AssetsSectionProps {
  assets: AssetAnalysis;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  javascript: FileCode,
  css: FileCode,
  images: Images,
  fonts: Type,
  other: File,
};

const TYPE_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  css: '#264de4',
  images: '#e34c26',
  fonts: '#a371f7',
  other: '#8b949e',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function AssetsSection({ assets }: AssetsSectionProps) {
  const pieData = [
    { label: 'JavaScript', value: assets.breakdown.javascript, color: TYPE_COLORS.javascript },
    { label: 'CSS', value: assets.breakdown.css, color: TYPE_COLORS.css },
    { label: 'Images', value: assets.breakdown.images, color: TYPE_COLORS.images },
    { label: 'Fonts', value: assets.breakdown.fonts, color: TYPE_COLORS.fonts },
    { label: 'Other', value: assets.breakdown.other, color: TYPE_COLORS.other },
  ].filter(d => d.value > 0);

  const largestAssetsData = assets.largestAssets.slice(0, 10).map(a => ({
    label: a.path.split('/').pop() || a.path,
    value: a.size,
    color: TYPE_COLORS[a.type] || TYPE_COLORS.other,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Folder className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">Asset Analysis</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(assets.breakdown)
          .filter(([key]) => key !== 'total')
          .map(([type, size]) => {
            const Icon = TYPE_ICONS[type] || File;
            const percentage = assets.percentages[type as keyof typeof assets.percentages];
            
            return (
              <div key={type} className="metric-card">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: TYPE_COLORS[type] }} />
                  <span className="metric-label capitalize">{type}</span>
                </div>
                <span className="metric-value">{formatBytes(size)}</span>
                <span className="text-xs text-dev-text-muted block">{percentage.toFixed(1)}%</span>
              </div>
            );
          })}
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-4">Asset Distribution</h3>
          <PieChart data={pieData} width={280} height={280} />
        </div>

        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-4">Largest Assets</h3>
          <BarChart 
            data={largestAssetsData} 
            height={280}
            formatValue={formatBytes}
          />
        </div>
      </div>

      {/* By Type Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(assets.byType)
          .filter(([, items]) => (items as Asset[]).length > 0)
          .slice(0, 4)
          .map(([type, items]) => {
            const typedItems = items as Asset[];
            return (
              <div key={type} className="dev-panel">
                <div className="px-4 py-3 border-b border-dev-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = TYPE_ICONS[type] || File;
                      return <Icon className="w-4 h-4" style={{ color: TYPE_COLORS[type] }} />;
                    })()}
                    <h3 className="text-sm font-semibold text-dev-text capitalize">{type}</h3>
                  </div>
                  <span className="text-xs text-dev-text-muted">{typedItems.length} files</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {typedItems.slice(0, 10).map((asset, i) => (
                    <div 
                      key={i} 
                      className="px-4 py-2 flex items-center justify-between border-b border-dev-border-subtle last:border-0 hover:bg-dev-surface-hover"
                    >
                      <code className="text-xs text-dev-text truncate max-w-xs">{asset.path}</code>
                      <span className="text-xs text-dev-text-muted font-mono">{formatBytes(asset.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
