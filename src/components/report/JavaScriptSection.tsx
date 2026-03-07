import { BarChart } from '../charts/BarChart';
import type { JSFileAnalysis, JSFunction } from '@/types';
import { Braces, AlertTriangle, FunctionSquare } from 'lucide-react';

interface JavaScriptSectionProps {
  js: JSFileAnalysis[];
}

function formatComplexity(complexity: number): { text: string; color: string } {
  if (complexity <= 10) return { text: 'Low', color: '#3fb950' };
  if (complexity <= 20) return { text: 'Medium', color: '#d29922' };
  return { text: 'High', color: '#f85149' };
}

export function JavaScriptSection({ js }: JavaScriptSectionProps) {
  const allFunctions = js.flatMap(f => 
    f.functions.map(fn => ({ ...fn, file: f.path }))
  );

  const complexFunctions = allFunctions
    .filter(f => f.cyclomaticComplexity > 10)
    .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
    .slice(0, 10)
    .map(f => ({
      label: `${f.name}()`,
      value: f.cyclomaticComplexity,
      color: f.cyclomaticComplexity > 20 ? '#f85149' : '#d29922',
    }));

  const totalLines = js.reduce((sum, f) => sum + f.lines, 0);
  const totalFunctions = allFunctions.length;
  const avgComplexity = totalFunctions > 0 
    ? allFunctions.reduce((sum, f) => sum + f.cyclomaticComplexity, 0) / totalFunctions 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Braces className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">JavaScript Analysis</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Files Analyzed</span>
          <span className="metric-value">{js.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total Lines</span>
          <span className="metric-value">{totalLines.toLocaleString()}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Functions</span>
          <span className="metric-value">{totalFunctions}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Avg Complexity</span>
          <span className={`metric-value ${avgComplexity > 15 ? 'text-dev-danger-bright' : avgComplexity > 10 ? 'text-dev-warning-bright' : 'text-dev-success-bright'}`}>
            {avgComplexity.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Warnings */}
      {js.some(f => f.warnings.length > 0) && (
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-3">Warnings</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {js.flatMap(f => f.warnings).map((warning, i) => (
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
                  {warning.function && warning.line && (
                    <p className="text-xs text-dev-text-muted mt-1">
                      {warning.function} at line {warning.line}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complex Functions */}
      {complexFunctions.length > 0 && (
        <div className="dev-panel p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-4">Most Complex Functions</h3>
          <BarChart data={complexFunctions} height={250} />
        </div>
      )}

      {/* File Details */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text">File Details</h3>
        </div>
        <div className="divide-y divide-dev-border-subtle">
          {js.map((file, i) => (
            <div key={i} className="px-4 py-3 hover:bg-dev-surface-hover">
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm text-dev-text">{file.path}</code>
                <span className="text-xs text-dev-text-muted">{file.lines} lines</span>
              </div>
              
              <div className="flex items-center gap-4 text-xs">
                <span className="text-dev-text-subtle">
                  {file.functions.length} functions
                </span>
                {file.mostComplexFunction && (
                  <span className="text-dev-warning-bright">
                    Highest complexity: {file.mostComplexFunction.cyclomaticComplexity}
                  </span>
                )}
                {file.largestFunction && file.largestFunction.lines > 50 && (
                  <span className="text-dev-danger-bright">
                    Largest: {file.largestFunction.lines} lines
                  </span>
                )}
              </div>

              {file.functions.slice(0, 5).map((fn, j) => {
                const complexity = formatComplexity(fn.cyclomaticComplexity);
                return (
                  <div key={j} className="flex items-center gap-3 mt-2 pl-4">
                    <FunctionSquare className="w-3 h-3 text-dev-text-subtle" />
                    <code className="text-xs text-dev-text-muted">{fn.name}()</code>
                    <span className="text-xs" style={{ color: complexity.color }}>
                      Complexity: {fn.cyclomaticComplexity}
                    </span>
                    <span className="text-xs text-dev-text-subtle">
                      {fn.lines} lines
                    </span>
                    {fn.nestedLoops > 0 && (
                      <span className="text-xs text-dev-warning-bright">
                        {fn.nestedLoops} nested loops
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
