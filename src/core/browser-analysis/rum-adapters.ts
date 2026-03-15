/**
 * Real User Monitoring (RUM) Data Adapters
 * 
 * Adapters for importing Web Vitals data from various RUM tools
 * 
 * @module browser-analysis/rum-adapters
 */

import type { MetricConfidence, RealWebVitalMetric } from './index';

/**
 * Generic RUM data point
 */
export interface RUMDataPoint {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
}

/**
 * Vercel Analytics data format
 */
export interface VercelAnalyticsData {
  webVitals?: Array<{
    id: string;
    name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB';
    value: number;
    page?: string;
    route?: string;
    timestamp: number;
  }>;
  customEvents?: Array<{
    name: string;
    value: number;
    timestamp: number;
  }>;
}

/**
 * Google Analytics 4 Web Vitals data
 */
export interface GA4WebVitalsData {
  reports?: Array<{
    dimensionValues: string[];
    metricValues: number[];
  }>;
  metricNames?: string[];
}

/**
 * Cloudflare Web Analytics data
 */
export interface CloudflareAnalyticsData {
  data?: {
    viewers?: Array<{
      dimensions: string[];
      metrics: number[];
    }>;
    coreWebVitals?: {
      lcp?: { p75: number };
      fid?: { p75: number };
      cls?: { p75: number };
      fcp?: { p75: number };
      ttfb?: { p75: number };
    };
  };
}

/**
 * New Relic Browser data
 */
export interface NewRelicBrowserData {
  metricData?: {
    metrics?: Array<{
      name: string;
      timeslices?: Array<{
        values?: {
          percentile75?: number;
          average?: number;
        };
      }>;
    }>;
  };
}

/**
 * Datadog RUM data
 */
export interface DatadogRUMData {
  series?: Array<{
    metric: string;
    pointlist?: Array<[number, number]>;
    attributes?: Record<string, string>;
  }>;
}

/**
 * Adapter function type
 */
type _RUMAdapter<T> = (data: T) => RealWebVitalMetric[];

/**
 * Parse Vercel Analytics data
 */
export function parseVercelAnalytics(data: VercelAnalyticsData): RealWebVitalMetric[] {
  if (data.webVitals === undefined) return [];

  return data.webVitals.map(vital => ({
    name: vital.name,
    value: vital.value,
    unit: vital.name === 'CLS' ? '' : 'ms',
    confidence: 'rum' as MetricConfidence,
    source: 'rum',
    timestamp: vital.timestamp
  }));
}

/**
 * Parse Google Analytics 4 Web Vitals data
 */
export function parseGA4WebVitals(data: GA4WebVitalsData): RealWebVitalMetric[] {
  const metrics: RealWebVitalMetric[] = [];
  
  if (data.reports === undefined || data.metricNames === undefined) return metrics;

  const metricMapping: Record<string, 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB'> = {
    'largestContentfulPaint': 'LCP',
    'firstInputDelay': 'FID',
    'cumulativeLayoutShift': 'CLS',
    'firstContentfulPaint': 'FCP',
    'timeToFirstByte': 'TTFB'
  };

  for (const report of data.reports) {
    for (let i = 0; i < data.metricNames.length; i++) {
      const metricName = data.metricNames[i];
      const mappedName = metricMapping[metricName];
      
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (mappedName != null) {
        metrics.push({
          name: mappedName,
          value: report.metricValues[i],
          unit: mappedName === 'CLS' ? '' : 'ms',
          confidence: 'rum',
          source: 'rum',
          timestamp: Date.now()
        });
      }
    }
  }

  return metrics;
}

/**
 * Parse Cloudflare Web Analytics data
 */
export function parseCloudflareAnalytics(data: CloudflareAnalyticsData): RealWebVitalMetric[] {
  const metrics: RealWebVitalMetric[] = [];
  
  if (data.data?.coreWebVitals === undefined) return metrics;

  const cwv = data.data.coreWebVitals;

  if (cwv.lcp?.p75 !== undefined && cwv.lcp.p75 > 0) {
    metrics.push({
      name: 'LCP',
      value: cwv.lcp.p75,
      unit: 'ms',
      confidence: 'rum',
      source: 'rum',
      timestamp: Date.now()
    });
  }

  if (cwv.fid?.p75 !== undefined && cwv.fid.p75 > 0) {
    metrics.push({
      name: 'FID',
      value: cwv.fid.p75,
      unit: 'ms',
      confidence: 'rum',
      source: 'rum',
      timestamp: Date.now()
    });
  }

  if (cwv.cls?.p75 !== undefined) {
    metrics.push({
      name: 'CLS',
      value: cwv.cls.p75,
      unit: '',
      confidence: 'rum',
      source: 'rum',
      timestamp: Date.now()
    });
  }

  if (cwv.fcp?.p75 !== undefined && cwv.fcp.p75 > 0) {
    metrics.push({
      name: 'FCP',
      value: cwv.fcp.p75,
      unit: 'ms',
      confidence: 'rum',
      source: 'rum',
      timestamp: Date.now()
    });
  }

  if (cwv.ttfb?.p75 !== undefined && cwv.ttfb.p75 > 0) {
    metrics.push({
      name: 'TTFB',
      value: cwv.ttfb.p75,
      unit: 'ms',
      confidence: 'rum',
      source: 'rum',
      timestamp: Date.now()
    });
  }

  return metrics;
}

