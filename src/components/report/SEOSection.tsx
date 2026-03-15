import type { SEOAnalysis } from '@/types';
import { AlertCircle, CheckCircle, FileText, Globe, Hash, Link, Search } from 'lucide-react';

interface SEOSectionProps {
  seo: SEOAnalysis;
}

export function SEOSection({ seo }: SEOSectionProps): React.ReactNode {
  const { meta, openGraph, twitterCard, structuredData, headings, score, issues } = seo;

  const hasIssues = issues.length > 0;
  const criticalIssues = issues.filter(i => i.includes('Missing') || i.includes('title') || i.includes('description'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-dev-accent" />
          <h2 className="text-lg font-semibold text-dev-text">SEO Analysis</h2>
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

      {/* Meta Tags Card */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Meta Tags
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-dev-text">Title</span>
              <span className={`text-xs ${
                meta.titleLength >= 50 && meta.titleLength <= 60 ? 'text-green-400' :
                meta.titleLength > 0 ? 'text-yellow-400' : 'text-red-400'
              }}`}>
                {meta.titleLength} chars
                {meta.titleLength > 0 && (meta.titleLength < 30 || meta.titleLength > 60) && ' (optimal: 50-60)'}
              </span>
            </div>
            <div className="p-3 bg-dev-surface-hover rounded">
              {meta.title ? (
                <p className="text-dev-text">{meta.title}</p>
              ) : (
                <p className="text-dev-text-subtle italic">No title found</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-dev-text">Description</span>
              <span className={`text-xs ${
                meta.descriptionLength >= 150 && meta.descriptionLength <= 160 ? 'text-green-400' :
                meta.descriptionLength > 0 ? 'text-yellow-400' : 'text-red-400'
              }}`}>
                {meta.descriptionLength} chars
                {meta.descriptionLength > 0 && (meta.descriptionLength < 120 || meta.descriptionLength > 160) && ' (optimal: 150-160)'}
              </span>
            </div>
            <div className="p-3 bg-dev-surface-hover rounded">
              {meta.description ? (
                <p className="text-dev-text">{meta.description}</p>
              ) : (
                <p className="text-dev-text-subtle italic">No description found</p>
              )}
            </div>
          </div>

          {/* Other Meta Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-dev-text">Viewport</span>
              <p className="text-sm text-dev-text-muted mt-1">
                {meta.viewport ? (
                  <CheckCircle className="w-4 h-4 text-green-400 inline mr-1" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 inline mr-1" />
                )}
                {meta.viewport || 'Missing'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-dev-text">Canonical</span>
              <p className="text-sm text-dev-text-muted mt-1">
                {meta.canonical != null ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400 inline mr-1" />
                    <span className="truncate">{meta.canonical}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-400 inline mr-1" />
                    Not set
                  </>
                )}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-dev-text">Robots</span>
              <p className="text-sm text-dev-text-muted mt-1">
                {meta.robots ?? (
                  <span className="text-dev-text-subtle">Not set (defaults to index, follow)</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Graph */}
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Open Graph (Facebook)
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {openGraph.title != null ? (
              <>
                <div>
                  <span className="text-xs text-dev-text-subtle">Title</span>
                  <p className="text-sm text-dev-text">{openGraph.title}</p>
                </div>
                {openGraph.description != null && (
                  <div>
                    <span className="text-xs text-dev-text-subtle">Description</span>
                    <p className="text-sm text-dev-text">{openGraph.description}</p>
                  </div>
                )}
                {openGraph.image != null && (
                  <div>
                    <span className="text-xs text-dev-text-subtle">Image</span>
                    <p className="text-sm text-dev-text truncate">{openGraph.image}</p>
                  </div>
                )}
                {openGraph.type != null && (
                  <div>
                    <span className="text-xs text-dev-text-subtle">Type</span>
                    <p className="text-sm text-dev-text">{openGraph.type}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Open Graph tags not found</span>
              </div>
            )}
          </div>
        </div>

        {/* Twitter Card */}
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Twitter Card
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {twitterCard.title != null || openGraph.title != null ? (
              <>
                <div>
                  <span className="text-xs text-dev-text-subtle">Title</span>
                  <p className="text-sm text-dev-text">{twitterCard.title ?? openGraph.title}</p>
                </div>
                {(twitterCard.description ?? openGraph.description) != null && (
                  <div>
                    <span className="text-xs text-dev-text-subtle">Description</span>
                    <p className="text-sm text-dev-text">{twitterCard.description ?? openGraph.description}</p>
                  </div>
                )}
                {(twitterCard.image ?? openGraph.image) != null && (
                  <div>
                    <span className="text-xs text-dev-text-subtle">Image</span>
                    <p className="text-sm text-dev-text truncate">{twitterCard.image ?? openGraph.image}</p>
                  </div>
                )}
                {twitterCard.type != null && (
                  <div>
                    <span className="text-xs text-dev-text-subtle">Card Type</span>
                    <p className="text-sm text-dev-text">{twitterCard.type}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Twitter Card tags not found</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Headings */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Heading Structure
          </h3>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-dev-accent/20 text-dev-accent">H1</span>
              <span className="text-sm text-dev-text">{headings.h1.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-dev-info/20 text-dev-info">H2</span>
              <span className="text-sm text-dev-text">{headings.h2.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-dev-success/20 text-dev-success">H3</span>
              <span className="text-sm text-dev-text">{headings.h3.length}</span>
            </div>
            {headings.hierarchyValid ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-400" />
            )}
          </div>

          {headings.h1.length > 0 && (
            <div className="mb-3">
              <span className="text-xs text-dev-text-subtle">H1 Headings</span>
              <ul className="mt-1 space-y-1">
                {headings.h1.map((h, i) => (
                  <li key={i} className="text-sm text-dev-text truncate">{h}</li>
                ))}
              </ul>
            </div>
          )}

          {headings.h2.length > 0 && (
            <div>
              <span className="text-xs text-dev-text-subtle">H2 Headings ({headings.h2.length})</span>
            </div>
          )}
        </div>
      </div>

      {/* Structured Data */}
      {structuredData.length > 0 && (
        <div className="dev-panel">
          <div className="px-4 py-3 border-b border-dev-border">
            <h3 className="text-sm font-semibold text-dev-text flex items-center gap-2">
              <Link className="w-4 h-4" />
              Structured Data (JSON-LD) ({structuredData.length})
            </h3>
          </div>
          <div className="p-4">
            {structuredData.map((data, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <span className="text-xs px-2 py-0.5 rounded bg-dev-accent/20 text-dev-accent">
                  {(data as Record<string, string>)['@type'] || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {hasIssues && (
        <div className={`dev-panel ${criticalIssues.length > 0 ? 'border-red-500/30' : 'border-yellow-500/30'}`}>
          <div className={`px-4 py-3 border-b ${criticalIssues.length > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${criticalIssues.length > 0 ? 'text-red-400' : 'text-yellow-400'}`}>
              <AlertCircle className="w-4 h-4" />
              SEO Issues ({issues.length})
            </h3>
          </div>
          <div className="divide-y divide-dev-border-subtle">
            {issues.map((issue, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${criticalIssues.includes(issue) ? 'text-red-400' : 'text-yellow-400'}`} />
                <span className="text-sm text-dev-text">{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
