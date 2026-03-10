import type { ReportTemplate } from '@/types';

/**
 * Built-in report templates for different project types
 */

export const BUILTIN_TEMPLATES: ReportTemplate[] = [
  {
    id: 'ecommerce',
    name: 'E-commerce Site',
    description: 'Optimized for online stores with heavy image usage, bundle optimization focus, and SEO critical requirements.',
    icon: 'ShoppingCart',
    color: '#f97316', // Orange
    category: 'ecommerce',
    suggestedFiles: ['*.html', '*.css', '*.js', 'product-*.jpg', 'category-*.png'],
    options: {
      includeBundle: true,
      includeDOM: true,
      includeCSS: true,
      includeAssets: true,
      includeJS: true,
      includeReact: true,
      includeWebVitals: true,
      includeNetwork: true,
      includeImages: true,
      includeFonts: true,
      includeAccessibility: true,
      includeSEO: true,
      includeTypeScript: false,
      includeSecurity: true,
      includeThirdParty: true,
      includeMemory: false,
      includeBundleDiff: true,
      includeImports: true,
    },
    budget: {
      bundleSize: 500 * 1024, // 500KB
      imageSize: 2 * 1024 * 1024, // 2MB
      cssSize: 100 * 1024, // 100KB
      jsSize: 300 * 1024, // 300KB
      domNodes: 1500,
      maxDepth: 20,
      unusedCSS: 30,
      overallScore: 80,
    },
    weights: {
      bundle: 25,
      dom: 15,
      css: 10,
      assets: 20,
      javascript: 10,
      webVitals: 15,
      accessibility: 3,
      seo: 2,
    },
    priorityRecommendations: [
      'Optimize product images (WebP, lazy loading)',
      'Implement code splitting for checkout flow',
      'Add structured data for products',
      'Optimize Core Web Vitals for conversion',
    ],
    isBuiltIn: true,
  },
  {
    id: 'spa',
    name: 'Single Page App',
    description: 'For React/Vue/Angular apps with focus on bundle analysis, lazy loading, and React patterns optimization.',
    icon: 'AppWindow',
    color: '#58a6ff', // Blue
    category: 'spa',
    suggestedFiles: ['*.tsx', '*.jsx', '*.ts', '*.js', 'vite.config.*', 'webpack.config.*'],
    options: {
      includeBundle: true,
      includeDOM: true,
      includeCSS: true,
      includeAssets: true,
      includeJS: true,
      includeReact: true,
      includeWebVitals: true,
      includeNetwork: true,
      includeImages: true,
      includeFonts: true,
      includeAccessibility: true,
      includeSEO: false,
      includeTypeScript: true,
      includeSecurity: true,
      includeThirdParty: true,
      includeMemory: true,
      includeBundleDiff: true,
      includeImports: true,
    },
    budget: {
      bundleSize: 300 * 1024, // 300KB initial
      imageSize: 1 * 1024 * 1024, // 1MB
      cssSize: 50 * 1024, // 50KB
      jsSize: 500 * 1024, // 500KB total
      domNodes: 2000,
      maxDepth: 25,
      unusedCSS: 40,
      overallScore: 85,
    },
    weights: {
      bundle: 30,
      dom: 10,
      css: 5,
      assets: 10,
      javascript: 20,
      webVitals: 15,
      accessibility: 5,
      seo: 0,
    },
    priorityRecommendations: [
      'Implement route-based code splitting',
      'Optimize React component re-renders',
      'Use React.lazy for heavy components',
      'Analyze bundle for duplicate dependencies',
    ],
    isBuiltIn: true,
  },
  {
    id: 'blog',
    name: 'Static Blog',
    description: 'Content-focused sites with emphasis on SEO, image optimization, and accessibility.',
    icon: 'FileText',
    color: '#22c55e', // Green
    category: 'blog',
    suggestedFiles: ['*.html', '*.md', '*.mdx', 'blog-*.jpg', 'post-*.png'],
    options: {
      includeBundle: true,
      includeDOM: true,
      includeCSS: true,
      includeAssets: true,
      includeJS: false,
      includeReact: false,
      includeWebVitals: true,
      includeNetwork: true,
      includeImages: true,
      includeFonts: true,
      includeAccessibility: true,
      includeSEO: true,
      includeTypeScript: false,
      includeSecurity: false,
      includeThirdParty: false,
      includeMemory: false,
      includeBundleDiff: false,
      includeImports: false,
    },
    budget: {
      bundleSize: 100 * 1024, // 100KB
      imageSize: 500 * 1024, // 500KB
      cssSize: 30 * 1024, // 30KB
      jsSize: 50 * 1024, // 50KB
      domNodes: 800,
      maxDepth: 15,
      unusedCSS: 20,
      overallScore: 90,
    },
    weights: {
      bundle: 10,
      dom: 10,
      css: 15,
      assets: 20,
      javascript: 5,
      webVitals: 15,
      accessibility: 15,
      seo: 10,
    },
    priorityRecommendations: [
      'Optimize featured images',
      'Ensure semantic HTML structure',
      'Add Open Graph meta tags',
      'Implement reading time estimation',
    ],
    isBuiltIn: true,
  },
  {
    id: 'dashboard',
    name: 'Enterprise Dashboard',
    description: 'Data-heavy applications with TypeScript strictness, security requirements, and memory management focus.',
    icon: 'LayoutDashboard',
    color: '#8b5cf6', // Purple
    category: 'dashboard',
    suggestedFiles: ['*.tsx', '*.ts', 'dashboard-*.tsx', 'chart-*.tsx', 'data-*.ts'],
    options: {
      includeBundle: true,
      includeDOM: true,
      includeCSS: true,
      includeAssets: true,
      includeJS: true,
      includeReact: true,
      includeWebVitals: true,
      includeNetwork: true,
      includeImages: false,
      includeFonts: true,
      includeAccessibility: true,
      includeSEO: false,
      includeTypeScript: true,
      includeSecurity: true,
      includeThirdParty: true,
      includeMemory: true,
      includeBundleDiff: true,
      includeImports: true,
    },
    budget: {
      bundleSize: 800 * 1024, // 800KB (larger for data viz)
      imageSize: 500 * 1024, // 500KB
      cssSize: 100 * 1024, // 100KB
      jsSize: 600 * 1024, // 600KB
      domNodes: 3000,
      maxDepth: 30,
      unusedCSS: 50,
      overallScore: 80,
    },
    weights: {
      bundle: 20,
      dom: 15,
      css: 10,
      assets: 5,
      javascript: 20,
      webVitals: 10,
      accessibility: 10,
      seo: 0,
    },
    priorityRecommendations: [
      'Enable TypeScript strict mode',
      'Implement data virtualization for large tables',
      'Add memory leak detection',
      'Secure sensitive data handling',
    ],
    isBuiltIn: true,
  },
  {
    id: 'landing',
    name: 'Marketing Landing Page',
    description: 'Conversion-focused pages with Web Vitals priority, third-party script management, and performance budgets.',
    icon: 'Megaphone',
    color: '#ec4899', // Pink
    category: 'landing',
    suggestedFiles: ['index.html', 'landing-*.css', 'hero-*.jpg', 'cta-*.js'],
    options: {
      includeBundle: true,
      includeDOM: true,
      includeCSS: true,
      includeAssets: true,
      includeJS: true,
      includeReact: false,
      includeWebVitals: true,
      includeNetwork: true,
      includeImages: true,
      includeFonts: true,
      includeAccessibility: true,
      includeSEO: true,
      includeTypeScript: false,
      includeSecurity: false,
      includeThirdParty: true,
      includeMemory: false,
      includeBundleDiff: false,
      includeImports: false,
    },
    budget: {
      bundleSize: 200 * 1024, // 200KB - very strict
      imageSize: 1 * 1024 * 1024, // 1MB
      cssSize: 50 * 1024, // 50KB
      jsSize: 100 * 1024, // 100KB
      domNodes: 1000,
      maxDepth: 12,
      unusedCSS: 25,
      overallScore: 95, // Very high expectations
    },
    weights: {
      bundle: 20,
      dom: 15,
      css: 15,
      assets: 15,
      javascript: 10,
      webVitals: 20,
      accessibility: 3,
      seo: 2,
    },
    priorityRecommendations: [
      'Optimize LCP (Largest Contentful Paint)',
      'Minimize third-party scripts',
      'Implement hero image optimization',
      'Ensure fast Time to Interactive',
    ],
    isBuiltIn: true,
  },
  {
    id: 'library',
    name: 'Open Source Library',
    description: 'For npm packages with focus on bundle size, tree-shaking, and TypeScript quality.',
    icon: 'Package',
    color: '#eab308', // Yellow
    category: 'library',
    suggestedFiles: ['index.ts', 'index.js', 'package.json', 'rollup.config.*', 'tsup.config.*'],
    options: {
      includeBundle: true,
      includeDOM: false,
      includeCSS: false,
      includeAssets: false,
      includeJS: true,
      includeReact: false,
      includeWebVitals: false,
      includeNetwork: false,
      includeImages: false,
      includeFonts: false,
      includeAccessibility: false,
      includeSEO: false,
      includeTypeScript: true,
      includeSecurity: true,
      includeThirdParty: true,
      includeMemory: false,
      includeBundleDiff: true,
      includeImports: true,
    },
    budget: {
      bundleSize: 50 * 1024, // 50KB - very small
      imageSize: 0,
      cssSize: 0,
      jsSize: 50 * 1024, // 50KB
      domNodes: 0,
      maxDepth: 0,
      unusedCSS: 0,
      overallScore: 95,
    },
    weights: {
      bundle: 40,
      dom: 0,
      css: 0,
      assets: 0,
      javascript: 30,
      webVitals: 0,
      accessibility: 0,
      seo: 0,
    },
    priorityRecommendations: [
      'Ensure proper ESM/CJS dual package',
      'Verify tree-shaking compatibility',
      'Minimize peer dependencies',
      'Add TypeScript declaration files',
    ],
    isBuiltIn: true,
  },
];

/**
 * Default template - balanced analysis for any project
 */
export const DEFAULT_TEMPLATE: ReportTemplate = {
  id: 'default',
  name: 'Default Analysis',
  description: 'Balanced analysis suitable for most projects.',
  icon: 'Settings',
  color: '#6b7280', // Gray
  category: 'custom',
  suggestedFiles: [],
  options: {
    includeBundle: true,
    includeDOM: true,
    includeCSS: true,
    includeAssets: true,
    includeJS: true,
    includeReact: true,
    includeWebVitals: true,
    includeNetwork: true,
    includeImages: true,
    includeFonts: true,
    includeAccessibility: true,
    includeSEO: true,
    includeTypeScript: true,
    includeSecurity: true,
    includeThirdParty: true,
    includeMemory: true,
    includeBundleDiff: true,
    includeImports: true,
  },
  isBuiltIn: true,
};

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ReportTemplate | undefined {
  if (id === 'default') return DEFAULT_TEMPLATE;
  return BUILTIN_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all built-in templates
 */
export function getAllTemplates(): ReportTemplate[] {
  return [DEFAULT_TEMPLATE, ...BUILTIN_TEMPLATES];
}
