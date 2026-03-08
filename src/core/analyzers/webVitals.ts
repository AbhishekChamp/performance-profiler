import type { WebVitalsAnalysis, WebVitalMetric, DOMAnalysis, BundleAnalysis, AssetAnalysis } from '@/types';

// Web Vitals thresholds based on Google's Core Web Vitals
const LCP_THRESHOLDS = { good: 2500, poor: 4000 }; // ms
const FID_THRESHOLDS = { good: 100, poor: 300 }; // ms
const CLS_THRESHOLDS = { good: 0.1, poor: 0.25 }; // score
const FCP_THRESHOLDS = { good: 1800, poor: 3000 }; // ms
const TTFB_THRESHOLDS = { good: 600, poor: 1000 }; // ms
const INP_THRESHOLDS = { good: 200, poor: 500 }; // ms

function getScore<T extends number>(value: T, thresholds: { good: T; poor: T }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value >= thresholds.poor) return 'poor';
  return 'needs-improvement';
}

function calculateLCPEstimate(
  dom?: DOMAnalysis,
  assets?: AssetAnalysis
): WebVitalMetric {
  const factors: string[] = [];
  let estimatedLCP = 1500; // Base estimate

  // Factor 1: Large images are likely LCP candidates
  if (dom?.largeImages.length) {
    const largestImage = dom.largeImages[0];
    estimatedLCP += Math.min(2000, largestImage.size / 1000);
    factors.push(`Large image detected (${Math.round(largestImage.size / 1024)} KB)`);
  }

  // Factor 2: Images without lazy loading in viewport
  if (dom?.imagesWithoutLazy) {
    estimatedLCP += dom.imagesWithoutLazy * 50;
    factors.push(`${dom.imagesWithoutLazy} images without lazy loading`);
  }

  // Factor 3: Total image size impact
  if (assets) {
    const imageSizeMB = assets.breakdown.images / (1024 * 1024);
    if (imageSizeMB > 1) {
      estimatedLCP += imageSizeMB * 200;
      factors.push(`Large total image size (${imageSizeMB.toFixed(1)} MB)`);
    }
  }

  // Factor 4: DOM complexity
  if (dom) {
    if (dom.totalNodes > 1500) {
      estimatedLCP += 300;
      factors.push('High DOM complexity');
    }
  }

  const score = getScore(estimatedLCP, LCP_THRESHOLDS);

  return {
    name: 'LCP',
    value: Math.round(estimatedLCP),
    unit: 'ms',
    score,
    estimated: true,
    factors: factors.length > 0 ? factors : ['No major LCP factors detected'],
  };
}

