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

// Phase 1: Web Vitals Types
export interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';
  value: number;
  unit: 'ms' | 's' | 'score';
  score: 'good' | 'needs-improvement' | 'poor';
  estimated: boolean;
  factors: string[];
}

export interface WebVitalsAnalysis {
  metrics: WebVitalMetric[];
  overallScore: number;
  criticalIssues: string[];
  recommendations: string[];
}

// Phase 1: Network Analysis Types
export interface ResourceHint {
  type: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch' | 'modulepreload';
  href: string;
  as?: string;
  crossorigin?: boolean;
}

export interface RenderBlockingResource {
  type: 'css' | 'js';
  path: string;
  reason: string;
  suggestion: string;
}

export interface NetworkAnalysis {
  hints: ResourceHint[];
  missingHints: string[];
  renderBlocking: RenderBlockingResource[];
  criticalCSSSize: number;
  http2PushSuggestions: string[];
  score: number;
}

// Phase 1: Image Optimization Types
export interface ImageOptimization {
  src: string;
  currentSize: number;
  estimatedOptimizedSize: number;
  format: 'jpeg' | 'png' | 'gif' | 'webp' | 'avif' | 'svg' | 'unknown';
  hasModernFormat: boolean;
  hasSrcset: boolean;
  hasSizes: boolean;
  hasLazyLoading: boolean;
  hasDimensions: boolean;
  isLCP: boolean;
  savings: number;
  width?: number;
  height?: number;
}

export interface ImageAnalysis {
  images: ImageOptimization[];
  totalSize: number;
  optimizableSize: number;
  modernFormatPercentage: number;
  lazyLoadingPercentage: number;
  lcpImage?: ImageOptimization;
  recommendations: string[];
}

// Phase 1: Font Loading Types
export interface FontFace {
  family: string;
  source: string;
  format: 'woff2' | 'woff' | 'ttf' | 'otf' | 'eot';
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  unicodeRange?: string;
  isPreloaded: boolean;
  estimatedSize: number;
}

export interface FontAnalysis {
  fonts: FontFace[];
  totalFontSize: number;
  fontsWithoutDisplay: number;
  missingPreloads: string[];
  systemFontFallbacks: boolean;
  variableFontOpportunities: string[];
  recommendations: string[];
  score: number;
}

// Phase 2: Accessibility Types
export interface A11yViolation {
  rule: string;
  element: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  message: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  fix: string;
  code?: string;
}

export interface AccessibilityAnalysis {
  score: number;
  violations: A11yViolation[];
  passed: string[];
  wcagLevel: 'A' | 'AA' | 'AAA';
  stats: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

// Phase 2: SEO Types
export interface SEOMeta {
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  viewport: string;
  canonical?: string;
  robots?: string;
}

export interface OpenGraph {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  url?: string;
}

export interface SEOAnalysis {
  meta: SEOMeta;
  openGraph: OpenGraph;
  twitterCard: Partial<OpenGraph>;
  structuredData: unknown[];
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    hierarchyValid: boolean;
  };
  score: number;
  issues: string[];
}

// Phase 2: TypeScript Quality Types
export interface TSConfigCheck {
  option: string;
  enabled: boolean;
  recommended: boolean;
  severity: 'error' | 'warning' | 'info';
}

export interface TypeScriptIssue {
  type: 'any-usage' | 'implicit-any' | 'unused-type' | 'complex-type' | 'missing-return-type';
  file: string;
  line: number;
  message: string;
  severity: 'warning' | 'info';
}

export interface TypeScriptAnalysis {
  score: number;
  strictMode: boolean;
  anyCount: number;
  typeCoverage: number;
  issues: TypeScriptIssue[];
  tsConfigChecks: TSConfigCheck[];
  recommendations: string[];
}

// Phase 2: Security Types
export interface SecurityVulnerability {
  type: 'xss' | 'eval' | 'inline-script' | 'mixed-content' | 'hardcoded-secret' | 'missing-sri';
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  code: string;
  fix: string;
}

export interface SecurityAnalysis {
  score: number;
  vulnerabilities: SecurityVulnerability[];
  stats: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
}

