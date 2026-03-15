import type { PlaygroundAnalysis, PlaygroundFile, PlaygroundIssue, PlaygroundLanguage } from '@/types/playground';

interface AnalysisResult {
  issues: PlaygroundIssue[];
  score: number;
  metrics: {
    bundleSize: number;
    complexity: number;
    efficiency: number;
    accessibility: number;
  };
}

// HTML Analysis
function analyzeHTML(content: string): AnalysisResult {
  const issues: PlaygroundIssue[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index): void => {
    // Check for images without lazy loading
    if (line.includes('<img') && !line.includes('loading=')) {
      issues.push({
        id: `html-img-lazy-${index}`,
        line: index + 1,
        column: line.indexOf('<img') + 1,
        severity: 'warning',
        message: 'Image missing lazy loading attribute',
        rule: 'img-lazy-loading',
        fixable: true,
        explanation: 'Adding loading="lazy" defers off-screen images, improving initial page load.',
        mdnUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading',
      });
    }
    
    // Check for images without alt text
    if (line.includes('<img') && !line.includes('alt=')) {
      issues.push({
        id: `html-img-alt-${index}`,
        line: index + 1,
        column: line.indexOf('<img') + 1,
        severity: 'error',
        message: 'Image missing alt attribute',
        rule: 'img-alt',
        fixable: true,
        explanation: 'Alt text improves accessibility and SEO.',
        mdnUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#alt',
      });
    }
    
    // Check for missing viewport meta
    if (line.includes('<meta') && line.includes('viewport')) {
      // Good, has viewport
    }
    
    // Check for render-blocking resources
    if (line.includes('<link') && line.includes('stylesheet') && !line.includes('media=')) {
      issues.push({
        id: `html-css-block-${index}`,
        line: index + 1,
        column: line.indexOf('<link') + 1,
        severity: 'warning',
        message: 'Render-blocking stylesheet',
        rule: 'render-blocking-css',
        fixable: true,
        explanation: 'Consider adding media queries or preloading critical CSS.',
      });
    }
    
    // Check for script without async/defer
    if (line.includes('<script') && line.includes('src=') && 
        !line.includes('async') && !line.includes('defer') && 
        !line.includes('type="module"')) {
      issues.push({
        id: `html-script-block-${index}`,
        line: index + 1,
        column: line.indexOf('<script') + 1,
        severity: 'warning',
        message: 'Render-blocking script',
        rule: 'render-blocking-script',
        fixable: true,
        explanation: 'Add async or defer to prevent blocking HTML parsing.',
        mdnUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#async',
      });
    }
  });
  
  // Check for viewport meta in entire document
  if (!content.includes('viewport')) {
    issues.push({
      id: 'html-viewport',
      line: 1,
      column: 1,
      severity: 'error',
      message: 'Missing viewport meta tag',
      rule: 'viewport-meta',
      fixable: true,
      explanation: 'Viewport meta tag is essential for responsive design.',
      mdnUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag',
    });
  }
  
  const score = Math.max(0, 100 - issues.length * 10);
  
  return {
    issues,
    score,
    metrics: {
      bundleSize: content.length,
      complexity: issues.filter(i => i.severity === 'error').length,
      efficiency: 100 - issues.filter(i => i.rule.includes('lazy') || i.rule.includes('async')).length * 20,
      accessibility: 100 - issues.filter(i => i.rule === 'img-alt').length * 25,
    },
  };
}

