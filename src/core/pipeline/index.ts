/**
 * Analysis Pipeline
 * 
 * Orchestrates the analysis process with parallel processing support,
 * streaming, and progress callbacks.
 * 
 * @module core/pipeline
 */

import type { 
  AnalysisOptions, 
  AnalysisReport, 
  AnalyzedFile,
  Optimization,
  ReportSummary,
  UploadedFile
} from '@/types';
import type { AnalysisStage } from '@/workers/types';

import { analyzeBundle } from '@/core/analyzers/bundle';
import { analyzeDOM } from '@/core/analyzers/dom';
import { analyzeCSS } from '@/core/analyzers/css';
import { analyzeJavaScript } from '@/core/analyzers/javascript';

import { analyzeWebVitals } from '@/core/analyzers/webVitals';
import type { WebVitalsAnalysis } from '@/types';
import { analyzeNetwork } from '@/core/analyzers/network';
import { analyzeImages } from '@/core/analyzers/images';
import { analyzeFonts } from '@/core/analyzers/fonts';
import { analyzeAccessibility } from '@/core/analyzers/accessibility';
import { analyzeSEO } from '@/core/analyzers/seo';
import { analyzeTypeScript } from '@/core/analyzers/typescript';
import { analyzeSecurity } from '@/core/analyzers/security';
import { analyzeAssets } from '@/core/analyzers/assets';
import { calculatePerformanceScore } from '@/core/scoring';

import { isMemoryConstrained, requestMemoryCleanup } from '@/utils/streamProcessor';

/**
 * Pipeline configuration
 */
interface PipelineConfig {
  useCache: boolean;
  batchSize: number;
  maxConcurrent: number;
  enableStreaming: boolean;
}

const DEFAULT_CONFIG: PipelineConfig = {
  useCache: true,
  batchSize: 5,
  maxConcurrent: 4,
  enableStreaming: true,
};



/**
 * Run the complete analysis pipeline
 */
export interface PipelineOptions extends Partial<PipelineConfig> {
  onProgress?: (stage: AnalysisStage, progress: number) => void;
}

