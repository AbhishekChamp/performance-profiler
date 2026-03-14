/**
 * Lighthouse CI Integration
 * 
 * Provides integration with Lighthouse for comprehensive performance auditing
 * 
 * @module browser-analysis/lighthouse
 */

import type { RealWebVitalMetric, MetricConfidence } from './index';

/**
 * Lighthouse audit result structure
 */
export interface LighthouseResult {
  lhr: {
    lighthouseVersion: string;
    fetchTime: string;
    requestedUrl: string;
    finalUrl: string;
    runWarnings: string[];
    audits: Record<string, LighthouseAudit>;
    categories: Record<string, LighthouseCategory>;
    categoryGroups?: Record<string, { title: string; description?: string }>;
  };
}

/**
 * Individual Lighthouse audit
 */
export interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  scoreDisplayMode: 'numeric' | 'binary' | 'manual' | 'error' | 'notApplicable' | 'informative';
  numericValue?: number;
  numericUnit?: string;
  displayValue?: string;
  details?: unknown;
  warnings?: string[];
}

/**
 * Lighthouse category score
 */
export interface LighthouseCategory {
  id: string;
  title: string;
  description: string;
  score: number | null;
  auditRefs: Array<{
    id: string;
    weight: number;
    group?: string;
  }>;
}

/**
 * Web Vitals audit mapping from Lighthouse
 */
const WEB_VITALS_AUDITS: Record<string, { name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP'; unit: 'ms' | 's' | '' }> = {
  'largest-contentful-paint': { name: 'LCP', unit: 'ms' },
  'max-potential-fid': { name: 'FID', unit: 'ms' },
  'cumulative-layout-shift': { name: 'CLS', unit: '' },
  'first-contentful-paint': { name: 'FCP', unit: 'ms' },
  'server-response-time': { name: 'TTFB', unit: 'ms' },
  'interaction-to-next-paint': { name: 'INP', unit: 'ms' }
};

/**
 * Parse Lighthouse result and extract Web Vitals
 */
export function parseLighthouseResult(result: LighthouseResult): RealWebVitalMetric[] {
  const metrics: RealWebVitalMetric[] = [];
  const { audits } = result.lhr;

  for (const [auditId, mapping] of Object.entries(WEB_VITALS_AUDITS)) {
    const audit = audits[auditId];
    
    if (audit.numericValue !== undefined) {
      metrics.push({
        name: mapping.name,
        value: audit.numericValue,
        unit: mapping.unit,
        confidence: 'measured' as MetricConfidence,
        source: 'lighthouse',
        timestamp: new Date(result.lhr.fetchTime).getTime()
      });
    }
  }

  return metrics;
}

/**
 * Get overall Lighthouse score
 */
export function getLighthouseScore(result: LighthouseResult): number {
  const performance = result.lhr.categories.performance;
  return performance.score !== null ? Math.round(performance.score * 100) : 0;
}

/**
 * Get Lighthouse category scores
 */
export function getCategoryScores(result: LighthouseResult): Record<string, number> {
  const scores: Record<string, number> = {};
  
  for (const [id, category] of Object.entries(result.lhr.categories)) {
    scores[id] = category.score !== null ? Math.round(category.score * 100) : 0;
  }
  
  return scores;
}

/**
 * Get performance opportunities from Lighthouse
 */
export function getPerformanceOpportunities(result: LighthouseResult): Array<{
  id: string;
  title: string;
  description: string;
  score: number;
  displayValue?: string;
  savings?: string;
}> {
  const opportunities = [];
  const opportunityAudits = [
    'render-blocking-resources',
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'efficiently-encode-images',
    'offscreen-images',
    'minify-css',
    'minify-javascript',
    'remove-unused-css',
    'remove-unused-javascript',
    'uses-optimized-images',
    'uses-webp-images',
    'uses-text-compression',
    'uses-responsive-images',
    'prioritize-lcp-image'
  ];

  for (const auditId of opportunityAudits) {
    const audit = result.lhr.audits[auditId];
    if (audit.score !== null && audit.score < 1) {
      opportunities.push({
        id: auditId,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue,
        savings: audit.details !== undefined ? extractSavings(audit.details) : undefined
      });
    }
  }

  return opportunities.sort((a, b) => a.score - b.score);
}

