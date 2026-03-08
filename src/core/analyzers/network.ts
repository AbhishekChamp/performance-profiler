import type { NetworkAnalysis, ResourceHint, RenderBlockingResource } from '@/types';

export function analyzeNetwork(htmlContent: string): NetworkAnalysis {
  const hints: ResourceHint[] = [];
  const missingHints: string[] = [];
  const renderBlocking: RenderBlockingResource[] = [];
  const http2PushSuggestions: string[] = [];

  if (!htmlContent) {
    return {
      hints: [],
      missingHints: ['No HTML content to analyze'],
      renderBlocking: [],
      criticalCSSSize: 0,
      http2PushSuggestions: [],
      score: 50,
    };
  }

  // Parse resource hints
  const preloadRegex = /<link[^>]*rel=["']preload["'][^>]*>/gi;
  const prefetchRegex = /<link[^>]*rel=["']prefetch["'][^>]*>/gi;
  const preconnectRegex = /<link[^>]*rel=["']preconnect["'][^>]*>/gi;
  const dnsPrefetchRegex = /<link[^>]*rel=["']dns-prefetch["'][^>]*>/gi;
  const modulepreloadRegex = /<link[^>]*rel=["']modulepreload["'][^>]*>/gi;

  const extractHint = (match: string, type: ResourceHint['type']): ResourceHint | null => {
    const hrefMatch = match.match(/href=["']([^"']+)["']/i);
    const asMatch = match.match(/as=["']([^"']+)["']/i);
    const crossoriginMatch = match.match(/crossorigin(?:=["']?([^"'>\s]*)["']?)?/i);

    if (!hrefMatch) return null;

    return {
      type,
      href: hrefMatch[1],
      as: asMatch?.[1],
      crossorigin: crossoriginMatch !== null,
    };
  };

  // Extract all hints
  let match: RegExpExecArray | null;

  while ((match = preloadRegex.exec(htmlContent)) !== null) {
    const hint = extractHint(match[0], 'preload');
    if (hint) hints.push(hint);
  }

  while ((match = prefetchRegex.exec(htmlContent)) !== null) {
    const hint = extractHint(match[0], 'prefetch');
    if (hint) hints.push(hint);
  }

  while ((match = preconnectRegex.exec(htmlContent)) !== null) {
    const hint = extractHint(match[0], 'preconnect');
    if (hint) hints.push(hint);
  }

  while ((match = dnsPrefetchRegex.exec(htmlContent)) !== null) {
    const hint = extractHint(match[0], 'dns-prefetch');
    if (hint) hints.push(hint);
  }

  while ((match = modulepreloadRegex.exec(htmlContent)) !== null) {
    const hint = extractHint(match[0], 'modulepreload');
    if (hint) hints.push(hint);
  }

  // Check for external domains that could benefit from preconnect
  const externalDomains = new Set<string>();
  const domainRegex = /(?:href|src)=["']https?:\/\/([^/"']+)/gi;
  while ((match = domainRegex.exec(htmlContent)) !== null) {
    const domain = match[1];
    // Skip same-origin (we don't know the origin, so assume common CDNs)
    const cdnDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'cdn.jsdelivr.net',
      'unpkg.com',
      'cdnjs.cloudflare.com',
      'ajax.googleapis.com',
    ];
    if (cdnDomains.some(cdn => domain.includes(cdn))) {
      externalDomains.add(domain);
    }
  }

  // Check which domains are missing preconnect
  const preconnectedDomains = new Set(
    hints
      .filter(h => h.type === 'preconnect' || h.type === 'dns-prefetch')
      .map(h => {
        try {
          return new URL(h.href).hostname;
        } catch {
          return h.href;
        }
      })
  );

  for (const domain of externalDomains) {
    if (!preconnectedDomains.has(domain)) {
      missingHints.push(`Add preconnect for ${domain}`);
      http2PushSuggestions.push(`Preconnect to ${domain}`);
    }
  }

  // Check for render-blocking CSS
  const cssRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi;
  while ((match = cssRegex.exec(htmlContent)) !== null) {
    const tag = match[0];
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    const mediaMatch = tag.match(/media=["']([^"']+)["']/i);
    const href = hrefMatch?.[1] || 'unknown';

    // CSS is render-blocking if:
    // 1. No media attribute, or
    // 2. Media is "all" or "screen"
    const isRenderBlocking = !mediaMatch ||
      mediaMatch[1] === 'all' ||
      mediaMatch[1] === 'screen';

    if (isRenderBlocking) {
      renderBlocking.push({
        type: 'css',
        path: href,
        reason: 'Render-blocking stylesheet',
        suggestion: mediaMatch
          ? 'Consider using media queries to make non-critical'
          : 'Add media attribute or inline critical CSS',
      });
    }
  }

  // Check for render-blocking JavaScript
  const jsRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((match = jsRegex.exec(htmlContent)) !== null) {
    const tag = match[0];
    const src = match[1];

    // JS is render-blocking if:
    // 1. No async or defer attribute
    const hasAsync = /\sasync(?:\s|=|>)/i.test(tag);
    const hasDefer = /\sdefer(?:\s|=|>)/i.test(tag);
    const isModule = /\stype=["']module["']/i.test(tag);

    if (!hasAsync && !hasDefer && !isModule) {
      renderBlocking.push({
        type: 'js',
        path: src,
        reason: 'Synchronous JavaScript blocks parsing',
        suggestion: 'Add async or defer attribute',
      });
    }
  }

  // Check for missing preloads on critical resources
  const preloadedResources = new Set(hints.filter(h => h.type === 'preload').map(h => h.href));

  // Extract all CSS and JS resources
  const allResources = new Set<string>();
  const allCssMatch = htmlContent.match(/href=["']([^"']+\.css)["']/gi) || [];
  const allJsMatch = htmlContent.match(/src=["']([^"']+\.js)["']/gi) || [];

  for (const m of allCssMatch) {
    const href = m.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) allResources.add(href);
  }
  for (const m of allJsMatch) {
    const src = m.match(/src=["']([^"']+)["']/i)?.[1];
    if (src) allResources.add(src);
  }

  // First 2 CSS and first 2 JS are likely critical
  const resourcesArray = [...allResources];
  for (let i = 0; i < Math.min(2, resourcesArray.length); i++) {
    const resource = resourcesArray[i];
    if (!preloadedResources.has(resource) && resource.match(/\.(css|js)$/)) {
      const type = resource.endsWith('.css') ? 'style' : 'script';
      missingHints.push(`Consider preloading critical ${type}: ${resource}`);
    }
  }

  // Calculate critical CSS size (estimate based on first stylesheet)
  let criticalCSSSize = 0;
  const firstCss = htmlContent.match(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/i);
  if (firstCss) {
    // Assume first 20% of CSS is critical (rough estimate)
    criticalCSSSize = 0;
  }

  // Calculate score
  let score = 100;

  // Deduct for missing preconnects
  score -= missingHints.filter(h => h.includes('preconnect')).length * 5;

  // Deduct for render-blocking resources
  score -= renderBlocking.length * 10;

  // Deduct for missing preloads
  score -= missingHints.filter(h => h.includes('preload')).length * 3;

  // Bonus for having good hints
  score += Math.min(10, hints.filter(h => h.type === 'preconnect').length * 2);

  return {
    hints,
    missingHints: [...new Set(missingHints)],
    renderBlocking,
    criticalCSSSize,
    http2PushSuggestions: [...new Set(http2PushSuggestions)],
    score: Math.max(0, Math.min(100, score)),
  };
}
