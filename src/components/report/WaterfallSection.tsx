import { useMemo } from 'react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { generateWaterfallData } from '@/core/waterfall/timingCalculator';
import { WaterfallChart } from '@/components/waterfall';
import { Waves } from 'lucide-react';

export function WaterfallSection(): React.ReactNode | null {
  const report = useAnalysisStore((state) => state.currentReport);

  const waterfallData = useMemo(() => {
    if (!report) return null;

    const htmlContent = report.files.find((f) => f.name.endsWith('.html'))?.content ?? '';
    const assets = report.assets?.breakdown
      ? Object.entries(report.assets.byType).flatMap(([type, items]) =>
          items.map((item) => ({ ...item, type }))
        )
      : [];

    return generateWaterfallData(
      htmlContent,
      assets,
      report.network?.hints,
      report.network?.renderBlocking
    );
  }, [report]);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-dev-text-muted">
        <Waves className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No Analysis Available</p>
        <p className="text-sm mt-2">Run an analysis to see the waterfall chart</p>
      </div>
    );
  }

  if (!waterfallData || waterfallData.resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-dev-text-muted">
        <Waves className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No Resources Found</p>
        <p className="text-sm mt-2">Upload an HTML file with resources to see the waterfall</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dev-text">Resource Waterfall</h2>
          <p className="text-dev-text-muted mt-1">
            Visualize resource loading sequence and timing
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-dev-text-muted">Total Duration</div>
          <div className="text-2xl font-bold text-dev-accent">
            {Math.round(waterfallData.totalDuration)}ms
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'DOMContentLoaded', value: waterfallData.markers.domContentLoaded, color: 'text-dev-warning-bright' },
          { label: 'Load', value: waterfallData.markers.load, color: 'text-dev-accent' },
          { label: 'First Paint', value: waterfallData.markers.firstPaint, color: 'text-dev-success-bright' },
          { label: 'LCP (est.)', value: waterfallData.markers.largestContentfulPaint, color: 'text-dev-info' },
        ].map((metric) => (
          <div key={metric.label} className="metric-card">
            <div className="metric-label">{metric.label}</div>
            <div className={`metric-value ${metric.color}`}>
              {Math.round(metric.value)}ms
            </div>
          </div>
        ))}
      </div>

      {/* Waterfall Chart */}
      <div className="dev-panel p-4 overflow-hidden">
        <WaterfallChart data={waterfallData} height={400} />
      </div>

      {/* Critical Path Info */}
      {waterfallData.criticalPath.length > 0 && (
        <div className="bg-dev-surface border border-dev-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-dev-text-muted uppercase tracking-wider mb-3">
            Critical Path ({waterfallData.criticalPath.length} resources)
          </h3>
          <div className="space-y-2">
            {waterfallData.criticalPath.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between py-2 px-3 bg-dev-bg rounded text-sm"
              >
                <span className="text-dev-text truncate" title={resource.url}>
                  {resource.url.split('/').pop() ?? resource.url}
                </span>
                <span className="text-dev-text-muted">
                  {Math.round(resource.duration)}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