/**
 * Extract savings information from audit details
 */
function extractSavings(details: unknown): string | undefined {
  if (typeof details === 'object' && details !== null) {
    const d = details as Record<string, unknown>;
    if ('overallSavingsMs' in d && typeof d.overallSavingsMs === 'number') {
      return `${Math.round(d.overallSavingsMs)}ms`;
    }
    if ('overallSavingsBytes' in d && typeof d.overallSavingsBytes === 'number') {
      return `${Math.round(d.overallSavingsBytes / 1024)}KB`;
    }
  }
  return undefined;
}

/**
 * Generate Lighthouse CI configuration
 */
export function generateLighthouseCIConfig(urls: string[]): string {
  const config = {
    ci: {
      collect: {
        url: urls,
        numberOfRuns: 3,
        settings: {
          preset: 'desktop',
          chromeFlags: '--no-sandbox --headless'
        }
      },
      assert: {
        assertions: {
          'categories:performance': ['warn', { minScore: 0.9 }],
          'categories:accessibility': ['error', { minScore: 0.9 }],
          'categories:best-practices': ['warn', { minScore: 0.9 }],
          'categories:seo': ['warn', { minScore: 0.9 }],
          'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
          'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
          'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
          'total-blocking-time': ['warn', { maxNumericValue: 200 }]
        }
      },
      upload: {
        target: 'temporary-public-storage'
      }
    }
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Compare custom analysis scores with Lighthouse scores
 */
export function compareWithLighthouse(
  customScore: number,
  lighthouseResult: LighthouseResult
): {
  custom: number;
  lighthouse: number;
  difference: number;
  correlation: 'high' | 'medium' | 'low';
} {
  const lighthouseScore = getLighthouseScore(lighthouseResult);
  const difference = customScore - lighthouseScore;
  
  let correlation: 'high' | 'medium' | 'low';
  if (Math.abs(difference) <= 10) {
    correlation = 'high';
  } else if (Math.abs(difference) <= 25) {
    correlation = 'medium';
  } else {
    correlation = 'low';
  }

  return {
    custom: customScore,
    lighthouse: lighthouseScore,
    difference,
    correlation
  };
}

/**
 * Get Lighthouse recommendations as analysis suggestions
 */
export function getLighthouseRecommendations(result: LighthouseResult): string[] {
  const recommendations: string[] = [];
  const { audits } = result.lhr;

  // Check for specific issues
  if (audits['render-blocking-resources']?.score !== undefined && audits['render-blocking-resources'].score !== null && audits['render-blocking-resources'].score < 1) {
    recommendations.push('Eliminate render-blocking resources');
  }

  if (audits['unused-css-rules']?.score !== undefined && audits['unused-css-rules'].score !== null && audits['unused-css-rules'].score < 1) {
    recommendations.push('Remove unused CSS');
  }

  if (audits['unused-javascript']?.score !== undefined && audits['unused-javascript'].score !== null && audits['unused-javascript'].score < 1) {
    recommendations.push('Remove unused JavaScript');
  }

  if (audits['modern-image-formats']?.score !== undefined && audits['modern-image-formats'].score !== null && audits['modern-image-formats'].score < 1) {
    recommendations.push('Use modern image formats (WebP, AVIF)');
  }

  if (audits['efficiently-encode-images']?.score !== undefined && audits['efficiently-encode-images'].score !== null && audits['efficiently-encode-images'].score < 1) {
    recommendations.push('Efficiently encode images');
  }

  if (audits['offscreen-images']?.score !== undefined && audits['offscreen-images'].score !== null && audits['offscreen-images'].score < 1) {
    recommendations.push('Defer offscreen images');
  }

  if (audits['uses-text-compression']?.score !== undefined && audits['uses-text-compression'].score !== null && audits['uses-text-compression'].score < 1) {
    recommendations.push('Enable text compression');
  }

  if (audits['uses-responsive-images']?.score !== undefined && audits['uses-responsive-images'].score !== null && audits['uses-responsive-images'].score < 1) {
    recommendations.push('Use responsive images');
  }

  return recommendations;
}
