import type { SecurityAnalysis, SecurityVulnerability } from '@/types';
import { AlertTriangle, CheckCircle, Code, ExternalLink, Lock, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface SecuritySectionProps {
  security: SecurityAnalysis;
}

function getSeverityIcon(severity: SecurityVulnerability['severity']): React.ReactNode {
  switch (severity) {
    case 'critical':
      return <ShieldAlert className="w-5 h-5 text-red-400" />;
    case 'high':
      return <AlertTriangle className="w-5 h-5 text-orange-400" />;
    case 'medium':
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    case 'low':
      return <AlertTriangle className="w-5 h-4 text-blue-400" />;
  }
}

function getSeverityClass(severity: SecurityVulnerability['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
}

function getTypeIcon(type: SecurityVulnerability['type']): React.ReactNode {
  switch (type) {
    case 'xss':
      return <Code className="w-4 h-4" />;
    case 'eval':
      return <Code className="w-4 h-4" />;
    case 'inline-script':
      return <Code className="w-4 h-4" />;
    case 'mixed-content':
      return <ExternalLink className="w-4 h-4" />;
    case 'hardcoded-secret':
      return <Lock className="w-4 h-4" />;
    case 'missing-sri':
      return <Shield className="w-4 h-4" />;
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
}

function getTypeLabel(type: SecurityVulnerability['type']): string {
  const labels: Record<string, string> = {
    'xss': 'XSS',
    'eval': 'Eval Usage',
    'inline-script': 'Inline Script',
    'mixed-content': 'Mixed Content',
    'hardcoded-secret': 'Hardcoded Secret',
    'missing-sri': 'Missing SRI',
  };
  return labels[type] || type;
}

export function SecuritySection({ security }: SecuritySectionProps): React.ReactNode {
  const { score, vulnerabilities, stats, recommendations } = security;

  const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
  const highVulns = vulnerabilities.filter(v => v.severity === 'high');
  const mediumVulns = vulnerabilities.filter(v => v.severity === 'medium');
  const lowVulns = vulnerabilities.filter(v => v.severity === 'low');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-dev-accent" />
          <h2 className="text-lg font-semibold text-dev-text">Security Analysis</h2>
        </div>
        <div className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${score >= 90 ? 'bg-green-500/20 text-green-400' :
            score >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
            score >= 50 ? 'bg-orange-500/20 text-orange-400' :
            'bg-red-500/20 text-red-400'}
        `}>
          Score: {score}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="metric-card">
          <span className="metric-label">Total Issues</span>
          <span className="metric-value">{vulnerabilities.length}</span>
        </div>
        <div className="metric-card border-red-500/30">
          <span className="metric-label text-red-400">Critical</span>
          <span className="metric-value text-red-400">{stats.critical}</span>
        </div>
        <div className="metric-card border-orange-500/30">
          <span className="metric-label text-orange-400">High</span>
          <span className="metric-value text-orange-400">{stats.high}</span>
        </div>
        <div className="metric-card border-yellow-500/30">
          <span className="metric-label text-yellow-400">Medium</span>
          <span className="metric-value text-yellow-400">{stats.medium}</span>
        </div>
        <div className="metric-card border-blue-500/30">
          <span className="metric-label text-blue-400">Low</span>
          <span className="metric-value text-blue-400">{stats.low}</span>
        </div>
      </div>

      {/* Security Status */}
      {vulnerabilities.length === 0 ? (
        <div className="dev-panel border-green-500/30 bg-green-500/5">
          <div className="flex items-center justify-center gap-3 p-8">
            <ShieldCheck className="w-12 h-12 text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-green-400">No Security Issues Found</h3>
              <p className="text-sm text-dev-text-muted">Your code appears to follow security best practices.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Critical Vulnerabilities */}
          {criticalVulns.length > 0 && (
            <div className="dev-panel border-red-500/30">
              <div className="px-4 py-3 border-b border-red-500/30 bg-red-500/5">
                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Critical Vulnerabilities ({criticalVulns.length}) - Immediate Action Required
                </h3>
              </div>
              <div className="divide-y divide-dev-border-subtle">
                {criticalVulns.map((vuln, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(vuln.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${getSeverityClass(vuln.severity)}`}>
                            {getTypeIcon(vuln.type)}
                            {getTypeLabel(vuln.type)}
                          </span>
                          <span className="text-xs text-dev-text-subtle">{vuln.file}:{vuln.line}</span>
                        </div>
                        <p className="text-sm text-dev-text mb-2">{vuln.message}</p>
                        {vuln.code && (
                          <code className="block text-xs bg-dev-surface-hover p-2 rounded mb-2 overflow-x-auto">
                            {vuln.code}
                          </code>
                        )}
                        <div className="flex items-start gap-2 text-sm">
                          <ShieldCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          <span className="text-dev-text">{vuln.fix}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High Vulnerabilities */}
          {highVulns.length > 0 && (
            <div className="dev-panel border-orange-500/30">
              <div className="px-4 py-3 border-b border-orange-500/30 bg-orange-500/5">
                <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  High Severity Issues ({highVulns.length})
                </h3>
              </div>
              <div className="divide-y divide-dev-border-subtle">
                {highVulns.map((vuln, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(vuln.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${getSeverityClass(vuln.severity)}`}>
                            {getTypeIcon(vuln.type)}
                            {getTypeLabel(vuln.type)}
                          </span>
                          <span className="text-xs text-dev-text-subtle">{vuln.file}:{vuln.line}</span>
                        </div>
                        <p className="text-sm text-dev-text mb-2">{vuln.message}</p>
                        {vuln.code && (
                          <code className="block text-xs bg-dev-surface-hover p-2 rounded mb-2 overflow-x-auto">
                            {vuln.code}
                          </code>
                        )}
                        <div className="flex items-start gap-2 text-sm">
                          <ShieldCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          <span className="text-dev-text">{vuln.fix}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medium/Low Vulnerabilities */}
          {(mediumVulns.length > 0 || lowVulns.length > 0) && (
            <div className="dev-panel">
              <div className="px-4 py-3 border-b border-dev-border">
                <h3 className="text-sm font-semibold text-dev-text">
                  Other Issues ({mediumVulns.length + lowVulns.length})
                </h3>
              </div>
              <div className="divide-y divide-dev-border-subtle">
                {[...mediumVulns, ...lowVulns].map((vuln, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-dev-text">{getTypeLabel(vuln.type)}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${getSeverityClass(vuln.severity)}`}>
                          {vuln.severity}
                        </span>
                        <span className="text-xs text-dev-text-subtle">{vuln.file}:{vuln.line}</span>
                      </div>
                    </div>
                    <p className="text-sm text-dev-text-muted">{vuln.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text">Security Recommendations</h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {recommendations.map((rec, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-dev-accent shrink-0 mt-0.5" />
                <span className="text-sm text-dev-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Best Practices */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text">Security Best Practices</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Use Content Security Policy (CSP)</p>
              <p className="text-xs text-dev-text-muted">Prevents XSS and data injection attacks</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Avoid using innerHTML and document.write</p>
              <p className="text-xs text-dev-text-muted">Use textContent or sanitize HTML</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Never use eval() or new Function()</p>
              <p className="text-xs text-dev-text-muted">These execute arbitrary code</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Use SRI for external resources</p>
              <p className="text-xs text-dev-text-muted">Ensures loaded resources haven't been tampered with</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-dev-text">Store secrets in environment variables</p>
              <p className="text-xs text-dev-text-muted">Never hardcode API keys or credentials</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