export async function runAnalysisPipeline(
  files: UploadedFile[],
  _options: AnalysisOptions = {} as AnalysisOptions,
  config: PipelineOptions = {}
): Promise<AnalysisReport> {
  const pipelineConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Check memory and cleanup if needed
  if (isMemoryConstrained(0.7)) {
    requestMemoryCleanup();
  }
  
  // Progress callback wrapper
  const reportProgress = (stage: AnalysisStage, progress: number): void => {
    config.onProgress?.(stage, progress);
  };
  
  reportProgress('parsing', 0);
  

  
  reportProgress('parsing', 100);
  reportProgress('bundle', 0);
  
  // Run independent analyses in parallel
  const [
    bundleAnalysis,
    domAnalysis,
    cssAnalysis,
    assetsAnalysis,
    jsAnalysis,
    networkAnalysis,
    imagesAnalysis,
    fontsAnalysis,
    accessibilityAnalysis,
    seoAnalysis,
    tsAnalysis,
    securityAnalysis,
    webVitalsAnalysisResult,
  ] = await Promise.all([
    // Bundle analysis
    runAnalyzer('bundle', () => analyzeBundle(files), pipelineConfig),
    
    // DOM analysis (needs HTML content)
    runAnalyzer('dom', () => {
      const htmlFile = files.find(f => f.name.endsWith('.html'));
      return analyzeDOM(htmlFile?.content ?? '');
    }, pipelineConfig),
    
    // CSS analysis
    runAnalyzer('css', () => analyzeCSS(
      files.filter(f => f.name.endsWith('.css') || f.name.endsWith('.scss')),
      files.find(f => f.name.endsWith('.html'))?.content ?? ''
    ), pipelineConfig),
    
    // Assets analysis
    runAnalyzer('assets', () => analyzeAssets(files), pipelineConfig),
    
    // JavaScript analysis
    runAnalyzer('javascript', () => analyzeJavaScript(
      files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.ts'))
    ), pipelineConfig),
    
    // Network analysis
    runAnalyzer('network', () => analyzeNetwork(
      files.find(f => f.name.endsWith('.html'))?.content ?? ''
    ), pipelineConfig),
    
    // Images analysis
    runAnalyzer('images', () => analyzeImages(
      files.find(f => f.name.endsWith('.html'))?.content ?? ''
    ), pipelineConfig),
    
    // Fonts analysis
    runAnalyzer('fonts', () => analyzeFonts(
      files.filter(f => f.name.endsWith('.css') || f.name.endsWith('.scss'))
    ), pipelineConfig),
    
    // Accessibility analysis
    runAnalyzer('accessibility', () => analyzeAccessibility(
      files.find(f => f.name.endsWith('.html'))?.content ?? ''
    ), pipelineConfig),
    
    // SEO analysis
    runAnalyzer('seo', () => analyzeSEO(
      files.find(f => f.name.endsWith('.html'))?.content ?? ''
    ), pipelineConfig),
    
    // TypeScript analysis
    runAnalyzer('typescript', () => analyzeTypeScript(
      files.filter(f => f.name.endsWith('.ts') || f.name.endsWith('.tsx'))
    ), pipelineConfig),
    
    // Security analysis
    runAnalyzer('security', () => analyzeSecurity(
      files,
      files.find(f => f.name.endsWith('.html'))?.content ?? ''
    ), pipelineConfig),
    

    

    
    // Web Vitals analysis
    runAnalyzer('web-vitals', () => Promise.resolve(analyzeWebVitals(
      files,
      undefined,
      undefined,
      undefined,
      true,
      true
    )), pipelineConfig),
  ]);
  
  
  reportProgress('scoring', 0);
  
  // Calculate performance score
  const score = calculatePerformanceScore(
    bundleAnalysis,
    domAnalysis,
    cssAnalysis,
    assetsAnalysis,
    jsAnalysis,
    webVitalsAnalysisResult as WebVitalsAnalysis
  );
  
  reportProgress('scoring', 100);
  
  // Collect issues from all analyzers and build summary
  const summary = buildReportSummary(
    bundleAnalysis,
    domAnalysis,
    cssAnalysis,
    jsAnalysis,
    accessibilityAnalysis,
    seoAnalysis,
    securityAnalysis,
    tsAnalysis
  );
  
  const report = {
    id: generateReportId(),
    timestamp: Date.now(),
    files: files.map(f => {
      const fileType: AnalyzedFile['type'] = f.name.endsWith('.html') ? 'html' :
        (f.name.endsWith('.js') || f.name.endsWith('.ts') || f.name.endsWith('.jsx') || f.name.endsWith('.tsx')) ? 'javascript' :
        (f.name.endsWith('.css') || f.name.endsWith('.scss')) ? 'css' :
        f.name.endsWith('.json') ? 'json' : 'other';
      return {
        name: f.name,
        type: fileType,
        size: f.size,
        content: f.content,
      };
    }),
    bundle: bundleAnalysis,
    dom: domAnalysis,
    css: cssAnalysis,
    assets: assetsAnalysis,
    javascript: jsAnalysis,
    webVitals: webVitalsAnalysisResult,
    network: networkAnalysis,
    images: imagesAnalysis,
    fonts: fontsAnalysis,
    accessibility: accessibilityAnalysis,
    seo: seoAnalysis,
    typescript: tsAnalysis,
    security: securityAnalysis,
    score,
    summary,
    renderRisk: {
      level: 'low',
      score: 0,
      reasons: [],
      recommendations: [],
    },
    timeline: {
      events: [],
      totalTime: 0,
      criticalPath: [],
    },
  } as AnalysisReport;
  
  reportProgress('complete', 100);
  
  return report;
}

/**
 * Run an analyzer with caching support
 */
async function runAnalyzer<T>(
  _name: string,
  analyzer: () => T | Promise<T>,
  _config: PipelineConfig
): Promise<T> {
  // For now, skip caching in pipeline - it should be at file level
  // This is where we could add result-level caching if needed
  return analyzer();
}

/**
 * Group files by their type
 */
function groupFilesByType(files: UploadedFile[]): Record<string, UploadedFile[]> {
  const groups: Record<string, UploadedFile[]> = {
    html: [],
    css: [],
    js: [],
    ts: [],
    jsx: [],
    tsx: [],
    images: [],
    fonts: [],
    other: [],
  };
  
  for (const file of files) {
    const _ext = file.name.split('.').pop()?.toLowerCase();
    
    if (file.name.endsWith('.html')) groups.html.push(file);
    else if (file.name.endsWith('.css') || file.name.endsWith('.scss')) groups.css.push(file);
    else if (file.name.endsWith('.js') || file.name.endsWith('.mjs')) groups.js.push(file);
    else if (file.name.endsWith('.ts')) groups.ts.push(file);
    else if (file.name.endsWith('.jsx')) groups.jsx.push(file);
    else if (file.name.endsWith('.tsx')) groups.tsx.push(file);
    else if (isImageFile(file.name)) groups.images.push(file);
    else if (isFontFile(file.name)) groups.fonts.push(file);
    else groups.other.push(file);
  }
  
  return groups;
}

/**
 * Check if file is an image
 */
function isImageFile(filename: string): boolean {
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'];
  return imageExts.some(ext => filename.toLowerCase().endsWith(ext));
}

