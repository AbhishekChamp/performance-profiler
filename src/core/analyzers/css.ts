import type { CSSAnalysis, CSSFile, CSSRule, CSSWarning } from '@/types';

function parseCSSContent(content: string): { rules: CSSRule[]; importantCount: number } {
  const rules: CSSRule[] = [];
  let importantCount = 0;

  try {
    // Simple regex-based parsing - works reliably in browser
    const ruleRegex = /([^{]+)\{([^}]*)\}/g;
    const declRegex = /([^:]+):\s*([^;]+);?/g;
    
    let match;
    while ((match = ruleRegex.exec(content)) !== null) {
      const selector = match[1].trim();
      const declarationsBlock = match[2];
      const declarations: string[] = [];
      
      let declMatch;
      while ((declMatch = declRegex.exec(declarationsBlock)) !== null) {
        const prop = declMatch[1].trim();
        const value = declMatch[2].trim();
        declarations.push(`${prop}: ${value}`);
        if (value.includes('!important')) {
          importantCount++;
        }
      }
      
      // Split combined selectors
      const selectors = selector.split(',').map(s => s.trim()).filter(s => s);
      for (const sel of selectors) {
        rules.push({
          selector: sel,
          declarations: [...declarations],
          used: false,
        });
      }
    }
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
      if (className !== undefined && className !== '' && htmlContent.includes(className)) {
        return { ...rule, used: true };
      }
    }
    
    // Check for id
    if (cleanSelector.includes('#')) {
      const id = cleanSelector.match(/#([\w-]+)/)?.[1];
      if (id !== undefined && id !== '' && htmlContent.includes(`id="${id}"`)) {
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
  if (cssFiles.length === 0 && htmlContent == null) return undefined;

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
  if (htmlContent !== undefined && htmlContent !== '') {
    const inlineStyleRegex = /style="[^"]*"/g;
    const matches = htmlContent.match(inlineStyleRegex);
    inlineStyleCount = matches !== null ? matches.length : 0;
  }

  // Mark used/unused selectors
  const processedRules = (htmlContent !== undefined && htmlContent !== '')
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