// CSS Analysis
function analyzeCSS(content: string): AnalysisResult {
  const issues: PlaygroundIssue[] = [];
  const lines = content.split('\n');
  
  // Track selectors to find unused ones (simplified)
  // const selectors: string[] = [];
  
  lines.forEach((line, index): void => {
    // Check for unused CSS (heuristic: if it looks like a demo)
    if (line.includes('.unused') || line.includes('.test') || line.includes('.demo')) {
      const match = line.match(/\.([a-zA-Z-_]+)/);
      if (match) {
        issues.push({
          id: `css-unused-${index}`,
          line: index + 1,
          column: line.indexOf('.') + 1,
          severity: 'warning',
          message: `Potentially unused selector: ${match[0]}`,
          rule: 'unused-css',
          fixable: false,
          explanation: 'This selector may not be used in your HTML. Consider removing it.',
        });
      }
    }
    
    // Check for large background images
    if (line.includes('background-image') && !line.includes('webp') && !line.includes('avif')) {
      issues.push({
        id: `css-bg-format-${index}`,
        line: index + 1,
        column: line.indexOf('background-image') + 1,
        severity: 'warning',
        message: 'Consider using modern image format (WebP/AVIF)',
        rule: 'modern-image-format',
        fixable: false,
        explanation: 'Modern formats offer better compression than JPEG/PNG.',
        mdnUrl: 'https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#webp_image',
      });
    }
    
    // Check for @import (render blocking)
    if (line.includes('@import')) {
      issues.push({
        id: `css-import-${index}`,
        line: index + 1,
        column: line.indexOf('@import') + 1,
        severity: 'warning',
        message: '@import is render-blocking',
        rule: 'css-import',
        fixable: true,
        explanation: 'Use <link> instead of @import to avoid blocking rendering.',
      });
    }
    
    // Check for !important
    if (line.includes('!important')) {
      issues.push({
        id: `css-important-${index}`,
        line: index + 1,
        column: line.indexOf('!important') + 1,
        severity: 'info',
        message: 'Avoid !important when possible',
        rule: 'no-important',
        fixable: false,
        explanation: '!important makes maintenance difficult. Use more specific selectors.',
      });
    }
    
    // Check for font-display
    if (line.includes('@font-face') && !content.includes('font-display')) {
      issues.push({
        id: `css-font-display-${index}`,
        line: index + 1,
        column: 1,
        severity: 'warning',
        message: 'Missing font-display in @font-face',
        rule: 'font-display',
        fixable: true,
        explanation: 'font-display: swap prevents invisible text during font loading.',
        mdnUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display',
      });
    }
  });
  
  const score = Math.max(0, 100 - issues.length * 8);
  
  return {
    issues,
    score,
    metrics: {
      bundleSize: content.length,
      complexity: issues.filter(i => i.severity === 'error').length,
      efficiency: 100 - issues.filter(i => i.rule === 'css-import' || i.rule === 'no-important').length * 15,
      accessibility: 100,
    },
  };
}

// JavaScript/TypeScript Analysis
function analyzeJavaScript(content: string, _lang: PlaygroundLanguage): AnalysisResult {  
  const issues: PlaygroundIssue[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index): void => {
    // Check for console.log
    if (line.includes('console.log') || line.includes('console.warn') || line.includes('console.error')) {
      issues.push({
        id: `js-console-${index}`,
        line: index + 1,
        column: line.indexOf('console') + 1,
        severity: 'warning',
        message: 'Console statement should be removed in production',
        rule: 'no-console',
        fixable: true,
        explanation: 'Console statements can impact performance and expose debug info.',
      });
    }
    
    // Check for unused imports (simplified heuristic)
    if (line.includes('import') && line.includes('from')) {
      const match = line.match(/import\s+(?:{([^}]+)}|(\w+))/);
      if (match) {
        const imported = (match[1] || match[2]).trim();
        // Check if imported item is used in rest of file
        const restOfFile = lines.slice(index + 1).join('\n');
        if (imported && !restOfFile.includes(imported.split(',')[0].trim())) {
          issues.push({
            id: `js-unused-import-${index}`,
            line: index + 1,
            column: line.indexOf('import') + 1,
            severity: 'warning',
            message: `Potentially unused import: ${imported}`,
            rule: 'unused-import',
            fixable: true,
            explanation: 'Removing unused imports reduces bundle size.',
          });
        }
      }
    }
    
    // Check for large dependencies
    if (line.includes('from \'lodash\'') || line.includes('from "lodash"')) {
      issues.push({
        id: `js-lodash-${index}`,
        line: index + 1,
        column: line.indexOf('lodash') + 1,
        severity: 'warning',
        message: 'Consider using lodash-es or specific lodash modules',
        rule: 'lodash-import',
        fixable: true,
        explanation: 'Importing the full lodash adds ~70KB to your bundle. Use lodash-es for tree-shaking.',
      });
    }
    
    // Check for inefficient DOM queries
    if (line.includes('querySelectorAll') && line.includes('forEach')) {
      issues.push({
        id: `js-dom-loop-${index}`,
        line: index + 1,
        column: line.indexOf('querySelectorAll') + 1,
        severity: 'info',
        message: 'Consider using event delegation',
        rule: 'dom-optimization',
        fixable: false,
        explanation: 'Attaching listeners to many elements is slow. Use event delegation instead.',
      });
    }
    
    // Check for var usage
    if (line.match(/\bvar\s+/)) {
      issues.push({
        id: `js-var-${index}`,
        line: index + 1,
        column: line.indexOf('var') + 1,
        severity: 'info',
        message: 'Use const or let instead of var',
        rule: 'no-var',
        fixable: true,
        explanation: 'const and let have block scope, preventing variable hoisting issues.',
        mdnUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const',
      });
    }
  });
  
  const score = Math.max(0, 100 - issues.length * 7);
  
  return {
    issues,
    score,
    metrics: {
      bundleSize: content.length,
      complexity: (content.match(/function|=>/g) ?? []).length,
      efficiency: 100 - issues.filter(i => i.rule === 'no-console' || i.rule === 'unused-import').length * 12,
      accessibility: 100,
    },
  };
}

