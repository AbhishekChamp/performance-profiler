/**
 * Analysis Pipeline
 * 
 * Orchestrates the analysis process with parallel processing support,
 * streaming, and progress callbacks.
 * 
 * @module core/pipeline
 */

import type { 
  UploadedFile, 
  AnalysisOptions, 
  AnalysisReport,
  AnalyzedFile
} from '@/types';
import type { AnalysisStage } from '@/workers/types';

import { analyzeBundle } from '@/core/analyzers/bundle';
import { analyzeDOM } from '@/core/analyzers/dom';
import { analyzeCSS } from '@/core/analyzers/css';
import { analyzeJavaScript } from '@/core/analyzers/javascript';
import { analyzeReact } from '@/core/analyzers/react';
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
  
  // React analysis (depends on JS analysis)
  reportProgress('react', 0);
  const reactAnalysis = analyzeReact(jsAnalysis) ?? {
    componentCount: 0,
    largeComponents: [],
    componentsWithInlineFunctions: 0,
    avgPropsPerComponent: 0,
    score: 100,
  };
  reportProgress('react', 100);
  
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
  
  // Issues are collected within each analyzer
  
  const report = {
    id: generateReportId(),
    timestamp: Date.now(),
    files: files.map(f => {
      const fileType: AnalyzedFile['type'] = f.name.endsWith('.html') ? 'html' :
        f.name.endsWith('.js') || f.name.endsWith('.ts') || f.name.endsWith('.jsx') || f.name.endsWith('.tsx') ? 'javascript' :
        f.name.endsWith('.css') || f.name.endsWith('.scss') ? 'css' :
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
    react: reactAnalysis,
    webVitals: webVitalsAnalysisResult,
    network: networkAnalysis,
    images: imagesAnalysis,
    fonts: fontsAnalysis,
    accessibility: accessibilityAnalysis,
    seo: seoAnalysis,
    typescript: tsAnalysis,
    security: securityAnalysis,
    score,
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
 * Generate unique report ID
 */
function generateReportId(): string {
  return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export types and utilities
export type { PipelineConfig };
export { groupFilesByType, isImageFile, isFontFile, countAssetsByType };


