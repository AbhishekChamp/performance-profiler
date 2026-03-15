/**
 * Waterfall Timing Calculator
 * 
 * Calculates estimated loading times and dependencies for resources
 * to create a waterfall visualization.
 */

import type { Asset, RenderBlockingResource, ResourceHint } from '@/types';

export interface WaterfallResource {
  id: string;
  url: string;
  type: 'html' | 'css' | 'js' | 'image' | 'font' | 'json' | 'other';
  size: number;
  startTime: number;
  endTime: number;
  duration: number;
  isBlocking: boolean;
  isPreload: boolean;
  dependencies: string[];
  initiator?: string;
  priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
}

export interface WaterfallData {
  resources: WaterfallResource[];
  totalDuration: number;
  criticalPath: WaterfallResource[];
  markers: {
    domContentLoaded: number;
    load: number;
    firstPaint: number;
    largestContentfulPaint: number;
  };
}

// Network speed assumptions (bytes per ms)
const NETWORK_SPEEDS = {
  '4g': 1000 * 1024 / 1000, // ~1MB/s
  '3g': 300 * 1024 / 1000,  // ~300KB/s
  'slow-3g': 100 * 1024 / 1000, // ~100KB/s
};

// Processing time estimates (ms)
const PROCESSING_TIME = {
  html: 10,
  css: 20,
  js: 30,
  image: 5,
  font: 10,
  json: 5,
  other: 5,
};

/**
 * Calculate resource loading time based on size and network speed
 */
function calculateLoadTime(size: number, networkSpeed: keyof typeof NETWORK_SPEEDS = '4g'): number {
  const speed = NETWORK_SPEEDS[networkSpeed];
  return Math.max(10, size / speed);
}

/**
 * Get resource type from URL and content type
 */
function getResourceType(url: string, mimeType?: string): WaterfallResource['type'] {
  if (mimeType !== undefined) {
    if (mimeType.includes('text/html')) return 'html';
    if (mimeType.includes('text/css')) return 'css';
    if (mimeType.includes('javascript')) return 'js';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('font')) return 'font';
    if (mimeType.includes('json')) return 'json';
  }

  // Fallback to extension
  const extension = url.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'sass':
      return 'css';
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'mjs':
      return 'js';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'avif':
    case 'svg':
      return 'image';
    case 'woff':
    case 'woff2':
    case 'ttf':
    case 'otf':
    case 'eot':
      return 'font';
    case 'json':
      return 'json';
    default:
      return 'other';
  }
}

/**
 * Determine resource priority based on type and attributes
 */
function getResourcePriority(
  type: WaterfallResource['type'],
  isBlocking: boolean,
  isPreload: boolean
): WaterfallResource['priority'] {
  if (isPreload) return 'highest';
  if (type === 'html') return 'highest';
  if (isBlocking && type === 'css') return 'highest';
  if (type === 'js') return isBlocking ? 'high' : 'medium';
  if (type === 'font') return 'high';
  if (type === 'image') return 'low';
  return 'lowest';
}

/**
 * Generate waterfall data from analysis results
 */
