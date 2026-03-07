import postcss from 'postcss';
import type { CSSAnalysis, CSSRule, CSSFile, CSSWarning } from '@/types';

function parseCSSContent(content: string): { rules: CSSRule[]; importantCount: number } {
  const rules: CSSRule[] = [];
  let importantCount = 0;

  try {
    const root = postcss.parse(content);
    
    root.walkRules((rule) => {
      const selectors = rule.selector.split(',').map(s => s.trim());
      const declarations: string[] = [];
      
      rule.walkDecls((decl) => {
        declarations.push(`${decl.prop}: ${decl.value}`);
        if (decl.important) {
          importantCount++;
        }
      });

      for (const selector of selectors) {
        rules.push({
          selector,
          declarations: [...declarations],
          used: false, // Would need to cross-reference with HTML
        });
      }
    });
  } catch (error) {
    console.error('CSS parsing error:', error);
  }

  return { rules, importantCount };
}

function detectUnusedSelectors(cssRules: CSSRule[], htmlContent: string): CSSRule[] {
  // Simple heuristic: check if class or id appears in HTML
  return cssRules.map(rule => {
    const selector = rule.selector;
    
    // Skip pseudo-classes and pseudo-elements for matching
    const cleanSelector = selector.replace(/::?[\w-]+/g, '');
    
    // Check for class
    if (cleanSelector.includes('.')) {
      const className = cleanSelector.match(/\.([\w-]+)/)?.[1];
      if (className && htmlContent.includes(className)) {
        return { ...rule, used: true };
      }
    }
    
    // Check for id
    if (cleanSelector.includes('#')) {
      const id = cleanSelector.match(/#([\w-]+)/)?.[1];
      if (id && htmlContent.includes(`id="${id}"`)) {
        return { ...rule, used: true };
      }
    }
    
    // Check for element
    if (/^[a-z]+$/i.test(cleanSelector)) {
      const tag = cleanSelector.toLowerCase();
      if (htmlContent.includes(`<${tag}`)) {
        return { ...rule, used: true };
      }
    }

    return rule;
  });
}

export function analyzeCSS(
  cssFiles: { name: string; content: string; size: number }[],
  htmlContent?: string
): CSSAnalysis | undefined {
  if (cssFiles.length === 0) return undefined;

  const allRules: CSSRule[] = [];
  const fileAnalyses: CSSFile[] = [];
  let totalImportantCount = 0;
  let inlineStyleCount = 0;

  for (const file of cssFiles) {
    const { rules, importantCount } = parseCSSContent(file.content);
    
    fileAnalyses.push({
      path: file.name,
      size: file.size,
      ruleCount: rules.length,
    });

    allRules.push(...rules.map(r => ({ ...r, file: file.name })));
    totalImportantCount += importantCount;
  }

  // Detect inline styles from HTML
  if (htmlContent) {
    const inlineStyleRegex = /style="[^"]*"/g;
    const matches = htmlContent.match(inlineStyleRegex);
    inlineStyleCount = matches ? matches.length : 0;
  }

  // Mark used/unused selectors
  const processedRules = htmlContent 
    ? detectUnusedSelectors(allRules, htmlContent)
    : allRules;

  const unusedRules = processedRules.filter(r => !r.used);
  const largeFiles = fileAnalyses.filter(f => f.size > 100 * 1024); // > 100KB

  // Generate warnings
  const warnings: CSSWarning[] = [];

  if (unusedRules.length > 0) {
    const unusedPercentage = (unusedRules.length / processedRules.length) * 100;
    if (unusedPercentage > 30) {
      warnings.push({
        type: 'unused-selector',
        message: `${unusedRules.length} unused CSS selectors (${unusedPercentage.toFixed(1)}%)`,
        severity: 'warning',
      });
    }
  }

  if (inlineStyleCount > 10) {
    warnings.push({
      type: 'inline-style',
      message: `${inlineStyleCount} inline styles detected`,
      severity: 'info',
    });
  }

  if (totalImportantCount > 20) {
    warnings.push({
      type: 'exclamation-important',
      message: `${totalImportantCount} !important declarations may indicate specificity issues`,
      severity: 'warning',
    });
  }

  for (const file of largeFiles) {
    warnings.push({
      type: 'large-file',
      message: `Large CSS file: ${file.path} (${(file.size / 1024).toFixed(1)} KB)`,
      severity: 'info',
    });
  }

  return {
    totalRules: processedRules.length,
    unusedRules: unusedRules.length,
    inlineStyles: inlineStyleCount,
    importantCount: totalImportantCount,
    largeFiles,
    unusedSelectors: unusedRules.slice(0, 20).map(r => r.selector),
    rules: processedRules,
    warnings,
  };
}
