import type {
  AnalysisReport,
  AnalysisOptions,
  PerformanceTimeline,
  TimelineEvent,
  Optimization,
  JSFileAnalysis,
  BundleAnalysis,
  DOMAnalysis,
  CSSAnalysis,
  AssetAnalysis,
  ReactAnalysis,
} from '@/types';
import { analyzeBundle } from '../analyzers/bundle';
import { analyzeDOM } from '../analyzers/dom';
import { analyzeCSS } from '../analyzers/css';
import { analyzeAssets } from '../analyzers/assets';
import { analyzeJavaScript } from '../analyzers/javascript';
import { analyzeReact } from '../analyzers/react';
import { calculatePerformanceScore, calculateRenderRisk } from '../scoring';

interface FileInput {
  name: string;
  content: string;
  size: number;
}

function generateTimeline(
  hasHTML: boolean,
  hasJS: boolean,
  hasCSS: boolean,
  bundleSize: number
): PerformanceTimeline {
  const events: TimelineEvent[] = [];
  let currentTime = 0;

  // HTML Parse
  if (hasHTML) {
    events.push({
      name: 'HTML Parse',
      start: currentTime,
      end: currentTime + 15,
      duration: 15,
      type: 'parse',
    });
    currentTime += 15;
  }

  // CSS Parse
  if (hasCSS) {
    events.push({
      name: 'CSS Parse',
      start: currentTime,
      end: currentTime + 20,
      duration: 20,
      type: 'parse',
    });
    currentTime += 20;
  }

  // JS Load
  if (hasJS) {
    const loadTime = Math.min(100, bundleSize / (100 * 1024)); // Approximate load time
    events.push({
      name: 'JS Load',
      start: currentTime,
      end: currentTime + loadTime,
      duration: loadTime,
      type: 'load',
    });
    currentTime += loadTime;

    // JS Execute
    const execTime = Math.min(150, bundleSize / (50 * 1024));
    events.push({
      name: 'JS Execute',
      start: currentTime,
      end: currentTime + execTime,
      duration: execTime,
      type: 'execute',
    });
    currentTime += execTime;
  }

  // DOM Render
  events.push({
    name: 'DOM Render',
    start: currentTime,
    end: currentTime + 30,
    duration: 30,
    type: 'render',
  });
  currentTime += 30;

  // Paint
  events.push({
    name: 'Paint',
    start: currentTime,
    end: currentTime + 10,
    duration: 10,
    type: 'paint',
  });
  currentTime += 10;

  return {
    events,
    totalTime: currentTime,
    criticalPath: events.filter(e => e.type === 'load' || e.type === 'execute').map(e => e.name),
  };
}