/**
 * Check if file is a font
 */
function isFontFile(filename: string): boolean {
  const fontExts = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];
  return fontExts.some(ext => filename.toLowerCase().endsWith(ext));
}

/**
 * Count assets by type
 */
function countAssetsByType(files: UploadedFile[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'unknown';
    counts[ext] = (counts[ext] ?? 0) + 1;
  }
  
  return counts;
}

// Issue collection is handled within individual analyzers

/**
 * Build report summary from all analyzer results
 */
function buildReportSummary(
  bundle?: unknown,
  dom?: unknown,
  css?: unknown,
  js?: unknown,
  accessibility?: { violations?: { severity: string }[] },
  seo?: { issues?: string[] },
  security?: { vulnerabilities?: { severity: string }[] },
  typescript?: { issues?: unknown[] }
): ReportSummary {
  let totalIssues = 0;
  let criticalIssues = 0;
  let warnings = 0;
  const optimizations: Optimization[] = [];
  
  // Count DOM issues
  if (dom !== undefined && dom !== null && typeof dom === 'object' && 'warnings' in dom) {
    const domWarnings = (dom as { warnings?: { severity: string }[] }).warnings;
    if (Array.isArray(domWarnings)) {
      totalIssues += domWarnings.length;
      criticalIssues += domWarnings.filter((w): boolean => w.severity === 'error').length;
      warnings += domWarnings.filter((w): boolean => w.severity === 'warning').length;
    }
  }
  
  // Count CSS issues
  if (css !== undefined && css !== null && typeof css === 'object' && 'warnings' in css) {
    const cssWarnings = (css as { warnings?: { severity: string }[] }).warnings;
    if (Array.isArray(cssWarnings)) {
      totalIssues += cssWarnings.length;
      criticalIssues += cssWarnings.filter((w): boolean => w.severity === 'error').length;
      warnings += cssWarnings.filter((w): boolean => w.severity === 'warning').length;
    }
  }
  
  // Count JS issues
  if (js !== undefined && js !== null && Array.isArray(js)) {
    for (const file of js) {
      if (file !== undefined && file !== null && typeof file === 'object' && 'warnings' in file) {
        const jsWarnings = (file as { warnings?: { severity: string }[] }).warnings;
        if (Array.isArray(jsWarnings)) {
          totalIssues += jsWarnings.length;
          criticalIssues += jsWarnings.filter((w): boolean => w.severity === 'error').length;
          warnings += jsWarnings.filter((w): boolean => w.severity === 'warning').length;
        }
      }
    }
  }
  
  
  // Count accessibility violations
  if (accessibility?.violations !== undefined) {
    totalIssues += accessibility.violations.length;
    criticalIssues += accessibility.violations.filter((v): boolean => 
      v.severity === 'critical' || v.severity === 'serious'
    ).length;
  }
  
  // Count SEO issues
  if (seo?.issues !== undefined) {
    totalIssues += seo.issues.length;
    warnings += seo.issues.length;
  }
  
  // Count security vulnerabilities
  if (security?.vulnerabilities !== undefined) {
    totalIssues += security.vulnerabilities.length;
    criticalIssues += security.vulnerabilities.filter((v): boolean => 
      v.severity === 'critical' || v.severity === 'high'
    ).length;
  }
  
  // Count TypeScript issues
  if (typescript?.issues !== undefined) {
    totalIssues += typescript.issues.length;
    warnings += typescript.issues.length;
  }
  
  // Generate optimizations based on findings
  if (bundle !== undefined && bundle !== null && typeof bundle === 'object') {
    const b = bundle as { duplicateLibraries?: unknown[]; vendorPercentage?: number };
    if (b.duplicateLibraries !== undefined && b.duplicateLibraries.length > 0) {
      optimizations.push({
        category: 'bundle',
        title: 'Remove Duplicate Libraries',
        description: `Found ${b.duplicateLibraries.length} duplicate libraries that can be deduplicated.`,
        impact: 'high',
        effort: 'medium',
      });
    }
    if (b.vendorPercentage !== undefined && b.vendorPercentage > 50) {
      optimizations.push({
        category: 'bundle',
        title: 'Reduce Vendor Bundle Size',
        description: `Vendor code is ${b.vendorPercentage.toFixed(0)}% of bundle. Consider code splitting.`,
        impact: 'high',
        effort: 'high',
      });
    }
  }
  
  return {
    totalIssues,
    criticalIssues,
    warnings,
    optimizations: optimizations.slice(0, 10), // Limit to top 10
  };
}

/**
 * Generate unique report ID
 */
function generateReportId(): string {
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Export types and utilities
export type { PipelineConfig };
export { groupFilesByType, isImageFile, isFontFile, countAssetsByType };


