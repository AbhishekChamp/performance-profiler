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
  WebVitalsAnalysis,
  NetworkAnalysis,
  ImageAnalysis,
  FontAnalysis,
  AccessibilityAnalysis,
  SEOAnalysis,
  TypeScriptAnalysis,
  SecurityAnalysis,
  ThirdPartyAnalysis,
  MemoryAnalysis,
  ImportAnalysis,
} from '@/types';
import { analyzeBundle } from '../analyzers/bundle';
import { analyzeDOM } from '../analyzers/dom';
import { analyzeCSS } from '../analyzers/css';
import { analyzeAssets } from '../analyzers/assets';
import { analyzeJavaScript } from '../analyzers/javascript';
import { analyzeReact } from '../analyzers/react';
import { analyzeWebVitals } from '../analyzers/webVitals';
import { analyzeNetwork } from '../analyzers/network';
import { analyzeImages } from '../analyzers/images';
import { analyzeFonts } from '../analyzers/fonts';
import { analyzeAccessibility } from '../analyzers/accessibility';
import { analyzeSEO } from '../analyzers/seo';
import { analyzeTypeScript } from '../analyzers/typescript';
import { analyzeSecurity } from '../analyzers/security';
import { analyzeThirdParty } from '../analyzers/thirdParty';
import { analyzeMemory } from '../analyzers/memory';
import { analyzeImports } from '../analyzers/imports';
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
  react?: ReactAnalysis,
  webVitals?: WebVitalsAnalysis,
  network?: NetworkAnalysis,
  images?: ImageAnalysis,
  fonts?: FontAnalysis,
  accessibility?: AccessibilityAnalysis,
  seo?: SEOAnalysis,
  typescript?: TypeScriptAnalysis,
  security?: SecurityAnalysis,
  thirdParty?: ThirdPartyAnalysis,
  memory?: MemoryAnalysis,
  imports?: ImportAnalysis
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
        code: `npm ls ${lib.name}  # Check versions
npm dedupe  # Try deduplication`,
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

  // Web Vitals optimizations
  if (webVitals) {
    const lcp = webVitals.metrics.find(m => m.name === 'LCP');
    if (lcp && lcp.score !== 'good') {
      optimizations.push({
        category: 'webVitals',
        title: 'Improve LCP (Largest Contentful Paint)',
        description: `Estimated LCP is ${lcp.value}ms. ${lcp.factors.join(', ')}`,
        impact: 'high',
        effort: 'medium',
        code: `// Optimize images\n// Use CDN\n// Preload LCP image`,
      });
    }

    const cls = webVitals.metrics.find(m => m.name === 'CLS');
    if (cls && cls.score !== 'good') {
      optimizations.push({
        category: 'webVitals',
        title: 'Improve CLS (Cumulative Layout Shift)',
        description: `Estimated CLS is ${cls.value}. ${cls.factors.join(', ')}`,
        impact: 'high',
        effort: 'low',
        code: `// Add width/height to images\n// Reserve space for dynamic content`,
      });
    }
  }

  // Network optimizations
  if (network) {
    if (network.renderBlocking.length > 0) {
      optimizations.push({
        category: 'bundle',
        title: 'Eliminate Render-Blocking Resources',
        description: `${network.renderBlocking.length} resources are blocking initial render.`,
        impact: 'high',
        effort: 'medium',
        code: `// Add async/defer to scripts\n<link rel="preload" href="critical.css" as="style">`,
      });
    }

    if (network.missingHints.length > 0) {
      optimizations.push({
        category: 'bundle',
        title: 'Add Resource Hints',
        description: `${network.missingHints.length} resource hints missing.`,
        impact: 'medium',
        effort: 'low',
        code: `<link rel="preconnect" href="https://fonts.gstatic.com">`,
      });
    }
  }

  // Image optimizations
  if (images) {
    if (images.recommendations.length > 0) {
      optimizations.push({
        category: 'images',
        title: 'Optimize Images',
        description: images.recommendations[0],
        impact: 'high',
        effort: 'low',
        code: `// Convert to WebP\n// Use responsive images with srcset`,
      });
    }
  }

  // Font optimizations
  if (fonts) {
    if (fonts.fontsWithoutDisplay > 0) {
      optimizations.push({
        category: 'fonts',
        title: 'Add font-display: swap',
        description: `${fonts.fontsWithoutDisplay} fonts missing font-display property.`,
        impact: 'medium',
        effort: 'low',
        code: `@font-face {\n  font-family: 'MyFont';\n  src: url('font.woff2') format('woff2');\n  font-display: swap;\n}`,
      });
    }
  }

  // Accessibility optimizations
  if (accessibility) {
    const criticalA11y = accessibility.violations.filter(v => v.severity === 'critical' || v.severity === 'serious');
    if (criticalA11y.length > 0) {
      optimizations.push({
        category: 'accessibility',
        title: 'Fix Critical Accessibility Issues',
        description: `${criticalA11y.length} critical/serious accessibility violations found.`,
        impact: 'high',
        effort: 'medium',
        code: criticalA11y[0]?.fix || '// See detailed report',
      });
    }
  }

  // SEO optimizations
  if (seo) {
    if (seo.issues.length > 0) {
      const criticalSeo = seo.issues.filter(i => i.includes('Missing') || i.includes('title') || i.includes('description'));
      if (criticalSeo.length > 0) {
        optimizations.push({
          category: 'seo',
          title: 'Fix Critical SEO Issues',
          description: criticalSeo[0],
          impact: 'high',
          effort: 'low',
        });
      }
    }
  }

  // Security optimizations
  if (security) {
    if (security.stats.critical > 0 || security.stats.high > 0) {
      optimizations.push({
        category: 'security',
        title: 'Address Security Vulnerabilities',
        description: `${security.stats.critical} critical and ${security.stats.high} high severity issues found.`,
        impact: 'high',
        effort: 'medium',
      });
    }
  }

  // TypeScript optimizations
  if (typescript) {
    if (!typescript.strictMode) {
      optimizations.push({
        category: 'javascript',
        title: 'Enable TypeScript Strict Mode',
        description: 'Strict mode is disabled. Enable for better type safety.',
        impact: 'medium',
        effort: 'low',
        code: `// tsconfig.json\n"compilerOptions": {\n  "strict": true\n}`,
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
  const tsConfigFile = files.find(f => f.name === 'tsconfig.json');

  const htmlContent = htmlFiles[0]?.content || '';
  const hasCSS = cssFiles.length > 0;
  const hasJS = jsFiles.length > 0;

  // Run analyzers
  const bundle = options.includeBundle ? analyzeBundle(files) : undefined;
  const dom = options.includeDOM && htmlContent ? analyzeDOM(htmlContent) : undefined;
  const css = options.includeCSS ? analyzeCSS(cssFiles, htmlContent) : undefined;
  const assets = options.includeAssets ? analyzeAssets(files) : undefined;
  const js = options.includeJS ? analyzeJavaScript(jsFiles) : undefined;
  const react = (options.includeReact && js) ? analyzeReact(js) : undefined;

  // Phase 1: New analyzers
  const webVitals = options.includeWebVitals ? analyzeWebVitals(files, dom, bundle, assets, hasCSS, hasJS) : undefined;
  const network = options.includeNetwork && htmlContent ? analyzeNetwork(htmlContent) : undefined;
  const images = options.includeImages && htmlContent ? analyzeImages(htmlContent) : undefined;
  const fonts = options.includeFonts ? analyzeFonts(cssFiles) : undefined;

  // Phase 2: New analyzers
  const accessibility = options.includeAccessibility && htmlContent ? analyzeAccessibility(htmlContent) : undefined;
  const seo = options.includeSEO && htmlContent ? analyzeSEO(htmlContent) : undefined;
  const typescript = options.includeTypeScript ? analyzeTypeScript(files, tsConfigFile?.content) : undefined;
  const security = options.includeSecurity ? analyzeSecurity(files, htmlContent) : undefined;

  // Phase 4: New analyzers
  const thirdParty = options.includeThirdParty ? analyzeThirdParty(htmlContent, jsFiles) : undefined;
  const memory = options.includeMemory ? analyzeMemory(jsFiles) : undefined;
  const imports = options.includeImports ? analyzeImports(jsFiles) : undefined;

  // Calculate scores
  const score = calculatePerformanceScore(
    bundle, dom, css, assets, js,
    webVitals, accessibility, seo, security
  );
  const renderRisk = calculateRenderRisk(score, bundle, dom, css);

  // Generate timeline
  const timeline = generateTimeline(
    htmlFiles.length > 0,
    jsFiles.length > 0,
    cssFiles.length > 0,
    bundle?.totalSize || 0
  );

  // Generate optimizations
  const optimizations = generateOptimizations(
    bundle, dom, css, assets, js, react,
    webVitals, network, images, fonts,
    accessibility, seo, typescript, security,
    thirdParty, memory, imports
  );

  // Calculate summary
  const totalIssues =
    (bundle?.duplicateLibraries.length || 0) +
    (dom?.warnings.length || 0) +
    (css?.warnings.length || 0) +
    (js?.reduce((sum, f) => sum + f.warnings.length, 0) || 0) +
    (react?.warnings.length || 0) +
    (accessibility?.violations.length || 0) +
    (security?.vulnerabilities.length || 0) +
    (typescript?.issues.length || 0) +
    (memory?.leakRisks.length || 0) +
    (imports?.duplicateImports.length || 0);

  const criticalIssues =
    (dom?.warnings.filter(w => w.severity === 'error').length || 0) +
    (css?.warnings.filter(w => w.severity === 'error').length || 0) +
    (js?.reduce((sum, f) => sum + f.warnings.filter(w => w.severity === 'error').length, 0) || 0) +
    (accessibility?.violations.filter(v => v.severity === 'critical').length || 0) +
    (security?.stats.critical || 0);

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
    webVitals,
    network,
    images,
    fonts,
    accessibility,
    seo,
    typescript,
    security,
    thirdParty,
    memory,
    imports,
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
