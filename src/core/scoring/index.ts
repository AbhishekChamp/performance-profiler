import type {
  AccessibilityAnalysis,
  AssetAnalysis,
  BundleAnalysis,
  CSSAnalysis,
  DOMAnalysis,
  JSFileAnalysis,
  PerformanceScore,
  RenderRisk,
  SEOAnalysis,
  SecurityAnalysis,
  WebVitalsAnalysis,
} from '@/types';

interface ScoringWeights {
  bundle: number;
  dom: number;
  css: number;
  assets: number;
  javascript: number;
  webVitals: number;
  accessibility: number;
  seo: number;
  security: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  bundle: 0.20,
  dom: 0.15,
  css: 0.10,
  assets: 0.10,
  javascript: 0.10,
  webVitals: 0.15,
  accessibility: 0.05,
  seo: 0.03,
  security: 0.02,
};

const BUNDLE_THRESHOLDS = {
  excellent: 500 * 1024,      // 500 KB
  good: 1024 * 1024,          // 1 MB
  fair: 2 * 1024 * 1024,      // 2 MB
  poor: 5 * 1024 * 1024,      // 5 MB
};

const DOM_THRESHOLDS = {
  excellent: 800,
  good: 1500,
  fair: 2500,
  poor: 4000,
};

const DEPTH_THRESHOLDS = {
  excellent: 10,
  good: 16,
  fair: 24,
  poor: 32,
};

const CSS_THRESHOLDS = {
  unused: { excellent: 10, good: 25, fair: 50, poor: 75 },
  important: { excellent: 0, good: 5, fair: 15, poor: 30 },
};

function calculateBundleScore(bundle: BundleAnalysis | undefined): number {
  if (!bundle) return 50;

  const { totalSize, vendorPercentage, duplicateLibraries } = bundle;
  let score = 100;

  // Size penalty
  if (totalSize <= BUNDLE_THRESHOLDS.excellent) {
    score -= 0;
  } else if (totalSize <= BUNDLE_THRESHOLDS.good) {
    score -= 10;
  } else if (totalSize <= BUNDLE_THRESHOLDS.fair) {
    score -= 25;
  } else if (totalSize <= BUNDLE_THRESHOLDS.poor) {
    score -= 45;
  } else {
    score -= 60;
  }

  // Vendor percentage penalty
  if (vendorPercentage > 70) {
    score -= 15;
  } else if (vendorPercentage > 50) {
    score -= 8;
  }

  // Duplicate libraries penalty
  score -= duplicateLibraries.length * 10;

  return Math.max(0, Math.min(100, score));
}

function calculateDOMScore(dom: DOMAnalysis | undefined): number {
  if (!dom) return 50;

  const { totalNodes, maxDepth, imagesWithoutLazy, imagesWithoutDimensions, largeImages } = dom;
  let score = 100;

  // Node count penalty
  if (totalNodes <= DOM_THRESHOLDS.excellent) {
    score -= 0;
  } else if (totalNodes <= DOM_THRESHOLDS.good) {
    score -= 10;
  } else if (totalNodes <= DOM_THRESHOLDS.fair) {
    score -= 25;
  } else if (totalNodes <= DOM_THRESHOLDS.poor) {
    score -= 45;
  } else {
    score -= 60;
  }

  // Depth penalty
  if (maxDepth <= DEPTH_THRESHOLDS.excellent) {
    score -= 0;
  } else if (maxDepth <= DEPTH_THRESHOLDS.good) {
    score -= 5;
  } else if (maxDepth <= DEPTH_THRESHOLDS.fair) {
    score -= 10;
  } else if (maxDepth <= DEPTH_THRESHOLDS.poor) {
    score -= 20;
  } else {
    score -= 30;
  }

  // Image penalties
  score -= imagesWithoutLazy * 3;
  score -= imagesWithoutDimensions * 2;
  score -= largeImages.length * 5;

  return Math.max(0, Math.min(100, score));
}