export interface PerformanceScore {
  overall: number;
  bundle: number;
  dom: number;
  css: number;
  assets: number;
  javascript: number;
  webVitals?: number;
  accessibility?: number;
  seo?: number;
  security?: number;
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
  webVitals?: WebVitalsAnalysis;
  network?: NetworkAnalysis;
  images?: ImageAnalysis;
  fonts?: FontAnalysis;
  accessibility?: AccessibilityAnalysis;
  seo?: SEOAnalysis;
  typescript?: TypeScriptAnalysis;
  security?: SecurityAnalysis;
  // Phase 4
  thirdParty?: ThirdPartyAnalysis;
  memory?: MemoryAnalysis;
  bundleDiff?: BundleDiff;
  imports?: ImportAnalysis;
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
  category: 'bundle' | 'dom' | 'css' | 'assets' | 'javascript' | 'react' | 'webVitals' | 'images' | 'fonts' | 'accessibility' | 'seo' | 'security' | 'typescript' | 'thirdParty' | 'memory' | 'imports';
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
  includeWebVitals: boolean;
  includeNetwork: boolean;
  includeImages: boolean;
  includeFonts: boolean;
  includeAccessibility: boolean;
  includeSEO: boolean;
  includeTypeScript: boolean;
  includeSecurity: boolean;
  // Phase 4
  includeThirdParty: boolean;
  includeMemory: boolean;
  includeBundleDiff: boolean;
  includeImports: boolean;
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

// Phase 3: Performance Budget Types
export interface PerformanceBudget {
  bundleSize: number;
  imageSize: number;
  cssSize: number;
  jsSize: number;
  domNodes: number;
  maxDepth: number;
  unusedCSS: number;
  overallScore: number;
}

export interface BudgetStatus {
  metric: string;
  limit: number;
  current: number;
  percentage: number;
  status: 'pass' | 'warning' | 'fail';
}

export interface BudgetAlert {
  type: 'warning' | 'error';
  metric: string;
  message: string;
  current: number;
  limit: number;
}

// Phase 3: Report Comparison Types
export interface MetricDiff {
  before: number;
  after: number;
  delta: number;
  percentageChange: number;
}

export interface ReportComparison {
  baseline: AnalysisReport;
  current: AnalysisReport;
  changes: {
    overall: MetricDiff;
    bundle?: MetricDiff;
    dom?: MetricDiff;
    css?: MetricDiff;
    assets?: MetricDiff;
    javascript?: MetricDiff;
    webVitals?: MetricDiff;
    accessibility?: MetricDiff;
    seo?: MetricDiff;
    security?: MetricDiff;
  };
  improvements: string[];
  regressions: string[];
  timestamp: number;
}

// Phase 4: Third-Party Script Types
export interface ThirdPartyScript {
  name: string;
  url: string;
  category: 'analytics' | 'advertising' | 'widget' | 'cdn' | 'social' | 'other';
  estimatedSize: number;
  estimatedLoadTime: number;
  hasAsync: boolean;
  hasDefer: boolean;
  privacyImpact: 'low' | 'medium' | 'high';
  blockingType: 'render' | 'parser' | 'none';
  alternatives?: string[];
}

export interface ThirdPartyAnalysis {
  scripts: ThirdPartyScript[];
  totalSize: number;
  totalLoadTime: number;
  highPrivacyRisk: number;
  renderBlocking: number;
  recommendations: string[];
}

// Phase 4: Memory Analysis Types
export interface MemoryLeakRisk {
  type: 'event-listener' | 'closure' | 'global-variable' | 'dom-reference' | 'interval';
  file: string;
  line: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
  fix: string;
}

export interface MemoryAnalysis {
  estimatedHeapSize: number;
  leakRisks: MemoryLeakRisk[];
  highRiskCount: number;
  mediumRiskCount: number;
  recommendations: string[];
}

// Phase 4: Bundle Diff Types
export interface BundleModuleDiff {
  name: string;
  type: 'added' | 'removed' | 'changed' | 'unchanged';
  sizeBefore?: number;
  sizeAfter?: number;
  sizeDelta?: number;
}

export interface BundleDiff {
  modules: BundleModuleDiff[];
  totalSizeDelta: number;
  addedModules: number;
  removedModules: number;
  changedModules: number;
  duplicateChanges: string[];
}

// Phase 4: Import Cost Types
export interface ImportCost {
  path: string;
  source: string;
  size: number;
  isTreeShakable: boolean;
  isDuplicate: boolean;
  suggestions: string[];
}

export interface ImportAnalysis {
  imports: ImportCost[];
  totalImportSize: number;
  duplicateImports: ImportCost[];
  nonTreeShakableImports: ImportCost[];
  barrelFileImports: ImportCost[];
  recommendations: string[];
}

// Quick Wins: Theme Types
export type ThemeMode = 'dark' | 'light' | 'system';

// Quick Wins: Report History Types
export interface HistoryFilters {
  search: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  minScore: number;
}

export interface SavedReport extends AnalysisReport {
  isPinned?: boolean;
  tags?: string[];
}

// Quick Wins: Keyboard Shortcuts
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: string;
  description: string;
}

// Quick Wins: Report Templates
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  suggestedFiles: string[];
  options: Partial<AnalysisOptions>;
}