function calculateFIDEstimate(
  bundle?: BundleAnalysis,
  jsFiles?: { size: number; content: string }[]
): WebVitalMetric {
  const factors: string[] = [];
  let estimatedFID = 16; // Base estimate (1 frame at 60fps)

  // Factor 1: Bundle size impact on main thread
  if (bundle) {
    const bundleSizeMB = bundle.totalSize / (1024 * 1024);
    if (bundleSizeMB > 1) {
      estimatedFID += bundleSizeMB * 50;
      factors.push(`Large bundle size (${bundleSizeMB.toFixed(1)} MB)`);
    }
  }

  // Factor 2: Long-running scripts detection
  if (jsFiles) {
    const largeFiles = jsFiles.filter(f => f.size > 100 * 1024);
    if (largeFiles.length > 0) {
      estimatedFID += largeFiles.length * 20;
      factors.push(`${largeFiles.length} large JavaScript files`);
    }

    // Check for heavy computation patterns
    const heavyPatterns = [
      /for\s*\([^)]+\)\s*\{[^}]*for\s*\(/g, // Nested loops
      /while\s*\(/g, // While loops
      /\.map\([^)]+\)\.filter\(/g, // Chained array operations
      /new\s+Worker/g, // Web workers (positive)
    ];

    let patternCount = 0;
    for (const file of jsFiles) {
      for (const pattern of heavyPatterns.slice(0, -1)) {
        const matches = file.content.match(pattern);
        if (matches) patternCount += matches.length;
      }
    }

    if (patternCount > 5) {
      estimatedFID += patternCount * 10;
      factors.push('Heavy computation patterns detected');
    }
  }

  // Factor 3: Vendor bundle size
  if (bundle && bundle.vendorPercentage > 50) {
    estimatedFID += 30;
    factors.push('High vendor bundle ratio');
  }

  const score = getScore(estimatedFID, FID_THRESHOLDS);

  return {
    name: 'FID',
    value: Math.round(estimatedFID),
    unit: 'ms',
    score,
    estimated: true,
    factors: factors.length > 0 ? factors : ['No major FID factors detected'],
  };
}

function calculateCLSEstimate(dom?: DOMAnalysis): WebVitalMetric {
  const factors: string[] = [];
  let estimatedCLS = 0;

  if (!dom) {
    return {
      name: 'CLS',
      value: 0,
      unit: 'score',
      score: 'good',
      estimated: true,
      factors: ['No DOM data available'],
    };
  }

  // Factor 1: Images without dimensions
  if (dom.imagesWithoutDimensions > 0) {
    estimatedCLS += dom.imagesWithoutDimensions * 0.05;
    factors.push(`${dom.imagesWithoutDimensions} images without explicit dimensions`);
  }

  // Factor 2: Large images that might cause reflow
  if (dom.largeImages.length > 0) {
    estimatedCLS += dom.largeImages.length * 0.03;
    factors.push(`${dom.largeImages.length} large images that may cause layout shifts`);
  }

  // Factor 3: Deep DOM nesting (can cause layout issues)
  if (dom.maxDepth > 16) {
    estimatedCLS += 0.05;
    factors.push('Deep DOM nesting may cause layout instability');
  }

  const score = getScore(estimatedCLS, CLS_THRESHOLDS);

  return {
    name: 'CLS',
    value: Math.round(estimatedCLS * 100) / 100,
    unit: 'score',
    score,
    estimated: true,
    factors: factors.length > 0 ? factors : ['No major CLS factors detected'],
  };
}

function calculateFCPEstimate(
  hasCSS: boolean,
  hasJS: boolean,
  bundle?: BundleAnalysis
): WebVitalMetric {
  const factors: string[] = [];
  let estimatedFCP = 800; // Base estimate

  // Factor 1: Render-blocking resources
  if (hasCSS) {
    estimatedFCP += 200;
    factors.push('CSS resources may block rendering');
  }

  if (hasJS) {
    estimatedFCP += 300;
    factors.push('JavaScript may block rendering');
  }

  // Factor 2: Bundle size impact
  if (bundle) {
    const bundleSizeMB = bundle.totalSize / (1024 * 1024);
    estimatedFCP += bundleSizeMB * 100;
    if (bundleSizeMB > 0.5) {
      factors.push('Bundle size affects initial paint');
    }
  }

  const score = getScore(estimatedFCP, FCP_THRESHOLDS);

  return {
    name: 'FCP',
    value: Math.round(estimatedFCP),
    unit: 'ms',
    score,
    estimated: true,
    factors: factors.length > 0 ? factors : ['FCP within expected range'],
  };
}

function calculateTTFBEstimate(
  files: { name: string; size: number }[]
): WebVitalMetric {
  const factors: string[] = [];
  let estimatedTTFB = 200; // Base server response estimate

  // Factor 1: Total payload size
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalSizeMB = totalSize / (1024 * 1024);

  if (totalSizeMB > 5) {
    estimatedTTFB += totalSizeMB * 50;
    factors.push(`Large total payload (${totalSizeMB.toFixed(1)} MB)`);
  }

  // Factor 2: Number of resources
  if (files.length > 50) {
    estimatedTTFB += files.length * 5;
    factors.push(`Many resources to load (${files.length} files)`);
  }

  const score = getScore(estimatedTTFB, TTFB_THRESHOLDS);

  return {
    name: 'TTFB',
    value: Math.round(estimatedTTFB),
    unit: 'ms',
    score,
    estimated: true,
    factors: factors.length > 0 ? factors : ['TTFB within expected range'],
  };
}

function calculateINPEstimate(
  bundle?: BundleAnalysis,
  jsFiles?: { size: number; content: string }[]
): WebVitalMetric {
  // INP (Interaction to Next Paint) is similar to FID but more comprehensive
  const fid = calculateFIDEstimate(bundle, jsFiles);
  const estimatedINP = fid.value * 1.5; // INP is typically higher than FID

  const score = getScore(estimatedINP, INP_THRESHOLDS);

  return {
    name: 'INP',
    value: Math.round(estimatedINP),
    unit: 'ms',
    score,
    estimated: true,
    factors: [...fid.factors, 'Based on FID estimation with interaction complexity factor'],
  };
}

export function analyzeWebVitals(
  files: { name: string; size: number; content: string }[],
  dom?: DOMAnalysis,
  bundle?: BundleAnalysis,
  assets?: AssetAnalysis,
  hasCSS: boolean = false,
  hasJS: boolean = false
): WebVitalsAnalysis {
  const jsFiles = files.filter(f => /\.(js|jsx|ts|tsx|mjs)$/.test(f.name));

  const metrics: WebVitalMetric[] = [
    calculateLCPEstimate(dom, assets),
    calculateFIDEstimate(bundle, jsFiles),
    calculateCLSEstimate(dom),
    calculateFCPEstimate(hasCSS, hasJS, bundle),
    calculateTTFBEstimate(files),
    calculateINPEstimate(bundle, jsFiles),
  ];

  // Calculate overall score (weighted average)
  const weights = {
    LCP: 0.25,
    FID: 0.15,
    CLS: 0.25,
    FCP: 0.15,
    TTFB: 0.10,
    INP: 0.10,
  };

  const scoreMap = { good: 100, 'needs-improvement': 50, poor: 0 };
  let weightedScore = 0;

  for (const metric of metrics) {
    weightedScore += scoreMap[metric.score] * weights[metric.name];
  }

  const overallScore = Math.round(weightedScore);

  // Generate recommendations
  const recommendations: string[] = [];
  const criticalIssues: string[] = [];

  for (const metric of metrics) {
    if (metric.score === 'poor') {
      criticalIssues.push(`${metric.name}: ${metric.value}${metric.unit}`);
    }

    if (metric.score !== 'good') {
      switch (metric.name) {
        case 'LCP':
          recommendations.push('Optimize images: use WebP/AVIF, lazy loading, and explicit dimensions');
          recommendations.push('Consider using a CDN for faster asset delivery');
          break;
        case 'FID':
        case 'INP':
          recommendations.push('Break up long JavaScript tasks into smaller chunks');
          recommendations.push('Use web workers for heavy computations');
          recommendations.push('Defer non-critical JavaScript');
          break;
        case 'CLS':
          recommendations.push('Add width and height attributes to images and videos');
          recommendations.push('Reserve space for dynamic content with min-height');
          recommendations.push('Avoid inserting content above existing content');
          break;
        case 'FCP':
          recommendations.push('Inline critical CSS');
          recommendations.push('Eliminate render-blocking resources');
          recommendations.push('Preload key resources');
          break;
        case 'TTFB':
          recommendations.push('Optimize server response time');
          recommendations.push('Use caching effectively');
          recommendations.push('Consider edge/CDN deployment');
          break;
      }
    }
  }

  return {
    metrics,
    overallScore,
    criticalIssues: [...new Set(criticalIssues)],
    recommendations: [...new Set(recommendations)],
  };
}
