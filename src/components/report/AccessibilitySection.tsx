import type { AccessibilityAnalysis, A11yViolation } from '@/types';
import { Accessibility, AlertCircle, CheckCircle, Info, Shield } from 'lucide-react';

interface AccessibilitySectionProps {
  accessibility: AccessibilityAnalysis;
}

function getSeverityIcon(severity: A11yViolation['severity']) {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    case 'serious':
      return <AlertCircle className="w-4 h-4 text-orange-400" />;
    case 'moderate':
      return <Info className="w-4 h-4 text-yellow-400" />;
    case 'minor':
      return <Info className="w-4 h-4 text-blue-400" />;
  }
}

function getSeverityClass(severity: A11yViolation['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'serious':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'moderate':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'minor':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
}

function getWCAGBadge(level: A11yViolation['wcagLevel']) {
  const colors = {
    A: 'bg-green-500/20 text-green-400',
    AA: 'bg-blue-500/20 text-blue-400',
    AAA: 'bg-purple-500/20 text-purple-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${colors[level]}`}>
      WCAG {level}
    </span>
  );
}

export function AccessibilitySection({ accessibility }: AccessibilitySectionProps) {
  const { score, violations, passed, wcagLevel, stats } = accessibility;

  const criticalViolations = violations.filter(v => v.severity === 'critical');
  const seriousViolations = violations.filter(v => v.severity === 'serious');
  const otherViolations = violations.filter(v => v.severity === 'moderate' || v.severity === 'minor');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Accessibility className="w-5 h-5 text-dev-accent" />
          <h2 className="text-lg font-semibold text-dev-text">Accessibility</h2>
        </div>
        <div className="flex items-center gap-3">
          {getWCAGBadge(wcagLevel)}
          <div className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${score >= 90 ? 'bg-green-500/20 text-green-400' :
              score >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'}
          `}>
            Score: {score}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="metric-card">
          <span className="metric-label">Total Issues</span>
          <span className="metric-value">{stats.total}</span>
        </div>
        <div className="metric-card border-red-500/30">
          <span className="metric-label text-red-400">Critical</span>
          <span className="metric-value text-red-400">{stats.critical}</span>
        </div>
        <div className="metric-card border-orange-500/30">
          <span className="metric-label text-orange-400">Serious</span>
          <span className="metric-value text-orange-400">{stats.serious}</span>
        </div>
        <div className="metric-card border-yellow-500/30">
          <span className="metric-label text-yellow-400">Moderate</span>
          <span className="metric-value text-yellow-400">{stats.moderate}</span>
        </div>
        <div className="metric-card border-green-500/30">
          <span className="metric-label text-green-400">Passed</span>
          <span className="metric-value text-green-400">{passed.length}</span>
        </div>
      </div>

      {/* Critical Violations */}
      {criticalViolations.length > 0 && (
        <div className="dev-panel border-red-500/30">
          <div className="px-4 py-3 border-b border-red-500/30 bg-red-500/5">
            <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Critical Violations ({criticalViolations.length})
            </h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {criticalViolations.map((violation, i) => (
              <div key={i} className="p-4">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(violation.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-dev-text">{violation.rule}</span>
                      {getWCAGBadge(violation.wcagLevel)}
                    </div>
                    <p className="text-sm text-dev-text-muted mb-2">{violation.message}</p>
                    <code className="block text-xs bg-dev-surface-hover p-2 rounded mb-2">
                      {violation.element}
                    </code>
                    <div className="flex items-start gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-dev-text">{violation.fix}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Serious Violations */}
      {seriousViolations.length > 0 && (
        <div className="dev-panel border-orange-500/30">
          <div className="px-4 py-3 border-b border-orange-500/30 bg-orange-500/5">
            <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Serious Violations ({seriousViolations.length})
            </h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {seriousViolations.map((violation, i) => (
              <div key={i} className="p-4">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(violation.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-dev-text">{violation.rule}</span>
                      {getWCAGBadge(violation.wcagLevel)}
                    </div>
                    <p className="text-sm text-dev-text-muted mb-2">{violation.message}</p>
                    <code className="block text-xs bg-dev-surface-hover p-2 rounded mb-2">
                      {violation.element}
                    </code>
                    <div className="flex items-start gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-dev-text">{violation.fix}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Violations */}
      {otherViolations.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text">
              Other Violations ({otherViolations.length})
            </h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {otherViolations.map((violation, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-dev-text">{violation.rule}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${getSeverityClass(violation.severity)}`}>
                      {violation.severity}
                    </span>
                    {getWCAGBadge(violation.wcagLevel)}
                  </div>
                </div>
                <p className="text-sm text-dev-text-muted">{violation.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Passed Checks */}
      {passed.length > 0 && (
        <div className="dev-panel border-green-500/30">
          <div className="px-4 py-3 border-b border-green-500/30 bg-green-500/5">
            <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Passed Checks ({passed.length})
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {passed.map((check, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-dev-text">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  {check}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WCAG Compliance Info */}
      <div className="dev-panel">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-dev-text mb-3">WCAG Compliance Levels</h3>
          <div className="space-y-2 text-sm text-dev-text-muted">
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">A</span>
              <span>Minimum level - essential accessibility features</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">AA</span>
              <span>Standard level - addresses major barriers (recommended)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">AAA</span>
              <span>Enhanced level - highest accessibility standard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