function generateOptimizations(
  bundle?: BundleAnalysis,
  dom?: DOMAnalysis,
  css?: CSSAnalysis,
  assets?: AssetAnalysis,
  js?: JSFileAnalysis[],
  react?: ReactAnalysis
): Optimization[] {
  const optimizations: Optimization[] = [];

  // Bundle optimizations
  if (bundle) {
    if (bundle.totalSize > 1024 * 1024) {
      optimizations.push({
        category: 'bundle',
        title: 'Enable Code Splitting',
        description: `Bundle size is ${(bundle.totalSize / 1024 / 1024).toFixed(1)} MB. Implement lazy loading and dynamic imports.`,
        impact: 'high',
        effort: 'medium',
        code: `const Module = lazy(() => import('./Module'));`,
      });
    }

    if (bundle.duplicateLibraries.length > 0) {
      const lib = bundle.duplicateLibraries[0];
      optimizations.push({
        category: 'bundle',
        title: 'Resolve Duplicate Dependencies',
        description: `${lib.name} appears ${lib.instances} times in your bundle.`,
        impact: 'high',
        effort: 'low',
        code: `npm ls ${lib.name}  # Check versions\nnpm dedupe  # Try deduplication`,
      });
    }

    if (bundle.vendorPercentage > 60) {
      optimizations.push({
        category: 'bundle',
        title: 'Analyze Vendor Dependencies',
        description: `Vendors account for ${bundle.vendorPercentage.toFixed(0)}% of bundle. Review for unused packages.`,
        impact: 'medium',
        effort: 'low',
      });
    }
  }

  // DOM optimizations
  if (dom) {
    if (dom.totalNodes > 1500) {
      optimizations.push({
        category: 'dom',
        title: 'Reduce DOM Node Count',
        description: `${dom.totalNodes} nodes detected. Consider virtual scrolling or pagination.`,
        impact: 'high',
        effort: 'high',
      });
    }

    if (dom.imagesWithoutLazy > 0) {
      optimizations.push({
        category: 'dom',
        title: 'Enable Image Lazy Loading',
        description: `${dom.imagesWithoutLazy} images without lazy loading.`,
        impact: 'medium',
        effort: 'low',
        code: `<img src="image.jpg" loading="lazy" width="800" height="600" />`,
      });
    }

    if (dom.imagesWithoutDimensions > 0) {
      optimizations.push({
        category: 'dom',
        title: 'Add Image Dimensions',
        description: `${dom.imagesWithoutDimensions} images missing width/height attributes.`,
        impact: 'medium',
        effort: 'low',
      });
    }
  }

  // CSS optimizations
  if (css) {
    const unusedPercentage = css.totalRules > 0 ? (css.unusedRules / css.totalRules) * 100 : 0;
    if (unusedPercentage > 30) {
      optimizations.push({
        category: 'css',
        title: 'Remove Unused CSS',
        description: `${unusedPercentage.toFixed(0)}% of CSS selectors are unused.`,
        impact: 'medium',
        effort: 'low',
        code: `// Add to build config\n purgecss: {\n   content: ['./src/**/*.html', './src/**/*.jsx']\n }`,
      });
    }

    if (css.importantCount > 20) {
      optimizations.push({
        category: 'css',
        title: 'Reduce !important Usage',
        description: `${css.importantCount} !important declarations found.`,
        impact: 'low',
        effort: 'medium',
      });
    }
  }

  // JavaScript optimizations
  if (js && js.length > 0) {
    const complexFiles = js.filter(f => f.functions.some(fn => fn.cyclomaticComplexity > 10));
    if (complexFiles.length > 0) {
      optimizations.push({
        category: 'javascript',
        title: 'Refactor Complex Functions',
        description: `${complexFiles.length} files have functions with high cyclomatic complexity.`,
        impact: 'medium',
        effort: 'high',
      });
    }
  }

  // React optimizations
  if (react) {
    if (react.componentsWithInlineFunctions > 0) {
      optimizations.push({
        category: 'react',
        title: 'Memoize Inline Functions',
        description: `${react.componentsWithInlineFunctions} components have inline functions that cause re-renders.`,
        impact: 'medium',
        effort: 'medium',
        code: `const handleClick = useCallback(() => {\n  // handler logic\n}, [deps]);`,
      });
    }

    if (react.largestComponent && react.largestComponent.lines > 200) {
      optimizations.push({
        category: 'react',
        title: 'Split Large Component',
        description: `${react.largestComponent.name} is ${react.largestComponent.lines} lines. Consider breaking it down.`,
        impact: 'medium',
        effort: 'medium',
      });
    }
  }

  // Asset optimizations
  if (assets) {
    if (assets.breakdown.images > assets.breakdown.total * 0.5) {
      optimizations.push({
        category: 'assets',
        title: 'Optimize Images',
        description: `Images account for ${assets.percentages.images.toFixed(0)}% of total size.`,
        impact: 'high',
        effort: 'low',
        code: `// Use WebP format\n// Implement responsive images`,
      });
    }
  }

  return optimizations.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
}

export async function runAnalysisPipeline(
  files: FileInput[],
  options: AnalysisOptions
): Promise<AnalysisReport> {
  // Categorize files
  const htmlFiles = files.filter(f => f.name.endsWith('.html'));
  const jsFiles = files.filter(f => /\.(js|jsx|ts|tsx|mjs)$/.test(f.name));
  const cssFiles = files.filter(f => /\.(css|scss|sass|less)$/.test(f.name));
  
  const htmlContent = htmlFiles[0]?.content || '';

  // Run analyzers
  const bundle = options.includeBundle ? analyzeBundle(files) : undefined;
  const dom = options.includeDOM && htmlContent ? analyzeDOM(htmlContent) : undefined;
  const css = options.includeCSS ? analyzeCSS(cssFiles, htmlContent) : undefined;
  const assets = options.includeAssets ? analyzeAssets(files) : undefined;
  const js = options.includeJS ? analyzeJavaScript(jsFiles) : undefined;
  const react = (options.includeReact && js) ? analyzeReact(js) : undefined;

  // Calculate scores
  const score = calculatePerformanceScore(bundle, dom, css, assets, js);
  const renderRisk = calculateRenderRisk(score, bundle, dom, css);

  // Generate timeline
  const timeline = generateTimeline(
    htmlFiles.length > 0,
    jsFiles.length > 0,
    cssFiles.length > 0,
    bundle?.totalSize || 0
  );

  // Generate optimizations
  const optimizations = generateOptimizations(bundle, dom, css, assets, js, react);

  // Calculate summary
  const totalIssues = 
    (bundle?.duplicateLibraries.length || 0) +
    (dom?.warnings.length || 0) +
    (css?.warnings.length || 0) +
    (js?.reduce((sum, f) => sum + f.warnings.length, 0) || 0) +
    (react?.warnings.length || 0);

  const criticalIssues = 
    (dom?.warnings.filter(w => w.severity === 'error').length || 0) +
    (css?.warnings.filter(w => w.severity === 'error').length || 0) +
    (js?.reduce((sum, f) => sum + f.warnings.filter(w => w.severity === 'error').length, 0) || 0);

  return {
    id: `report-${Date.now()}`,
    timestamp: Date.now(),
    files: files.map(f => ({ name: f.name, type: 'other', size: f.size, content: f.content })),
    bundle,
    dom,
    css,
    assets,
    javascript: js,
    react,
    score,
    renderRisk,
    timeline,
    summary: {
      totalIssues,
      criticalIssues,
      warnings: totalIssues - criticalIssues,
      optimizations,
    },
  };
}
