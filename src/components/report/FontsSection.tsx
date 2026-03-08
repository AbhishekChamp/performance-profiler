import type { FontAnalysis } from '@/types';
import { Type, AlertTriangle, Zap, Download, Monitor } from 'lucide-react';

interface FontsSectionProps {
  fonts: FontAnalysis;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getDisplayLabel(display: string): { text: string; color: string } {
  switch (display) {
    case 'swap':
      return { text: 'swap', color: 'bg-green-500/20 text-green-400' };
    case 'optional':
      return { text: 'optional', color: 'bg-blue-500/20 text-blue-400' };
    case 'fallback':
      return { text: 'fallback', color: 'bg-yellow-500/20 text-yellow-400' };
    case 'block':
      return { text: 'block', color: 'bg-red-500/20 text-red-400' };
    default:
      return { text: display, color: 'bg-gray-500/20 text-gray-400' };
  }
}

export function FontsSection({ fonts }: FontsSectionProps) {
  const {
    fonts: fontList,
    totalFontSize,
    fontsWithoutDisplay,
    missingPreloads,
    systemFontFallbacks,
    variableFontOpportunities,
    recommendations,
    score,
  } = fonts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Type className="w-5 h-5 text-dev-accent" />
          <h2 className="text-lg font-semibold text-dev-text">Font Loading</h2>
        </div>
        <div className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${score >= 80 ? 'bg-green-500/20 text-green-400' :
            score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'}
        `}>
          Score: {score}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Total Fonts</span>
          <span className="metric-value">{fontList.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total Size</span>
          <span className="metric-value">{formatBytes(totalFontSize)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Missing font-display</span>
          <span className={fontsWithoutDisplay === 0 ? 'metric-value text-green-400' : 'metric-value text-dev-warning'}>
            {fontsWithoutDisplay}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">System Fallbacks</span>
          <span className={systemFontFallbacks ? 'metric-value text-green-400' : 'metric-value text-dev-warning'}>
            {systemFontFallbacks ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {fontsWithoutDisplay > 0 && (
        <div className="dev-panel border-dev-warning/30">
          <div className="flex items-start gap-3 p-4">
            <AlertTriangle className="w-5 h-5 text-dev-warning shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-dev-warning">Missing font-display</h3>
              <p className="text-sm text-dev-text-muted mt-1">
                {fontsWithoutDisplay} font faces are missing the font-display property. This can cause invisible text (FOIT) during loading.
              </p>
              <code className="block mt-2 text-xs bg-dev-surface-hover p-2 rounded">
                font-display: swap;
              </code>
            </div>
          </div>
        </div>
      )}

      {missingPreloads.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text flex items-center gap-2">
              <Download className="w-4 h-4" />
              Missing Preloads ({missingPreloads.length})
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {missingPreloads.map((preload, i) => (
              <div key={i} className="text-sm text-dev-text-muted flex items-start gap-2">
                <Zap className="w-4 h-4 text-dev-accent shrink-0" />
                <code className="text-xs">{preload}</code>
              </div>
            ))}
            <p className="text-xs text-dev-text-subtle mt-2">
              Preload critical fonts to improve initial render performance.
            </p>
          </div>
        </div>
      )}

      {variableFontOpportunities.length > 0 && (
        <div className="dev-panel border-dev-accent/30">
          <div className="px-4 py-3 border-b border-dev-accent/30 bg-dev-accent/5">
            <h3 className="text-sm font-semibold text-dev-accent flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Variable Font Opportunities
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {variableFontOpportunities.map((opportunity, i) => (
              <div key={i} className="text-sm text-dev-text flex items-start gap-2">
                <Zap className="w-4 h-4 text-dev-accent shrink-0" />
                {opportunity}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Font List */}
      {fontList.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text">Font Faces ({fontList.length})</h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {fontList.map((font, i) => {
              const displayInfo = getDisplayLabel(font.display);
              return (
                <div key={i} className="px-4 py-3 hover:bg-dev-surface-hover">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-dev-text">{font.family}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${displayInfo.color}`}>
                      {displayInfo.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-dev-text-muted">
                    <span className="uppercase">{font.format}</span>
                    <span>{formatBytes(font.estimatedSize)}</span>
                    {font.unicodeRange && (
                      <span className="truncate max-w-xs">{font.unicodeRange}</span>
                    )}
                  </div>
                  {!font.isPreloaded && (
                    <p className="text-xs text-dev-warning mt-1">
                      Consider preloading this font
                    </p>
                  )}
                </div>
              );
            })}
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
                <Zap className="w-4 h-4 text-dev-accent shrink-0 mt-0.5" />
                <span className="text-sm text-dev-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!systemFontFallbacks && (
        <div className="dev-panel">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-dev-text mb-2">System Font Fallbacks</h3>
            <p className="text-sm text-dev-text-muted mb-3">
              Add system font fallbacks for faster initial render and reduced layout shift.
            </p>
            <code className="block text-xs bg-dev-surface-hover p-3 rounded">
              font-family: 'Your Font', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
