import type { ImageAnalysis } from '@/types';
import { AlertTriangle, BarChart3, CheckCircle, Image, Images, Zap } from 'lucide-react';
import { PieChart } from '../charts/PieChart';

interface ImagesSectionProps {
  images: ImageAnalysis;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function ImagesSection({ images }: ImagesSectionProps): React.ReactNode {
  const {
    images: imageList,
    totalSize,
    optimizableSize,
    modernFormatPercentage,
    lazyLoadingPercentage,
    lcpImage,
    recommendations,
  } = images;

  const pieData = [
    { label: 'Optimized', value: totalSize - optimizableSize, color: '#3fb950' },
    { label: 'Optimizable', value: optimizableSize, color: '#d29922' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Images className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">Image Optimization</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Total Images</span>
          <span className="metric-value">{imageList.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total Size</span>
          <span className="metric-value">{formatBytes(totalSize)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Potential Savings</span>
          <span className="metric-value text-dev-warning">{formatBytes(optimizableSize)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Modern Formats</span>
          <span className={modernFormatPercentage >= 80 ? 'metric-value text-green-400' : 'metric-value text-dev-warning'}>
            {modernFormatPercentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* LCP Image */}
      {lcpImage && (
        <div className="dev-panel border-dev-accent/30 bg-dev-accent/5">
          <div className="px-4 py-3 border-b border-dev-accent/30">
            <h3 className="text-sm font-semibold text-dev-accent flex items-center gap-2">
              <Zap className="w-4 h-4" />
              LCP Candidate Image
            </h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dev-text truncate max-w-md">{lcpImage.src}</span>
              <span className="text-sm font-mono text-dev-text">{formatBytes(lcpImage.currentSize)}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {!lcpImage.hasModernFormat && (
                <span className="text-xs px-2 py-1 bg-dev-warning/20 text-dev-warning rounded">Not Modern Format</span>
              )}
              {!lcpImage.hasDimensions && (
                <span className="text-xs px-2 py-1 bg-dev-danger/20 text-dev-danger rounded">Missing Dimensions</span>
              )}
              {lcpImage.savings > 10000 && (
                <span className="text-xs px-2 py-1 bg-dev-accent/20 text-dev-accent rounded">
                  Save {formatBytes(lcpImage.savings)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Size Distribution */}
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-4">Optimization Potential</h3>
          <PieChart data={pieData} width={250} height={250} />
        </div>

        {/* Stats */}
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-4">Image Statistics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-dev-text-muted">Modern Formats (WebP/AVIF)</span>
                <span className="text-sm text-dev-text">{modernFormatPercentage.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-dev-surface-hover rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${modernFormatPercentage >= 80 ? 'bg-green-400' : 'bg-dev-warning'}`}
                  style={{ width: `${modernFormatPercentage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-dev-text-muted">Lazy Loading</span>
                <span className="text-sm text-dev-text">{lazyLoadingPercentage.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-dev-surface-hover rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${lazyLoadingPercentage >= 70 ? 'bg-green-400' : 'bg-dev-warning'}`}
                  style={{ width: `${lazyLoadingPercentage}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-dev-surface-hover rounded-lg text-center">
                <BarChart3 className="w-5 h-5 text-dev-accent mx-auto mb-1" />
                <p className="text-lg font-semibold text-dev-text">
                  {imageList.filter(i => i.hasSrcset).length}
                </p>
                <p className="text-xs text-dev-text-muted">with srcset</p>
              </div>
              <div className="p-3 bg-dev-surface-hover rounded-lg text-center">
                <Image className="w-5 h-5 text-dev-accent mx-auto mb-1" />
                <p className="text-lg font-semibold text-dev-text">
                  {imageList.filter(i => i.hasDimensions).length}
                </p>
                <p className="text-xs text-dev-text-muted">with dimensions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image List */}
      {imageList.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text">Image Details</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-dev-surface-hover text-dev-text-subtle">
                <tr>
                  <th className="px-4 py-2 text-left">Image</th>
                  <th className="px-4 py-2 text-left">Format</th>
                  <th className="px-4 py-2 text-right">Size</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dev-border-subtle">
                {imageList.slice(0, 20).map((img, i) => (
                  <tr key={i} className="hover:bg-dev-surface-hover">
                    <td className="px-4 py-2">
                      <div className="truncate max-w-xs" title={img.src}>
                        {img.isLCP && <Zap className="w-3 h-3 text-dev-accent inline mr-1" />}
                        {img.src.split('/').pop()}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`
                        text-xs px-1.5 py-0.5 rounded
                        ${img.hasModernFormat ? 'bg-green-500/20 text-green-400' : 'bg-dev-text-subtle/20 text-dev-text-subtle'}
                      `}>
                        {img.format}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{formatBytes(img.currentSize)}</td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {img.hasLazyLoading && <span title="Lazy loaded"><CheckCircle className="w-3 h-3 text-green-400" /></span>}
                        {img.hasDimensions && <span title="Has dimensions"><CheckCircle className="w-3 h-3 text-green-400" /></span>}
                        {img.hasSrcset && <span title="Has srcset"><CheckCircle className="w-3 h-3 text-green-400" /></span>}
                        {!img.hasLazyLoading && !img.hasDimensions && !img.hasSrcset && (
                          <AlertTriangle className="w-3 h-3 text-dev-warning" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {imageList.length > 20 && (
              <p className="text-center text-xs text-dev-text-subtle py-2">
                +{imageList.length - 20} more images
              </p>
            )}
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
    </div>
  );
}
