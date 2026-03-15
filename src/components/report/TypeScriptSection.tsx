import type { TypeScriptAnalysis } from '@/types';
import { AlertTriangle, CheckCircle, Code, FileCode, Settings, Shield } from 'lucide-react';

interface TypeScriptSectionProps {
  typescript: TypeScriptAnalysis;
}

export function TypeScriptSection({ typescript }: TypeScriptSectionProps): React.ReactNode {
  const { score, strictMode, anyCount, typeCoverage, issues, tsConfigChecks, recommendations } = typescript;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCode className="w-5 h-5 text-dev-accent" />
          <h2 className="text-lg font-semibold text-dev-text">TypeScript Quality</h2>
        </div>
        <div className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${score >= 90 ? 'bg-green-500/20 text-green-400' :
            score >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'}
        `}>
          Score: {score}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Strict Mode</span>
          <span className={strictMode ? 'metric-value text-green-400' : 'metric-value text-red-400'}>
            {strictMode ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Type Coverage</span>
          <span className={typeCoverage >= 80 ? 'metric-value text-green-400' : 'metric-value text-dev-warning'}>
            {typeCoverage}%
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">any Usage</span>
          <span className={anyCount === 0 ? 'metric-value text-green-400' : 'metric-value text-dev-warning'}>
            {anyCount}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Issues</span>
          <span className="metric-value">{issues.length}</span>
        </div>
      </div>

      {/* Strict Mode Warning */}
      {!strictMode && (
        <div className="dev-panel border-red-500/30">
          <div className="flex items-start gap-3 p-4">
            <Shield className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-400">Strict Mode Disabled</h3>
              <p className="text-sm text-dev-text-muted mt-1">
                TypeScript strict mode is not enabled. This reduces type safety and may hide potential bugs.
              </p>
              <code className="block mt-2 text-xs bg-dev-surface-hover p-2 rounded">
                {'{'}<br/>
                &nbsp;&nbsp;"compilerOptions": {'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"strict": true<br/>
                &nbsp;&nbsp;{'}'}<br/>
                {'}'}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Type Coverage Progress */}
      <div className="dev-panel p-4">
        <h3 className="text-sm font-semibold text-dev-text mb-3">Type Coverage</h3>
        <div className="h-4 bg-dev-surface-hover rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              typeCoverage >= 80 ? 'bg-green-400' :
              typeCoverage >= 50 ? 'bg-yellow-400' :
              'bg-red-400'
            }`}
            style={{ width: `${typeCoverage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-dev-text-muted">
          <span>0%</span>
          <span className={typeCoverage >= 80 ? 'text-green-400' : ''}>{typeCoverage}% typed</span>
          <span>100%</span>
        </div>
      </div>

      {/* tsconfig.json Checks */}
      {tsConfigChecks.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text flex items-center gap-2">
              <Settings className="w-4 h-4" />
              tsconfig.json Checks
            </h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {tsConfigChecks.map((check, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {check.enabled ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 ${
                      check.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                    }`} />
                  )}
                  <span className="text-sm text-dev-text">{check.option}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  check.enabled ? 'bg-green-500/20 text-green-400' :
                  check.severity === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {check.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues List */}
      {issues.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text flex items-center gap-2">
              <Code className="w-4 h-4" />
              Type Issues ({issues.length})
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-dev-border-subtle">
            {issues.map((issue, i) => (
              <div key={i} className="px-4 py-3 hover:bg-dev-surface-hover">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-dev-text">{issue.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    issue.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
                <p className="text-xs text-dev-text-muted">{issue.message}</p>
                <p className="text-xs text-dev-text-subtle mt-1">
                  {issue.file}:{issue.line}
                </p>
              </div>
            ))}
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
                <CheckCircle className="w-4 h-4 text-dev-accent shrink-0 mt-0.5" />
                <span className="text-sm text-dev-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Practices */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text">TypeScript Best Practices</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Enable strict mode</p>
              <p className="text-xs text-dev-text-muted">Catches more errors at compile time</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Avoid using `any`</p>
              <p className="text-xs text-dev-text-muted">Use `unknown` for truly unknown types</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Add explicit return types</p>
              <p className="text-xs text-dev-text-muted">Especially for exported functions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Use interface over type for objects</p>
              <p className="text-xs text-dev-text-muted">Better error messages and extensibility</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
