import { useState } from 'react';
import { Activity, Download, ExternalLink, Info, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AccuracyIndicator, MetricComparison } from './AccuracyIndicator';
import { rumAdapters } from '@/core/browser-analysis/rum-adapters';
import { generateLighthouseCIConfig } from '@/core/browser-analysis/lighthouse';
import type { MetricComparison as MetricComparisonType, RealWebVitalMetric } from '@/core/browser-analysis';
import type { WebVitalsAnalysis } from '@/types';

interface RealMetricsSectionProps {
  estimatedMetrics: WebVitalsAnalysis;
  onImportRUM?: (metrics: RealWebVitalMetric[]) => void;
}

/**
 * Section for displaying and importing real browser metrics
 */
export function RealMetricsSection({ estimatedMetrics, onImportRUM }: RealMetricsSectionProps): React.ReactNode {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [realMetrics, setRealMetrics] = useState<RealWebVitalMetric[]>([]);
  const [comparisons, setComparisons] = useState<MetricComparisonType[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportRUM = (jsonData: string, adapter: keyof typeof rumAdapters): void => {
    try {
      setImportError(null);
      const data = JSON.parse(jsonData);
      const metrics = rumAdapters[adapter](data);
      
      if (metrics.length === 0) {
        setImportError('No Web Vitals metrics found in the provided data');
        return;
      }

      setRealMetrics(metrics);
      
      // Calculate comparisons
      const newComparisons: MetricComparisonType[] = [];
      for (const metric of metrics) {
        const estimated = estimatedMetrics.metrics.find(m => m.name === metric.name);
        if (estimated) {
          const difference = metric.value - estimated.value;
          const percentDiff = estimated.value !== 0 ? (difference / estimated.value) * 100 : 0;
          
          newComparisons.push({
            metric: metric.name,
            estimated: estimated.value,
            real: metric.value,
            difference,
            percentDifference: percentDiff,
            accuracy: Math.abs(percentDiff) < 10 ? 'high' : Math.abs(percentDiff) < 25 ? 'medium' : 'low'
          });
        }
      }
      
      setComparisons(newComparisons);
      onImportRUM?.(metrics);
      setImportModalOpen(false);
    } catch (_error) {
      setImportError('Failed to parse RUM data. Please check the format.');
    }
  };

  const hasRealMetrics = realMetrics.length > 0;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dev-text">Real Browser Metrics</h3>
          <p className="text-sm text-dev-text-muted">
            Compare estimated metrics with real measurements from browser automation or RUM tools
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setImportModalOpen(true)}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Import RUM Data
          </Button>
          <Button
            variant="secondary"
            onClick={() => downloadLighthouseCIConfig()}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Lighthouse CI Config
          </Button>
        </div>
      </div>

      {/* Metrics Display */}
      {!hasRealMetrics ? (
        <div className="p-8 text-center border border-dashed border-dev-border rounded-lg">
          <Activity className="w-12 h-12 text-dev-text-muted mx-auto mb-4" />
          <h4 className="text-dev-text font-medium mb-2">No Real Metrics Available</h4>
          <p className="text-sm text-dev-text-muted mb-4 max-w-md mx-auto">
            Import metrics from RUM tools like Vercel Analytics, Google Analytics 4, 
            Cloudflare, New Relic, or Datadog to compare with estimates.
          </p>
          <Button
            onClick={() => setImportModalOpen(true)}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Import RUM Data
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Real Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {realMetrics.map(metric => (
              <div 
                key={metric.name}
                className="p-4 bg-dev-surface border border-dev-border rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-dev-text">{metric.name}</span>
                  <AccuracyIndicator 
                    confidence={metric.confidence} 
                    source={metric.source}
                    showLabel={false}
                    size="sm"
                  />
                </div>
                <p className="text-2xl font-semibold text-dev-text">
                  {formatMetricValue(metric.value, metric.unit)}
                </p>
              </div>
            ))}
          </div>

          {/* Comparisons */}
          {comparisons.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-dev-text mb-3">
                Estimated vs Real Comparison
              </h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {comparisons.map(comp => (
                  <MetricComparison
                    key={comp.metric}
                    metric={comp.metric}
                    estimated={comp.estimated}
                    real={comp.real}
                    unit={realMetrics.find(m => m.name === comp.metric)?.unit ?? ''}
                    difference={comp.difference}
                    percentDifference={comp.percentDifference}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import RUM Data"
        size="lg"
      >
        <RUMImportForm 
          onImport={handleImportRUM}
          error={importError}
        />
      </Modal>
    </section>
  );
}

function RUMImportForm({ 
  onImport, 
  error 
}: { 
  onImport: (data: string, adapter: keyof typeof rumAdapters) => void;
  error: string | null;
}): React.ReactNode {
  const [jsonData, setJsonData] = useState('');
  const [selectedAdapter, setSelectedAdapter] = useState<keyof typeof rumAdapters>('auto');

  const adapters = [
    { id: 'auto', name: 'Auto-detect', description: 'Automatically detect format' },
    { id: 'vercel', name: 'Vercel Analytics', description: 'Vercel Web Vitals' },
    { id: 'ga4', name: 'Google Analytics 4', description: 'GA Web Vitals' },
    { id: 'cloudflare', name: 'Cloudflare', description: 'Cloudflare Web Analytics' },
    { id: 'newrelic', name: 'New Relic', description: 'New Relic Browser' },
    { id: 'datadog', name: 'Datadog', description: 'Datadog RUM' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dev-text mb-2">
          Data Source
        </label>
        <div className="grid grid-cols-2 gap-2">
          {adapters.map(adapter => (
            <button
              key={adapter.id}
              onClick={() => setSelectedAdapter(adapter.id as keyof typeof rumAdapters)}
              className={`
                p-3 text-left border rounded-lg transition-colors
                ${selectedAdapter === adapter.id 
                  ? 'border-dev-accent bg-dev-accent/10' 
                  : 'border-dev-border hover:border-dev-accent/50'
                }
              `}
            >
              <p className="text-sm font-medium text-dev-text">{adapter.name}</p>
              <p className="text-xs text-dev-text-muted">{adapter.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dev-text mb-2">
          JSON Data
        </label>
        <textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder={`Paste your RUM data JSON here...\n\nExample for Vercel Analytics:\n{\n  "webVitals": [{\n    "name": "LCP",\n    "value": 1200,\n    "timestamp": 1234567890\n  }]\n}`}
          className="w-full h-48 px-3 py-2 bg-dev-bg border border-dev-border rounded-lg 
                     text-dev-text placeholder:text-dev-text-muted
                     focus:outline-none focus:border-dev-accent font-mono text-sm"
        />
      </div>

      {error != null && (
        <div className="p-3 bg-red-400/10 border border-red-400/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => onImport(jsonData, selectedAdapter)}
          disabled={!jsonData.trim()}
          className="flex-1"
        >
          Import Metrics
        </Button>
      </div>

      <div className="flex items-start gap-2 p-3 bg-dev-accent/5 border border-dev-accent/20 rounded-lg">
        <Info className="w-4 h-4 text-dev-accent flex-shrink-0 mt-0.5" />
        <p className="text-xs text-dev-text-muted">
          Your data is processed locally in the browser and never sent to any server.
          Learn more about exporting data from{' '}
          <a 
            href="https://vercel.com/docs/concepts/analytics/web-vitals" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-dev-accent hover:underline"
          >
            Vercel <ExternalLink className="w-3 h-3 inline" />
          </a>
          ,{' '}
          <a 
            href="https://support.google.com/analytics/answer/13710683" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-dev-accent hover:underline"
          >
            GA4 <ExternalLink className="w-3 h-3 inline" />
          </a>
          , or other providers.
        </p>
      </div>
    </div>
  );
}

function formatMetricValue(value: number, unit: string): string {
  if (unit === 'ms') {
    return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(2)}s`;
  }
  if (unit === 's') {
    return `${value.toFixed(2)}s`;
  }
  return value.toFixed(3);
}

function downloadLighthouseCIConfig(): void {
  const config = generateLighthouseCIConfig(['https://example.com']);
  const blob = new Blob([config], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lighthouserc.json';
  a.click();
  URL.revokeObjectURL(url);
}
