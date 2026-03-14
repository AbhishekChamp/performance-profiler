/**
 * Real Browser Metrics Integration
 * 
 * Provides integration with browser automation tools for capturing
 * actual Web Vitals and performance metrics instead of estimations.
 * 
 * @module browser-analysis
 */

import type { WebVitalsAnalysis } from '@/types';

/**
 * Metric confidence level indicating data source reliability
 */
export type MetricConfidence = 'estimated' | 'simulated' | 'measured' | 'rum';

/**
 * Extended Web Vitals metric with confidence and source information
 */
export interface RealWebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  unit: 'ms' | 's' | '';
  confidence: MetricConfidence;
  source: 'estimation' | 'puppeteer' | 'playwright' | 'lighthouse' | 'rum';
  timestamp: number;
}

/**
 * Real browser measurement configuration
 */
export interface BrowserMeasurementConfig {
  /** Browser automation tool to use */
  tool: 'puppeteer' | 'playwright' | 'none';
  /** URL to measure (if different from analyzed files) */
  url?: string;
  /** Device emulation preset */
  device?: 'desktop' | 'mobile' | 'tablet';
  /** Network throttling preset */
  network?: 'fast' | 'slow' | 'offline';
  /** CPU throttling */
  cpuThrottle?: number;
  /** Include Lighthouse audit */
  includeLighthouse?: boolean;
  /** Number of runs to average */
  runs?: number;
}

/**
 * Comparison between estimated and real metrics
 */
export interface MetricComparison {
  metric: string;
  estimated: number;
  real: number;
  difference: number;
  percentDifference: number;
  accuracy: 'high' | 'medium' | 'low';
}

/**
 * Complete real metrics result
 */
export interface RealMetricsResult {
  metrics: RealWebVitalMetric[];
  comparisons: MetricComparison[];
  lighthouseScore?: number;
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  resourceCount: number;
  totalTransferSize: number;
  timestamp: number;
}

/**
 * Check if browser automation is available
 * Note: This requires server-side execution
 */
export function isBrowserAutomationAvailable(): boolean {
  // Browser automation requires Node.js environment
  return typeof window === 'undefined';
}

/**
 * Get confidence level description
 */
export function getConfidenceDescription(confidence: MetricConfidence): string {
  const descriptions: Record<MetricConfidence, string> = {
    estimated: 'Based on static analysis and heuristics',
    simulated: 'Based on simulated browser environment',
    measured: 'Measured with real browser automation',
    rum: 'From Real User Monitoring data'
  };
  return descriptions[confidence];
}

/**
 * Calculate accuracy rating based on percent difference
 */
export function calculateAccuracy(percentDiff: number): 'high' | 'medium' | 'low' {
  if (Math.abs(percentDiff) <= 10) return 'high';
  if (Math.abs(percentDiff) <= 25) return 'medium';
  return 'low';
}

/**
 * Compare estimated metrics with real measurements
 */
export function compareMetrics(
  estimated: WebVitalsAnalysis,
  real: RealWebVitalMetric[]
): MetricComparison[] {
  const comparisons: MetricComparison[] = [];

  for (const metric of real) {
    const estimatedMetric = estimated.metrics.find(m => m.name === metric.name);
    if (estimatedMetric) {
      const difference = metric.value - estimatedMetric.value;
      const percentDifference = estimatedMetric.value !== 0
        ? (difference / estimatedMetric.value) * 100
        : 0;

      comparisons.push({
        metric: metric.name,
        estimated: estimatedMetric.value,
        real: metric.value,
        difference,
        percentDifference,
        accuracy: calculateAccuracy(percentDifference)
      });
    }
  }

  return comparisons;
}

/**
 * Get recommended measurement approach based on project needs
 */
export function getMeasurementRecommendation(
  projectType: string,
  hasServerAccess: boolean
): string {
  if (!hasServerAccess) {
    return 'Static estimation is available. For real browser metrics, set up a local measurement server with Puppeteer or Playwright.';
  }

  switch (projectType) {
    case 'ecommerce':
      return 'Recommended: Real browser measurement with RUM integration for accurate conversion correlation.';
    case 'spa':
      return 'Recommended: Playwright with SPA navigation patterns for accurate route change metrics.';
    case 'static':
      return 'Recommended: Lighthouse CI for consistent lab data.';
    default:
      return 'Recommended: Hybrid approach with estimation for quick feedback, real measurement for releases.';
  }
}

// Re-export RUM adapters
export * from './rum-adapters';