// Main analyze function
export function analyzeFile(file: PlaygroundFile): AnalysisResult {
  switch (file.language) {
    case 'html':
      return analyzeHTML(file.modifiedContent);
    case 'css':
    case 'scss':
      return analyzeCSS(file.modifiedContent);
    case 'javascript':
    case 'typescript':
    case 'tsx':
      return analyzeJavaScript(file.modifiedContent, file.language);
    default:
      return { issues: [], score: 100, metrics: { bundleSize: 0, complexity: 0, efficiency: 100, accessibility: 100 } };
  }
}

// Calculate overall analysis
export function calculateAnalysis(files: PlaygroundFile[]): PlaygroundAnalysis {
  const results = files.map(analyzeFile);
  
  const totalIssues = results.reduce((sum, r): number => sum + r.issues.length, 0);
  // const totalFixed = files.reduce((sum, f) => 
  //   sum + f.issues.filter(i => !f.modifiedContent.includes(i.message.split(' ')[0])).length, 0
  // );
  
  const avgScore = results.length > 0 
    ? results.reduce((sum, r): number => sum + r.score, 0) / results.length 
    : 100;
  
  const originalScore = avgScore;
  const improvement = Math.min(20, totalIssues * 2); // Estimate improvement
  
  return {
    score: {
      before: Math.round(originalScore),
      after: Math.round(Math.min(100, originalScore + improvement)),
      improvement: Math.round(improvement),
    },
    metrics: {
      bundleSize: {
        before: results.reduce((sum, r): number => sum + r.metrics.bundleSize, 0),
        after: results.reduce((sum, r): number => sum + r.metrics.bundleSize * 0.9, 0), // Estimate 10% reduction
      },
      jsComplexity: {
        before: results.reduce((sum, r): number => sum + r.metrics.complexity, 0),
        after: results.reduce((sum, r): number => sum + Math.max(0, r.metrics.complexity - 2), 0),
      },
      cssEfficiency: {
        before: results.reduce((sum, r): number => sum + r.metrics.efficiency, 0) / (results.length > 0 ? results.length : 1),
        after: Math.min(100, results.reduce((sum, r): number => sum + r.metrics.efficiency, 0) / (results.length > 0 ? results.length : 1) + 10),
      },
      accessibility: {
        before: results.reduce((sum, r): number => sum + r.metrics.accessibility, 0) / (results.length > 0 ? results.length : 1),
        after: Math.min(100, results.reduce((sum, r): number => sum + r.metrics.accessibility, 0) / (results.length > 0 ? results.length : 1) + 15),
      },
    },
    issues: {
      total: totalIssues,
      fixed: Math.floor(totalIssues * 0.3), // Estimate
      remaining: Math.ceil(totalIssues * 0.7),
    },
  };
}

// Quick fix functions
export const QUICK_FIXES = {
  'img-lazy-loading': (code: string, line: number) => {
    const lines = code.split('\n');
    const targetLine = lines[line - 1];
    if (targetLine.includes('<img')) {
      lines[line - 1] = targetLine.replace('<img', '<img loading="lazy"');
    }
    return lines.join('\n');
  },
  
  'img-alt': (code: string, line: number) => {
    const lines = code.split('\n');
    const targetLine = lines[line - 1];
    if (targetLine.includes('<img')) {
      lines[line - 1] = targetLine.replace('<img', '<img alt="Description"');
    }
    return lines.join('\n');
  },
  
  'no-console': (code: string) => {
    return code.replace(/console\.(log|warn|error)\([^)]*\);?\s*\n?/g, '');
  },
  
  'unused-import': (code: string, line: number) => {
    const lines = code.split('\n');
    lines.splice(line - 1, 1);
    return lines.join('\n');
  },
  
  'no-var': (code: string) => {
    return code.replace(/\bvar\b/g, 'const');
  },
};

export function applyQuickFix(code: string, rule: string, line: number): string {
  const fix = QUICK_FIXES[rule as keyof typeof QUICK_FIXES];
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unnecessary-condition
  if (fix) {
    return fix(code, line);
  }
  return code;
}