export function generateWaterfallData(
  htmlContent: string,
  assets: Asset[],
  hints: ResourceHint[] = [],
  blockingResources: RenderBlockingResource[] = []
): WaterfallData {
  const resources: WaterfallResource[] = [];
  const blockingUrls = new Set(blockingResources.map((r) => r.path));
  const preloadUrls = new Set(hints.filter((h) => h.type === 'preload').map((h) => h.href));

  let currentTime = 0;
  let domContentLoaded = 0;
  let loadTime = 0;

  // Parse HTML to find resource loading order
  const cssUrls: string[] = [];
  const jsUrls: string[] = [];
  const imageUrls: string[] = [];

  // Extract CSS links
  const cssRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = cssRegex.exec(htmlContent)) !== null) {
    cssUrls.push(match[1]);
  }

  // Extract JS scripts
  const jsRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((match = jsRegex.exec(htmlContent)) !== null) {
    jsUrls.push(match[1]);
  }

  // Extract images
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    imageUrls.push(match[1]);
  }

  // Add HTML document as first resource
  const htmlSize = new Blob([htmlContent]).size;
  resources.push({
    id: 'html-document',
    url: 'index.html',
    type: 'html',
    size: htmlSize,
    startTime: 0,
    endTime: calculateLoadTime(htmlSize) + PROCESSING_TIME.html,
    duration: calculateLoadTime(htmlSize) + PROCESSING_TIME.html,
    isBlocking: true,
    isPreload: false,
    dependencies: [],
    priority: 'highest',
  });

  currentTime = resources[0].endTime;

  // Add CSS resources (typically blocking)
  cssUrls.forEach((url, index) => {
    const asset = assets.find((a) => a.path.includes(url) || url.includes(a.path));
    const size = asset?.size ?? 50 * 1024; // Default 50KB
    const isBlocking = blockingUrls.has(url);
    const isPreload = preloadUrls.has(url);
    const loadTime = calculateLoadTime(size);
    const processingTime = PROCESSING_TIME.css;

    resources.push({
      id: `css-${index}`,
      url,
      type: 'css',
      size,
      startTime: currentTime,
      endTime: currentTime + loadTime + processingTime,
      duration: loadTime + processingTime,
      isBlocking,
      isPreload,
      dependencies: ['html-document'],
      initiator: 'html-document',
      priority: getResourcePriority('css', isBlocking, isPreload),
    });

    if (isBlocking) {
      currentTime += loadTime;
    }
  });

  // Calculate DOMContentLoaded (after blocking CSS)
  domContentLoaded = currentTime + PROCESSING_TIME.html;

  // Add JS resources
  jsUrls.forEach((url, index) => {
    const asset = assets.find((a) => a.path.includes(url) || url.includes(a.path));
    const size = asset?.size ?? 100 * 1024; // Default 100KB
    const isBlocking = blockingUrls.has(url);
    const isPreload = preloadUrls.has(url);
    const loadTime = calculateLoadTime(size);
    const processingTime = PROCESSING_TIME.js;

    resources.push({
      id: `js-${index}`,
      url,
      type: 'js',
      size,
      startTime: isBlocking ? currentTime : domContentLoaded,
      endTime: (isBlocking ? currentTime : domContentLoaded) + loadTime + processingTime,
      duration: loadTime + processingTime,
      isBlocking,
      isPreload,
      dependencies: ['html-document'],
      initiator: 'html-document',
      priority: getResourcePriority('js', isBlocking, isPreload),
    });

    if (isBlocking) {
      currentTime += loadTime;
    }
  });

  // Add images (typically non-blocking)
  imageUrls.forEach((url, index) => {
    const asset = assets.find((a) => a.path.includes(url) || url.includes(a.path));
    const size = asset?.size ?? 50 * 1024;
    const loadTime = calculateLoadTime(size);

    resources.push({
      id: `img-${index}`,
      url,
      type: 'image',
      size,
      startTime: domContentLoaded,
      endTime: domContentLoaded + loadTime + PROCESSING_TIME.image,
      duration: loadTime + PROCESSING_TIME.image,
      isBlocking: false,
      isPreload: preloadUrls.has(url),
      dependencies: [],
      priority: 'low',
    });
  });

  // Add remaining assets from analysis
  assets.forEach((asset, index) => {
    const existing = resources.find((r) => r.url === asset.path);
    if (existing) return;

    const type = getResourceType(asset.path);
    const loadTime = calculateLoadTime(asset.size);

    resources.push({
      id: `asset-${index}`,
      url: asset.path,
      type,
      size: asset.size,
      startTime: domContentLoaded,
      endTime: domContentLoaded + loadTime + PROCESSING_TIME[type],
      duration: loadTime + PROCESSING_TIME[type],
      isBlocking: false,
      isPreload: preloadUrls.has(asset.path),
      dependencies: [],
      priority: getResourcePriority(type, false, preloadUrls.has(asset.path)),
    });
  });

  // Calculate total duration
  const endTimes = resources.map((r) => r.endTime);
  loadTime = Math.max(...endTimes);

  // Identify critical path
  const criticalPath = resources.filter((r) => r.isBlocking).sort((a, b) => a.startTime - b.startTime);

  return {
    resources: resources.sort((a, b) => a.startTime - b.startTime),
    totalDuration: loadTime,
    criticalPath,
    markers: {
      domContentLoaded,
      load: loadTime,
      firstPaint: domContentLoaded + 100,
      largestContentfulPaint: domContentLoaded + 250,
    },
  };
}

/**
 * Calculate potential time savings from optimizations
 */
export function calculatePotentialSavings(
  resources: WaterfallResource[]
): Array<{ type: string; saving: number; description: string }> {
  const savings: Array<{ type: string; saving: number; description: string }> = [];

  // Find render-blocking resources that could be deferred
  const blockingJs = resources.filter((r) => r.type === 'js' && r.isBlocking);
  if (blockingJs.length > 0) {
    const blockingTime = blockingJs.reduce((sum, r) => sum + r.duration, 0);
    savings.push({
      type: 'defer-js',
      saving: blockingTime * 0.7,
      description: `Add async/defer to ${blockingJs.length} blocking script(s)`,
    });
  }

  // Find uncompressed resources (estimation)
  const largeResources = resources.filter((r) => r.size > 100 * 1024);
  if (largeResources.length > 0) {
    const totalSize = largeResources.reduce((sum, r) => sum + r.size, 0);
    savings.push({
      type: 'compression',
      saving: totalSize * 0.6 / NETWORK_SPEEDS['4g'],
      description: `Enable gzip/brotli compression for ${largeResources.length} large resource(s)`,
    });
  }

  // Find resources that could be preloaded
  const lateResources = resources.filter(
    (r) => r.priority === 'high' && r.startTime > 100
  );
  if (lateResources.length > 0) {
    const earlyLoadTime = lateResources.reduce((sum, r) => sum + r.duration, 0) * 0.3;
    savings.push({
      type: 'preload',
      saving: earlyLoadTime,
      description: `Preload ${lateResources.length} critical resource(s)`,
    });
  }

  return savings.sort((a, b) => b.saving - a.saving);
}
