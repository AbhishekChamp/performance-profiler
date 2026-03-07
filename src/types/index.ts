export interface BundleModule {
  id: string;
  name: string;
  size: number;
  gzippedSize?: number;
  type: 'entry' | 'chunk' | 'vendor' | 'asset';
  dependencies: string[];
  dependents: string[];
  path: string;
}

export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  moduleCount: number;
  largestModules: BundleModule[];
  duplicateLibraries: DuplicateLibrary[];
  vendorSize: number;
  vendorPercentage: number;
  modules: BundleModule[];
}

export interface DuplicateLibrary {
  name: string;
  versions: string[];
  instances: number;
  totalSize: number;
}

export interface DOMNode {
  tag: string;
  id?: string;
  className?: string;
  depth: number;
  children: DOMNode[];
  attributes: Record<string, string>;
  hasLazyLoading: boolean;
}

export interface DOMAnalysis {
  totalNodes: number;
  maxDepth: number;
  nodesPerLevel: Record<number, number>;
  largestSubtree: { tag: string; nodeCount: number };
  leafNodes: number;
  imagesWithoutLazy: number;
  imagesWithoutDimensions: number;
  largeImages: ImageInfo[];
  warnings: DOMWarning[];
}

export interface ImageInfo {
  src: string;
  size: number;
  hasWidth: boolean;
  hasHeight: boolean;
  hasLazyLoading: boolean;
}

export interface DOMWarning {
  type: 'deep-nesting' | 'too-many-nodes' | 'missing-lazy' | 'missing-dimensions' | 'large-image';
  message: string;
  severity: 'info' | 'warning' | 'error';
  element?: string;
}

export interface CSSRule {
  selector: string;
  declarations: string[];
  used: boolean;
  file?: string;
  line?: number;
}

export interface CSSAnalysis {
  totalRules: number;
  unusedRules: number;
  inlineStyles: number;
  importantCount: number;
  largeFiles: CSSFile[];
  unusedSelectors: string[];
  rules: CSSRule[];
  warnings: CSSWarning[];
}

export interface CSSFile {
  path: string;
  size: number;
  ruleCount: number;
}

export interface CSSWarning {
  type: 'unused-selector' | 'inline-style' | 'exclamation-important' | 'large-file';
  message: string;
  severity: 'info' | 'warning' | 'error';
  selector?: string;
}

export interface AssetBreakdown {
  javascript: number;
  css: number;
  images: number;
  fonts: number;
  other: number;
  total: number;
}

export interface AssetAnalysis {
  breakdown: AssetBreakdown;
  percentages: Record<keyof AssetBreakdown, number>;
  largestAssets: Asset[];
  byType: Record<string, Asset[]>;
}

export interface Asset {
  path: string;
  type: string;
  size: number;
  compressedSize?: number;
}

export interface JSFunction {
  name: string;
  line: number;
  column: number;
  lines: number;
  nestedLoops: number;
  cyclomaticComplexity: number;
  parameters: number;
}

export interface JSFileAnalysis {
  path: string;
  content: string;
  size: number;
  lines: number;
  functions: JSFunction[];
  largestFunction: JSFunction | null;
  mostComplexFunction: JSFunction | null;
  totalComplexity: number;
  warnings: JSWarning[];
}

export interface JSWarning {
  type: 'nested-loop' | 'large-function' | 'high-complexity' | 'large-file';
  message: string;
  severity: 'info' | 'warning' | 'error';
  function?: string;
  line?: number;
}

export interface ReactComponent {
  name: string;
  file: string;
  line: number;
  lines: number;
  props: string[];
  propCount: number;
  hasInlineFunctions: boolean;
  inlineFunctionCount: number;
  children: string[];
  depth: number;
}

export interface ReactAnalysis {
  components: ReactComponent[];
  largestComponent: ReactComponent | null;
  deepestComponent: ReactComponent | null;
  totalComponents: number;
  componentsWithInlineFunctions: number;
  excessiveProps: ReactComponent[];
  warnings: ReactWarning[];
}

export interface ReactWarning {
  type: 'large-component' | 'inline-function' | 'excessive-props' | 'deep-tree';
  message: string;
  severity: 'info' | 'warning' | 'error';
  component?: string;
}

export interface PerformanceScore {
  overall: number;
  bundle: number;
  dom: number;
  css: number;
  assets: number;
  javascript: number;
}

export interface RenderRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  reasons: string[];
  recommendations: string[];
}

export interface TimelineEvent {
  name: string;
  start: number;
  end: number;
  duration: number;
  type: 'parse' | 'load' | 'execute' | 'render' | 'paint';
}

export interface PerformanceTimeline {
  events: TimelineEvent[];
  totalTime: number;
  criticalPath: string[];
}

export interface AnalysisReport {
  id: string;
  timestamp: number;
  files: AnalyzedFile[];
  bundle?: BundleAnalysis;
  dom?: DOMAnalysis;
  css?: CSSAnalysis;
  assets?: AssetAnalysis;
  javascript?: JSFileAnalysis[];
  react?: ReactAnalysis;
  score: PerformanceScore;
  renderRisk: RenderRisk;
  timeline: PerformanceTimeline;
  summary: ReportSummary;
}

export interface AnalyzedFile {
  name: string;
  type: 'html' | 'javascript' | 'css' | 'json' | 'other';
  size: number;
  content: string;
}

export interface ReportSummary {
  totalIssues: number;
  criticalIssues: number;
  warnings: number;
  optimizations: Optimization[];
}

export interface Optimization {
  category: 'bundle' | 'dom' | 'css' | 'assets' | 'javascript' | 'react';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  code?: string;
}

export interface AnalysisWorkerInput {
  files: File[];
  options: AnalysisOptions;
}

export interface AnalysisOptions {
  includeBundle: boolean;
  includeDOM: boolean;
  includeCSS: boolean;
  includeAssets: boolean;
  includeJS: boolean;
  includeReact: boolean;
}

export interface AnalysisProgress {
  stage: string;
  progress: number;
  message: string;
}

export type AnalysisStatus = 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'scoring' | 'complete' | 'error';

export type UploadFileType = 'html' | 'javascript' | 'react-build' | 'mixed';

export interface UploadedProject {
  id: string;
  name: string;
  files: UploadedFile[];
  type: UploadFileType;
  timestamp: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  path: string;
}