/**
 * Parse New Relic Browser data
 */
export function parseNewRelicBrowser(data: NewRelicBrowserData): RealWebVitalMetric[] {
  const metrics: RealWebVitalMetric[] = [];
  
  if (data.metricData?.metrics === undefined) return metrics;

  const metricMapping: Record<string, 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB'> = {
    'Browser/LargestContentfulPaint': 'LCP',
    'Browser/FirstInputDelay': 'FID',
    'Browser/CumulativeLayoutShift': 'CLS',
    'Browser/FirstContentfulPaint': 'FCP',
    'Browser/TimeToFirstByte': 'TTFB'
  };

  for (const metric of data.metricData.metrics) {
    const mappedName = metricMapping[metric.name];
    
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (mappedName != null && metric.timeslices?.[0]?.values?.percentile75 != null) {
      metrics.push({
        name: mappedName,
        value: metric.timeslices[0].values.percentile75,
        unit: mappedName === 'CLS' ? '' : 'ms',
        confidence: 'rum',
        source: 'rum',
        timestamp: Date.now()
      });
    }
  }

  return metrics;
}

/**
 * Parse Datadog RUM data
 */
export function parseDatadogRUM(data: DatadogRUMData): RealWebVitalMetric[] {
  const metrics: RealWebVitalMetric[] = [];
  
  if (data.series === undefined) return metrics;

  const metricMapping: Record<string, 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB'> = {
    'web_vitals.lcp': 'LCP',
    'web_vitals.fid': 'FID',
    'web_vitals.cls': 'CLS',
    'web_vitals.fcp': 'FCP',
    'web_vitals.ttfb': 'TTFB'
  };

  for (const series of data.series) {
    const mappedName = metricMapping[series.metric];
    
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (mappedName != null && series.pointlist != null && series.pointlist.length > 0) {
      // Get the latest value
      const latestPoint = series.pointlist[series.pointlist.length - 1];
      metrics.push({
        name: mappedName,
        value: latestPoint[1],
        unit: mappedName === 'CLS' ? '' : 'ms',
        confidence: 'rum',
        source: 'rum',
        timestamp: latestPoint[0]
      });
    }
  }

  return metrics;
}

/**
 * Auto-detect RUM data format and parse accordingly
 */
export function parseRUMData(data: unknown): RealWebVitalMetric[] {
  // Try to detect format based on structure
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;

    // Check for Vercel Analytics
    if ('webVitals' in obj && obj.webVitals !== undefined && obj.webVitals !== null && Array.isArray(obj.webVitals)) {
      return parseVercelAnalytics(data as VercelAnalyticsData);
    }

    // Check for Cloudflare
    if ('data' in obj && obj.data !== undefined && obj.data !== null && typeof obj.data === 'object' && 'coreWebVitals' in (obj.data as Record<string, unknown>)) {
      return parseCloudflareAnalytics(data as CloudflareAnalyticsData);
    }

    // Check for GA4
    if ('reports' in obj && obj.reports !== undefined && obj.reports !== null && Array.isArray(obj.reports)) {
      return parseGA4WebVitals(data as GA4WebVitalsData);
    }

    // Check for New Relic
    if ('metricData' in obj && obj.metricData !== undefined && obj.metricData !== null) {
      return parseNewRelicBrowser(data as NewRelicBrowserData);
    }

    // Check for Datadog
    if ('series' in obj && obj.series !== undefined && obj.series !== null && Array.isArray(obj.series)) {
      return parseDatadogRUM(data as DatadogRUMData);
    }
  }

  return [];
}

/**
 * Export adapters map for programmatic access
 */
export const rumAdapters = {
  vercel: parseVercelAnalytics,
  ga4: parseGA4WebVitals,
  cloudflare: parseCloudflareAnalytics,
  newrelic: parseNewRelicBrowser,
  datadog: parseDatadogRUM,
  auto: parseRUMData
};

export type RUMAdapterType = keyof typeof rumAdapters;
