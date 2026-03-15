import type { OpenGraph, SEOAnalysis, SEOMeta } from '@/types';

export function analyzeSEO(htmlContent: string): SEOAnalysis {
  const issues: string[] = [];

  if (!htmlContent) {
    return {
      meta: {
        title: '',
        titleLength: 0,
        description: '',
        descriptionLength: 0,
        viewport: '',
      },
      openGraph: {},
      twitterCard: {},
      structuredData: [],
      headings: { h1: [], h2: [], h3: [], hierarchyValid: true },
      score: 0,
      issues: ['No HTML content to analyze'],
    };
  }

  // Extract meta title
  const titleMatch = htmlContent.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? '';
  const titleLength = title.length;

  if (titleLength === 0) {
    issues.push('Missing page title');
  } else if (titleLength < 30) {
    issues.push(`Title is too short (${titleLength} chars, recommended 50-60)`);
  } else if (titleLength > 60) {
    issues.push(`Title may be truncated in search results (${titleLength} chars)`);
  }

  // Extract meta description
  const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ??
                     htmlContent.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  const description = descMatch?.[1]?.trim() ?? '';
  const descriptionLength = description.length;

  if (descriptionLength === 0) {
    issues.push('Missing meta description');
  } else if (descriptionLength < 120) {
    issues.push(`Description is too short (${descriptionLength} chars, recommended 150-160)`);
  } else if (descriptionLength > 160) {
    issues.push(`Description may be truncated (${descriptionLength} chars)`);
  }

  // Extract viewport
  const viewportMatch = htmlContent.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["'][^>]*>/i) ??
                        htmlContent.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']viewport["'][^>]*>/i);
  const viewport = viewportMatch?.[1] ?? '';

  if (viewport === '') {
    issues.push('Missing viewport meta tag (affects mobile SEO)');
  }

  // Extract canonical URL
  const canonicalMatch = htmlContent.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i) ??
                         htmlContent.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i);
  const canonical = canonicalMatch?.[1];

  if (canonical === undefined) {
    issues.push('Missing canonical URL');
  }

  // Extract robots meta
  const robotsMatch = htmlContent.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i) ??
                      htmlContent.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']robots["'][^>]*>/i);
  const robots = robotsMatch?.[1];

  const meta: SEOMeta = {
    title,
    titleLength,
    description,
    descriptionLength,
    viewport,
    canonical,
    robots,
  };

  // Extract Open Graph tags
  const openGraph: OpenGraph = {};
  const ogTitleMatch = htmlContent.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogDescMatch = htmlContent.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogImageMatch = htmlContent.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogTypeMatch = htmlContent.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogUrlMatch = htmlContent.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']*)["'][^>]*>/i);

  if (ogTitleMatch) openGraph.title = ogTitleMatch[1];
  if (ogDescMatch) openGraph.description = ogDescMatch[1];
  if (ogImageMatch) openGraph.image = ogImageMatch[1];
  if (ogTypeMatch) openGraph.type = ogTypeMatch[1];
  if (ogUrlMatch) openGraph.url = ogUrlMatch[1];

  if (openGraph.title === undefined) issues.push('Missing Open Graph title');
  if (openGraph.description === undefined) issues.push('Missing Open Graph description');
  if (openGraph.image === undefined) issues.push('Missing Open Graph image');

  // Extract Twitter Card tags
  const twitterCard: Partial<OpenGraph> = {};
  const twTitleMatch = htmlContent.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const twDescMatch = htmlContent.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const twImageMatch = htmlContent.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const twCardMatch = htmlContent.match(/<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']*)["'][^>]*>/i);

  if (twTitleMatch) twitterCard.title = twTitleMatch[1];
  if (twDescMatch) twitterCard.description = twDescMatch[1];
  if (twImageMatch) twitterCard.image = twImageMatch[1];
  if (twCardMatch) twitterCard.type = twCardMatch[1];

  if (twitterCard.title === undefined && openGraph.title === undefined) issues.push('Missing Twitter Card title');
  if (twitterCard.image === undefined && openGraph.image === undefined) issues.push('Missing Twitter Card image');

  // Extract structured data (JSON-LD)
  const structuredData: unknown[] = [];
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = jsonLdRegex.exec(htmlContent)) !== null) {
    try {
      const data = JSON.parse(match[1].trim());
      structuredData.push(data);
    } catch {
      // Invalid JSON, skip
    }
  }

  if (structuredData.length === 0) {
    issues.push('No structured data (JSON-LD) found');
  }

  // Extract headings
  const headings = {
    h1: [] as string[],
    h2: [] as string[],
    h3: [] as string[],
    hierarchyValid: true,
  };

  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  while ((match = h1Regex.exec(htmlContent)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) headings.h1.push(text);
  }

  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  while ((match = h2Regex.exec(htmlContent)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) headings.h2.push(text);
  }

  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  while ((match = h3Regex.exec(htmlContent)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) headings.h3.push(text);
  }

  // Validate heading hierarchy
  if (headings.h1.length === 0) {
    issues.push('Missing H1 heading');
  } else if (headings.h1.length > 1) {
    issues.push(`Multiple H1 headings found (${headings.h1.length})`);
  }

  // Check for hreflang tags
  const hasHreflang = /<link[^>]*rel=["']alternate["'][^>]*hreflang=/i.test(htmlContent);
  if (!hasHreflang && (htmlContent.includes('lang="en"') || htmlContent.includes('lang=\'en\''))) {
    // Only suggest if site appears to be English-only
  }

  // Check for sitemap reference
  const hasSitemap = /<link[^>]*rel=["']sitemap["']|Sitemap:/i.test(htmlContent);
  if (!hasSitemap) {
    issues.push('No sitemap reference found');
  }

  // Calculate score
  let score = 100;
  const criticalIssues = ['Missing page title', 'Missing meta description', 'Missing H1 heading'];

  for (const issue of issues) {
    if (criticalIssues.some(ci => issue.length > 0 && issue.includes(ci))) {
      score -= 15;
    } else {
      score -= 5;
    }
  }

  // Bonus points
  if (structuredData.length > 0) score += 5;
  if (openGraph.title !== undefined && openGraph.description !== undefined && openGraph.image !== undefined) score += 5;
  if (canonical !== undefined && canonical !== '') score += 5;

  return {
    meta,
    openGraph,
    twitterCard,
    structuredData,
    headings,
    score: Math.max(0, Math.min(100, score)),
    issues: [...new Set(issues)],
  };
}