function calculateCSSScore(css: CSSAnalysis | undefined): number {
  if (!css) return 50;

  const { totalRules, unusedRules, inlineStyles, importantCount } = css;
  let score = 100;

  const unusedPercentage = totalRules > 0 ? (unusedRules / totalRules) * 100 : 0;

  // Unused selectors penalty
  if (unusedPercentage <= CSS_THRESHOLDS.unused.excellent) {
    score -= 0;
  } else if (unusedPercentage <= CSS_THRESHOLDS.unused.good) {
    score -= 10;
  } else if (unusedPercentage <= CSS_THRESHOLDS.unused.fair) {
    score -= 20;
  } else if (unusedPercentage <= CSS_THRESHOLDS.unused.poor) {
    score -= 35;
  } else {
    score -= 50;
  }

  // Inline styles penalty
  score -= Math.min(20, inlineStyles * 2);

  // !important penalty
  if (importantCount <= CSS_THRESHOLDS.important.excellent) {
    score -= 0;
  } else if (importantCount <= CSS_THRESHOLDS.important.good) {
    score -= 5;
  } else if (importantCount <= CSS_THRESHOLDS.important.fair) {
    score -= 15;
  } else {
    score -= 30;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateAssetScore(assets: AssetAnalysis | undefined): number {
  if (!assets) return 50;

  const { breakdown } = assets;
  let score = 100;

  const total = breakdown.total || 1;

  // JavaScript percentage
  const jsPercentage = (breakdown.javascript / total) * 100;
  if (jsPercentage > 60) {
    score -= 20;
  } else if (jsPercentage > 40) {
    score -= 10;
  }

  // Images percentage
  const imagePercentage = (breakdown.images / total) * 100;
  if (imagePercentage > 50) {
    score -= 15;
  } else if (imagePercentage > 30) {
    score -= 5;
  }

  // CSS percentage
  const cssPercentage = (breakdown.css / total) * 100;
  if (cssPercentage > 20) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateJSScore(js: JSFileAnalysis[] | undefined): number {
  if (!js || js.length === 0) return 50;

  let totalScore = 0;
  let fileCount = 0;

  for (const file of js) {
    let fileScore = 100;
    const { functions, totalComplexity, lines } = file;

    // Large file penalty
    if (lines > 1000) {
      fileScore -= 20;
    } else if (lines > 500) {
      fileScore -= 10;
    }

    // High complexity functions
    const highComplexityFunctions = functions.filter(f => f.cyclomaticComplexity > 10);
    fileScore -= highComplexityFunctions.length * 5;

    // Nested loops
    const functionsWithNestedLoops = functions.filter(f => f.nestedLoops > 0);
    fileScore -= functionsWithNestedLoops.length * 3;

    // Average complexity
    const avgComplexity = functions.length > 0 ? totalComplexity / functions.length : 0;
    if (avgComplexity > 15) {
      fileScore -= 15;
    } else if (avgComplexity > 10) {
      fileScore -= 8;
    }

    totalScore += Math.max(0, fileScore);
    fileCount++;
  }

  return fileCount > 0 ? Math.round(totalScore / fileCount) : 50;
}

function calculateWebVitalsScore(webVitals?: WebVitalsAnalysis): number {
  if (!webVitals) return 50;
  return webVitals.overallScore;
}

function calculateAccessibilityScore(accessibility?: AccessibilityAnalysis): number {
  if (!accessibility) return 50;
  return accessibility.score;
}

function calculateSEOScore(seo?: SEOAnalysis): number {
  if (!seo) return 50;
  return seo.score;
}

function calculateSecurityScore(security?: SecurityAnalysis): number {
  if (!security) return 50;
  return security.score;
}

export function calculatePerformanceScore(
  bundle?: BundleAnalysis,
  dom?: DOMAnalysis,
  css?: CSSAnalysis,
  assets?: AssetAnalysis,
  js?: JSFileAnalysis[],
  webVitals?: WebVitalsAnalysis,
  accessibility?: AccessibilityAnalysis,
  seo?: SEOAnalysis,
  security?: SecurityAnalysis,
  weights: Partial<ScoringWeights> = {}
): PerformanceScore {
  const finalWeights = { ...DEFAULT_WEIGHTS, ...weights };

  const bundleScore = calculateBundleScore(bundle);
  const domScore = calculateDOMScore(dom);
  const cssScore = calculateCSSScore(css);
  const assetScore = calculateAssetScore(assets);
  const jsScore = calculateJSScore(js);
  const webVitalsScore = calculateWebVitalsScore(webVitals);
  const accessibilityScore = calculateAccessibilityScore(accessibility);
  const seoScore = calculateSEOScore(seo);
  const securityScore = calculateSecurityScore(security);

  // Check if any analysis is provided
  const hasAnyAnalysis = 
    bundle !== undefined ||
    dom !== undefined ||
    css !== undefined ||
    assets !== undefined ||
    js !== undefined ||
    webVitals !== undefined ||
    accessibility !== undefined ||
    seo !== undefined ||
    security !== undefined;

  // If no analysis is provided at all, return default score of 50
  if (!hasAnyAnalysis) {
    return {
      overall: 50,
      bundle: 50,
      dom: 50,
      css: 50,
      assets: 50,
      javascript: 50,
      webVitals: 50,
      accessibility: 50,
      seo: 50,
      security: 50,
    };
  }

  // Calculate weighted overall score
  let overall = Math.round(
    bundleScore * finalWeights.bundle +
    domScore * finalWeights.dom +
    cssScore * finalWeights.css +
    assetScore * finalWeights.assets +
    jsScore * finalWeights.javascript +
    webVitalsScore * finalWeights.webVitals +
    accessibilityScore * finalWeights.accessibility +
    seoScore * finalWeights.seo +
    securityScore * finalWeights.security
  );

  // Adjust weights if some scores are not available
  const hasWebVitals = webVitals !== undefined;
  const hasAccessibility = accessibility !== undefined;
  const hasSEO = seo !== undefined;
  const hasSecurity = security !== undefined;

  // Mark these as used for weight calculation validation
  void hasAccessibility;
  void hasSEO;
  void hasSecurity;

  if (!hasWebVitals) {
    // Redistribute webVitals weight to other categories
    const redistribute = finalWeights.webVitals / 5;
    overall = Math.round(
      bundleScore * (finalWeights.bundle + redistribute) +
      domScore * (finalWeights.dom + redistribute) +
      cssScore * (finalWeights.css + redistribute) +
      assetScore * (finalWeights.assets + redistribute) +
      jsScore * (finalWeights.javascript + redistribute)
    );
  }

  return {
    overall: Math.max(0, Math.min(100, overall)),
    bundle: bundleScore,
    dom: domScore,
    css: cssScore,
    assets: assetScore,
    javascript: jsScore,
    webVitals: webVitalsScore,
    accessibility: accessibilityScore,
    seo: seoScore,
    security: securityScore,
  };
}

export function calculateRenderRisk(
  score: PerformanceScore,
  bundle?: BundleAnalysis,
  dom?: DOMAnalysis,
  css?: CSSAnalysis
): RenderRisk {
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let riskScore = 0;

  // Bundle size risk
  if (bundle) {
    if (bundle.totalSize > 2 * 1024 * 1024) {
      reasons.push(`Large bundle size (${(bundle.totalSize / 1024 / 1024).toFixed(1)} MB)`);
      recommendations.push('Enable code splitting and lazy loading');
      riskScore += 25;
    } else if (bundle.totalSize > 1024 * 1024) {
      reasons.push(`Bundle size above 1 MB`);
      recommendations.push('Consider tree-shaking unused code');
      riskScore += 15;
    }

    if (bundle.vendorPercentage > 60) {
      reasons.push(`High vendor dependency ratio (${bundle.vendorPercentage.toFixed(0)}%)`);
      recommendations.push('Analyze and remove unnecessary dependencies');
      riskScore += 10;
    }

    if (bundle.duplicateLibraries.length > 0) {
      reasons.push(`${bundle.duplicateLibraries.length} duplicate libraries detected`);
      recommendations.push('Resolve duplicate dependencies in package.json');
      riskScore += bundle.duplicateLibraries.length * 5;
    }
  }

  // DOM complexity risk
  if (dom) {
    if (dom.totalNodes > 2500) {
      reasons.push(`High DOM node count (${dom.totalNodes})`);
      recommendations.push('Implement virtual scrolling or pagination');
      riskScore += 20;
    } else if (dom.totalNodes > 1500) {
      reasons.push(`DOM node count above recommended threshold`);
      recommendations.push('Review and simplify DOM structure');
      riskScore += 10;
    }

    if (dom.maxDepth > 24) {
      reasons.push(`Deep DOM nesting (depth: ${dom.maxDepth})`);
      recommendations.push('Flatten component hierarchy');
      riskScore += 15;
    }

    if (dom.imagesWithoutLazy > 0) {
      reasons.push(`${dom.imagesWithoutLazy} images without lazy loading`);
      recommendations.push('Add loading="lazy" to below-the-fold images');
      riskScore += 5;
    }
  }

  // CSS risk
  if (css) {
    const unusedPercentage = css.totalRules > 0 ? (css.unusedRules / css.totalRules) * 100 : 0;
    if (unusedPercentage > 50) {
      reasons.push(`High unused CSS (${unusedPercentage.toFixed(0)}%)`);
      recommendations.push('Use PurgeCSS or similar tools');
      riskScore += 15;
    }

    if (css.importantCount > 20) {
      reasons.push(`Excessive !important usage (${css.importantCount})`);
      recommendations.push('Refactor CSS to reduce specificity conflicts');
      riskScore += 10;
    }
  }

  // Score-based risk
  if (score.overall <= 40) {
    riskScore += 50;
  } else if (score.overall < 60) {
    riskScore += 25;
  }

  // Additional risks from new scores (use void to acknowledge we're checking the score exists)
  const hasWebVitals = score.webVitals !== undefined;
  const hasAccessibility = score.accessibility !== undefined;
  const hasSEO = score.seo !== undefined;
  const hasSecurity = score.security !== undefined;
  
  void hasWebVitals;
  void hasSEO;

  if (score.webVitals !== undefined && score.webVitals < 50) {
    reasons.push('Poor Web Vitals scores');
    recommendations.push('Optimize Core Web Vitals (LCP, FID, CLS)');
    riskScore += 15;
  }

  if (hasAccessibility && score.accessibility !== undefined && score.accessibility < 50) {
    reasons.push('Low accessibility score');
    recommendations.push('Fix critical accessibility issues');
    riskScore += 10;
  }

  if (hasSecurity && score.security !== undefined && score.security < 50) {
    reasons.push('Security vulnerabilities detected');
    recommendations.push('Address security issues immediately');
    riskScore += 20;
  }

  // Determine risk level
  let level: RenderRisk['level'];
  if (riskScore >= 70) {
    level = 'critical';
  } else if (riskScore >= 50) {
    level = 'high';
  } else if (riskScore >= 30) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    level,
    score: Math.min(100, riskScore),
    reasons: reasons.slice(0, 5),
    recommendations: [...new Set(recommendations)].slice(0, 5),
  };
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#3fb950'; // success
  if (score >= 70) return '#d29922'; // warning
  if (score >= 50) return '#f85149'; // danger
  return '#da3633'; // critical
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

export function getWebVitalsScoreColor(score: 'good' | 'needs-improvement' | 'poor'): string {
  switch (score) {
    case 'good':
      return '#3fb950';
    case 'needs-improvement':
      return '#d29922';
    case 'poor':
      return '#f85149';
    default:
      return '#8b949e';
  }
}
