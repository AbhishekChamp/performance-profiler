import type { ReactAnalysis } from '@/types';
import { Component, AlertTriangle, Layers, ArrowRight } from 'lucide-react';

interface ReactSectionProps {
  react: ReactAnalysis;
}

export function ReactSection({ react }: ReactSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Component className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">React Analysis</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Components</span>
          <span className="metric-value">{react.totalComponents}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Inline Functions</span>
          <span className={`metric-value ${react.componentsWithInlineFunctions > 0 ? 'text-dev-warning-bright' : 'text-dev-text'}`}>
            {react.componentsWithInlineFunctions}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Excessive Props</span>
          <span className={`metric-value ${react.excessiveProps.length > 0 ? 'text-dev-warning-bright' : 'text-dev-text'}`}>
            {react.excessiveProps.length}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Max Depth</span>
          <span className="metric-value">{react.deepestComponent?.depth || 0}</span>
        </div>
      </div>

      {/* Warnings */}
      {react.warnings.length > 0 && (
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-3">Warnings</h3>
          <div className="space-y-2">
            {react.warnings.map((warning, i) => (
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
                  {warning.component && (
                    <code className="text-xs text-dev-text-muted mt-1 block">{warning.component}</code>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Largest Component */}
      {react.largestComponent && react.largestComponent.lines > 100 && (
        <div className="dev-panel p-4 border-dev-warning/30">
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-dev-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-dev-warning-bright mb-2">
                Large Component Detected
              </h3>
              <p className="text-sm text-dev-text mb-2">
                <code>{react.largestComponent.name}</code> has {react.largestComponent.lines} lines
              </p>
              <p className="text-xs text-dev-text-muted">
                Consider splitting this component into smaller, more manageable pieces.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Component List */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dev-text">Components</h3>
          <span className="text-xs text-dev-text-muted">{react.totalComponents} total</span>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {react.components.map((comp, i) => (
            <div 
              key={i} 
              className="px-4 py-3 border-b border-dev-border-subtle last:border-0 hover:bg-dev-surface-hover"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Component className="w-4 h-4 text-dev-accent" />
                  <code className="text-sm font-medium text-dev-text">{comp.name}</code>
                </div>
                <span className="text-xs text-dev-text-muted">{comp.lines} lines</span>
              </div>
              
              <div className="flex items-center gap-4 text-xs">
                <span className="text-dev-text-subtle">{comp.propCount} props</span>
                <span className="text-dev-text-subtle">Depth: {comp.depth}</span>
                {comp.hasInlineFunctions && (
                  <span className="text-dev-warning-bright">
                    {comp.inlineFunctionCount} inline functions
                  </span>
                )}
              </div>

              {comp.children.length > 0 && (
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="text-dev-text-subtle">Children:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {comp.children.slice(0, 5).map((child, j) => (
                      <span key={j}>
                        <code className="text-dev-text-muted">{child}</code>
                        {j < Math.min(comp.children.length, 5) - 1 && (
                          <ArrowRight className="w-3 h-3 inline mx-1 text-dev-text-subtle" />
                        )}
                      </span>
                    ))}
                    {comp.children.length > 5 && (
                      <span className="text-dev-text-subtle">+{comp.children.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
