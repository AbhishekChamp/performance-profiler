/**
 * Types for CI/CD Config Generator (Feature 7)
 */

export type CIPlatform = 
  | 'github-actions'
  | 'gitlab-ci'
  | 'circleci'
  | 'azure-devops'
  | 'jenkins'
  | 'vercel'
  | 'netlify';

export type ConfigFormat = 'yaml' | 'json' | 'javascript';

export interface PerformanceBudget {
  bundleSize?: number; // in KB
  jsSize?: number;
  cssSize?: number;
  imageSize?: number;
  fontSize?: number;
  lighthousePerformance?: number;
  lighthouseAccessibility?: number;
  lighthouseBestPractices?: number;
  lighthouseSEO?: number;
  maxFirstContentfulPaint?: number; // in ms
  maxLargestContentfulPaint?: number; // in ms
  maxTimeToInteractive?: number; // in ms
  maxCumulativeLayoutShift?: number;
}

export interface BudgetConfig {
  name: string;
  description: string;
  budgets: PerformanceBudget;
  failOnViolation: boolean;
  warnOnViolation: boolean;
  commentOnPR: boolean;
}

export interface GeneratedConfig {
  platform: CIPlatform;
  format: ConfigFormat;
  filename: string;
  content: string;
  setupInstructions: string[];
  requiredPlugins: string[];
  requiredEnvVars?: string[];
}

export interface PlatformInfo {
  id: CIPlatform;
  name: string;
  icon: string;
  description: string;
  supportedFormats: ConfigFormat[];
  defaultFormat: ConfigFormat;
}

export interface BudgetCheckScript {
  name: string;
  description: string;
  script: string;
  language: 'javascript' | 'bash' | 'python';
}
