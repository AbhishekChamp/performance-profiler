import type { NetworkAnalysis } from '@/types';
import { AlertTriangle, CheckCircle, Download, FileCode, Globe, Link2, Zap } from 'lucide-react';

interface NetworkSectionProps {
  network: NetworkAnalysis;
}

export function NetworkSection({ network }: NetworkSectionProps): React.ReactNode {
  const { hints, missingHints, renderBlocking, http2PushSuggestions, score } = network;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-dev-accent" />
          <h2 className="text-lg font-semibold text-dev-text">Network Analysis</h2>
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

      {/* Resource Hints */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Resource Hints ({hints.length})
          </h3>
        </div>
        {hints.length > 0 ? (
          <div className="divide-y divide-dev-border-subtle">
            {hints.map((hint, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-dev-surface-hover">
                <div>
                  <span className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                    ${hint.type === 'preload' ? 'bg-purple-500/20 text-purple-400' :
                      hint.type === 'preconnect' ? 'bg-blue-500/20 text-blue-400' :
                      hint.type === 'dns-prefetch' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'}
                  `}>
                    {hint.type}
                  </span>
                  {hint.as != null && hint.as !== '' && (
                    <span className="ml-2 text-xs text-dev-text-subtle">as: {hint.as}</span>
                  )}
                  <p className="text-sm text-dev-text mt-1 truncate max-w-md">{hint.href}</p>
                </div>
                {hint.crossorigin != null && hint.crossorigin && (
                  <span className="text-xs text-dev-text-subtle">crossorigin</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-dev-text-muted">
            No resource hints found
          </div>
        )}
      </div>

      {/* Missing Hints */}
      {missingHints.length > 0 && (
        <div className="dev-panel border-dev-warning/30">
          <div className="px-4 py-3 border-b border-dev-warning/30 bg-dev-warning/5">
            <h3 className="text-sm font-semibold text-dev-warning flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Missing Resource Hints ({missingHints.length})
            </h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {missingHints.map((hint, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <Zap className="w-4 h-4 text-dev-warning shrink-0 mt-0.5" />
                <span className="text-sm text-dev-text">{hint}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render Blocking Resources */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text flex items-center gap-2">
            <Download className="w-4 h-4" />
            Render-Blocking Resources ({renderBlocking.length})
          </h3>
        </div>
        {renderBlocking.length > 0 ? (
          <div className="divide-y divide-dev-border-subtle">
            {renderBlocking.map((resource, i) => (
              <div key={i} className="px-4 py-3 hover:bg-dev-surface-hover">
                <div className="flex items-center gap-2 mb-1">
                  {resource.type === 'css' ? (
                    <FileCode className="w-4 h-4 text-dev-info" />
                  ) : (
                    <FileCode className="w-4 h-4 text-dev-warning" />
                  )}
                  <span className="text-sm font-medium text-dev-text">{resource.path}</span>
                  <span className={`
                    text-xs px-1.5 py-0.5 rounded
                    ${resource.type === 'css' ? 'bg-dev-info/20 text-dev-info' : 'bg-dev-warning/20 text-dev-warning'}
                  `}>
                    {resource.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-dev-text-muted ml-6">{resource.reason}</p>
                <p className="text-xs text-dev-accent ml-6 mt-1">{resource.suggestion}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-dev-text-muted">No render-blocking resources detected</p>
          </div>
        )}
      </div>

      {/* HTTP/2 Push Suggestions */}
      {http2PushSuggestions.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text">HTTP/2 Push Suggestions</h3>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {http2PushSuggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-dev-text-muted flex items-start gap-2">
                  <span className="text-dev-accent">→</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
