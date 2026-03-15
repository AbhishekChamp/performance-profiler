import type { TSConfigCheck, TypeScriptAnalysis, TypeScriptIssue } from '@/types';

export function analyzeTypeScript(
  files: { name: string; content: string }[],
  tsConfigContent?: string
): TypeScriptAnalysis {
  const issues: TypeScriptIssue[] = [];
  const tsConfigChecks: TSConfigCheck[] = [];
  const recommendations: string[] = [];

  const tsFiles = files.filter(f => /\.(ts|tsx)$/.test(f.name));

  if (tsFiles.length === 0) {
    return {
      score: 0,
      strictMode: false,
      anyCount: 0,
      typeCoverage: 0,
      issues: [],
      tsConfigChecks: [],
      recommendations: ['No TypeScript files found'],
    };
  }

  let totalAnyCount = 0;
  let totalLines = 0;
  let typedLines = 0;

  // Analyze each TypeScript file
  for (const file of tsFiles) {
    const lines = file.content.split('\n');
    totalLines += lines.length;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Count :any usage (excluding comments)
      const codeOnly = line.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//, '');

      // Detect explicit any
      const anyMatches = codeOnly.match(/:\s*any\b/g);
      if (anyMatches) {
        totalAnyCount += anyMatches.length;
        issues.push({
          type: 'any-usage',
          file: file.name,
          line: lineNum,
          message: `Explicit 'any' type usage`,
          severity: 'warning',
        });
      }

      // Detect implicit any (function parameters without types in non-arrow functions)
      const functionMatch = codeOnly.match(/function\s+\w+\s*\(([^)]*)\)/);
      if (functionMatch) {
        const params = functionMatch[1];
        if (params && !params.includes(':') && !codeOnly.includes('/* implicit */')) {
          // This is a rough check - could be improved with AST parsing
          const hasNoTypeParams = params.split(',').some(p => !p.includes(':') && p.trim() !== '');
          if (hasNoTypeParams) {
            issues.push({
              type: 'implicit-any',
              file: file.name,
              line: lineNum,
              message: 'Function parameters may have implicit any type',
              severity: 'info',
            });
          }
        }
      }

      // Check for typed lines (has type annotations)
      if (codeOnly.match(/:\s*(string|number|boolean|Date|Array|Record|Promise|void|null|undefined|[A-Z]\w+)</) ||
          codeOnly.match(/:\s*\w+\[\]/)) {
        typedLines++;
      }

      // Detect complex types (very long type definitions)
      const typeMatch = codeOnly.match(/type\s+\w+\s*=\s*(.+)/);
      if (typeMatch && typeMatch[1].length > 200) {
        issues.push({
          type: 'complex-type',
          file: file.name,
          line: lineNum,
          message: 'Complex type definition (consider breaking into smaller types)',
          severity: 'info',
        });
      }

      // Detect missing return types on exported functions
      const exportedFunctionMatch = codeOnly.match(/export\s+(?:async\s+)?function\s+\w+\s*\([^)]*\)(?!\s*:)/);
      if (exportedFunctionMatch && !codeOnly.includes('=>')) {
        issues.push({
          type: 'missing-return-type',
          file: file.name,
          line: lineNum,
          message: 'Exported function missing explicit return type',
          severity: 'info',
        });
      }
    }
  }

  // Analyze tsconfig.json
  let strictMode = false;

  if (tsConfigContent !== undefined && tsConfigContent !== '') {
    try {
      const tsConfig = JSON.parse(tsConfigContent) as { compilerOptions?: Record<string, unknown> };
      const compilerOptions = tsConfig.compilerOptions ?? {};

      // Check strict mode and related options
      const strictChecks = [
        { option: 'strict', value: compilerOptions.strict as boolean | undefined },
        { option: 'noImplicitAny', value: compilerOptions.noImplicitAny },
        { option: 'strictNullChecks', value: compilerOptions.strictNullChecks },
        { option: 'noImplicitReturns', value: compilerOptions.noImplicitReturns },
        { option: 'noImplicitThis', value: compilerOptions.noImplicitThis },
        { option: 'strictFunctionTypes', value: compilerOptions.strictFunctionTypes },
        { option: 'strictPropertyInitialization', value: compilerOptions.strictPropertyInitialization },
        { option: 'noUncheckedIndexedAccess', value: compilerOptions.noUncheckedIndexedAccess },
      ];

      strictMode = compilerOptions.strict === true;

      for (const check of strictChecks) {
        tsConfigChecks.push({
          option: check.option,
          enabled: check.value === true,
          recommended: true,
          severity: check.option === 'strict' && check.value !== true ? 'error' :
                    check.option === 'noImplicitAny' && check.value !== true ? 'warning' : 'info',
        });
      }

      if (strictMode !== true) {
        recommendations.push('Enable "strict": true in tsconfig.json for better type safety');
      }

      if (compilerOptions.noImplicitAny !== true) {
        recommendations.push('Enable "noImplicitAny" to catch implicit any types');
      }

      if (compilerOptions.strictNullChecks !== true) {
        recommendations.push('Enable "strictNullChecks" for null/undefined safety');
      }
    } catch {
      // Invalid tsconfig
      recommendations.push('Could not parse tsconfig.json');
    }
  } else {
    recommendations.push('No tsconfig.json found - TypeScript configuration recommended');
  }

  // Calculate type coverage
  const typeCoverage = totalLines > 0 ? Math.round((typedLines / totalLines) * 100) : 0;

  // Additional recommendations based on analysis
  if (totalAnyCount > 10) {
    recommendations.push(`Replace ${totalAnyCount} instances of 'any' with specific types`);
  }

  if (typeCoverage < 50) {
    recommendations.push('Increase type coverage by adding more explicit type annotations');
  }

  // Detect unused types (simple heuristic - types defined but not used in same file)
  for (const file of tsFiles) {
    const typeDefinitions = file.content.match(/type\s+(\w+)\s*=/g) ?? [];

    for (const typeDef of typeDefinitions) {
      const typeName = typeDef.match(/type\s+(\w+)/)?.[1];
      if (typeName !== undefined && typeName !== '') {
        const usageRegex = new RegExp(`\\b${typeName}\\b`, 'g');
        const usages = (file.content.match(usageRegex) ?? []).length;
        if (usages <= 1) { // Only the definition
          issues.push({
            type: 'unused-type',
            file: file.name,
            line: 0,
            message: `Type '${typeName}' may be unused`,
            severity: 'info',
          });
        }
      }
    }
  }

  // Calculate score
  let score = 100;

  // Deduct for any usage
  score -= Math.min(30, totalAnyCount * 2);

  // Deduct for non-strict mode
  if (!strictMode) {
    score -= 20;
  }

  // Deduct for low type coverage
  if (typeCoverage < 30) {
    score -= 15;
  } else if (typeCoverage < 50) {
    score -= 10;
  } else if (typeCoverage < 70) {
    score -= 5;
  }

  // Deduct for issues
  score -= Math.min(20, issues.length);

  return {
    score: Math.max(0, Math.min(100, score)),
    strictMode,
    anyCount: totalAnyCount,
    typeCoverage,
    issues: issues.slice(0, 50), // Limit issues to prevent overwhelming UI
    tsConfigChecks,
    recommendations: [...new Set(recommendations)],
  };
}
