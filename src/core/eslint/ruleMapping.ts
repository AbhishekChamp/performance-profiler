/**
 * ESLint Rule Mapping
 * 
 * Maps detected code quality issues to specific ESLint rules
 * with priority scores and configuration options.
 */

export interface ESLintRule {
  name: string;
  rule: string;
  plugin?: string;
  priority: number; // 1-10, higher = more important
  category: 'error' | 'warning' | 'style';
  description: string;
  fixable: boolean;
  config: Record<string, unknown>;
}

export interface IssueToRuleMap {
  issueType: string;
  rules: ESLintRule[];
}

// Mapping of detected issues to ESLint rules
export const issueToRuleMapping: Record<string, IssueToRuleMap> = {
  'unused-variable': {
    issueType: 'Unused Variables',
    rules: [
      {
        name: 'no-unused-vars',
        rule: '@typescript-eslint/no-unused-vars',
        plugin: '@typescript-eslint',
        priority: 9,
        category: 'error',
        description: 'Disallow unused variables',
        fixable: false,
        config: {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      },
    ],
  },
  'console-statement': {
    issueType: 'Console Statements',
    rules: [
      {
        name: 'no-console',
        rule: 'no-console',
        priority: 6,
        category: 'warning',
        description: 'Disallow console statements in production code',
        fixable: false,
        config: {
          allow: ['warn', 'error'],
        },
      },
    ],
  },
  'missing-return-type': {
    issueType: 'Missing Return Types',
    rules: [
      {
        name: 'explicit-function-return-type',
        rule: '@typescript-eslint/explicit-function-return-type',
        plugin: '@typescript-eslint',
        priority: 7,
        category: 'warning',
        description: 'Require explicit return types on functions',
        fixable: false,
        config: {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      },
      {
        name: 'explicit-module-boundary-types',
        rule: '@typescript-eslint/explicit-module-boundary-types',
        plugin: '@typescript-eslint',
        priority: 8,
        category: 'error',
        description: 'Require explicit return and argument types on exported functions',
        fixable: false,
        config: {},
      },
    ],
  },
  'any-usage': {
    issueType: 'Any Type Usage',
    rules: [
      {
        name: 'no-explicit-any',
        rule: '@typescript-eslint/no-explicit-any',
        plugin: '@typescript-eslint',
        priority: 8,
        category: 'error',
        description: 'Disallow usage of the any type',
        fixable: false,
        config: {
          fixToUnknown: true,
          ignoreRestArgs: false,
        },
      },
    ],
  },
  'var-usage': {
    issueType: 'Var Keyword Usage',
    rules: [
      {
        name: 'no-var',
        rule: 'no-var',
        priority: 7,
        category: 'error',
        description: 'Require let or const instead of var',
        fixable: true,
        config: {},
      },
    ],
  },
  'implicit-any': {
    issueType: 'Implicit Any',
    rules: [
      {
        name: 'no-implicit-any-catch',
        rule: '@typescript-eslint/no-implicit-any-catch',
        plugin: '@typescript-eslint',
        priority: 6,
        category: 'warning',
        description: 'Disallow implicit any in catch clauses',
        fixable: true,
        config: {},
      },
    ],
  },
  'unused-imports': {
    issueType: 'Unused Imports',
    rules: [
      {
        name: 'no-unused-modules',
        rule: 'import/no-unused-modules',
        plugin: 'import',
        priority: 7,
        category: 'warning',
        description: 'Report unused ES2015 modules',
        fixable: false,
        config: {
          unusedExports: true,
          missingExports: true,
        },
      },
    ],
  },
  'complex-function': {
    issueType: 'Complex Functions',
    rules: [
      {
        name: 'cyclomatic-complexity',
        rule: 'complexity',
        priority: 6,
        category: 'warning',
        description: 'Enforce a maximum cyclomatic complexity',
        fixable: false,
        config: {
          max: 10,
        },
      },
      {
        name: 'max-lines-per-function',
        rule: 'max-lines-per-function',
        priority: 5,
        category: 'warning',
        description: 'Enforce a maximum function length',
        fixable: false,
        config: {
          max: 50,
          skipBlankLines: true,
          skipComments: true,
        },
      },
    ],
  },
  'nested-loops': {
    issueType: 'Nested Loops',
    rules: [
      {
        name: 'max-depth',
        rule: 'max-depth',
        priority: 5,
        category: 'warning',
        description: 'Enforce a maximum block depth',
        fixable: false,
        config: {
          max: 4,
        },
      },
    ],
  },
  'react-inline-function': {
    issueType: 'React Inline Functions',
    rules: [
      {
        name: 'jsx-no-bind',
        rule: 'react/jsx-no-bind',
        plugin: 'react',
        priority: 6,
        category: 'warning',
        description: 'Disallow .bind() or arrow functions in JSX props',
        fixable: false,
        config: {
          allowArrowFunctions: true,
          allowBind: false,
        },
      },
    ],
  },
  'react-missing-key': {
    issueType: 'Missing React Keys',
    rules: [
      {
        name: 'jsx-key',
        rule: 'react/jsx-key',
        plugin: 'react',
        priority: 10,
        category: 'error',
        description: 'Disallow missing key props in iterators',
        fixable: false,
        config: {
          checkFragmentShorthand: true,
        },
      },
    ],
  },
  'react-hooks-issues': {
    issueType: 'React Hooks Issues',
    rules: [
      {
        name: 'rules-of-hooks',
        rule: 'react-hooks/rules-of-hooks',
        plugin: 'react-hooks',
        priority: 10,
        category: 'error',
        description: 'Enforce Rules of Hooks',
        fixable: false,
        config: {},
      },
      {
        name: 'exhaustive-deps',
        rule: 'react-hooks/exhaustive-deps',
        plugin: 'react-hooks',
        priority: 9,
        category: 'warning',
        description: 'Verify dependencies of useEffect',
        fixable: true,
        config: {},
      },
    ],
  },
  'security-xss': {
    issueType: 'XSS Vulnerabilities',
    rules: [
      {
        name: 'no-danger',
        rule: 'react/no-danger',
        plugin: 'react',
        priority: 9,
        category: 'error',
        description: 'Prevent usage of dangerous JSX properties',
        fixable: false,
        config: {},
      },
    ],
  },
  'security-eval': {
    issueType: 'Eval Usage',
    rules: [
      {
        name: 'no-eval',
        rule: 'no-eval',
        priority: 10,
        category: 'error',
        description: 'Disallow eval()',
        fixable: false,
        config: {},
      },
    ],
  },
  'accessibility-issues': {
    issueType: 'Accessibility Issues',
    rules: [
      {
        name: 'alt-text',
        rule: 'jsx-a11y/alt-text',
        plugin: 'jsx-a11y',
        priority: 8,
        category: 'error',
        description: 'Enforce alt text on images',
        fixable: false,
        config: {},
      },
      {
        name: 'anchor-is-valid',
        rule: 'jsx-a11y/anchor-is-valid',
        plugin: 'jsx-a11y',
        priority: 8,
        category: 'error',
        description: 'Enforce valid anchor elements',
        fixable: false,
        config: {},
      },
    ],
  },
};

// Get all rules sorted by priority
export function getAllRules(): ESLintRule[] {
  const rules: ESLintRule[] = [];
  
  Object.values(issueToRuleMapping).forEach((mapping): void => {
    rules.push(...mapping.rules);
  });
  
  return rules.sort((a, b): number => b.priority - a.priority);
}

// Get rules for specific issue types
export function getRulesForIssues(issueTypes: string[]): ESLintRule[] {
  const rules: ESLintRule[] = [];
  const seenRules = new Set<string>();
  
  issueTypes.forEach((issueType): void => {
    const mapping = issueToRuleMapping[issueType];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (mapping != null) {
      mapping.rules.forEach((rule): void => {
        // Only add if we haven't seen this rule before
        if (!seenRules.has(rule.rule)) {
          seenRules.add(rule.rule);
          rules.push(rule);
        }
      });
    }
  });
  
  return rules.sort((a, b): number => b.priority - a.priority);
}

// Calculate estimated impact of rules
export function calculateEstimatedImpact(
  detectedIssues: Array<{ type: string; count: number }>
): { wouldCatch: number; totalIssues: number } {
  let wouldCatch = 0;
  let totalIssues = 0;
  
  detectedIssues.forEach((issue): void => {
    totalIssues += issue.count;
    const mapping = issueToRuleMapping[issue.type];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (mapping != null && mapping.rules.length > 0) {
      // Assume high priority rules catch ~80%, lower priority ~50%
      const avgPriority =
        mapping.rules.reduce((sum, r): number => sum + r.priority, 0) /
        mapping.rules.length;
      const catchRate = avgPriority >= 8 ? 0.8 : avgPriority >= 5 ? 0.5 : 0.3;
      wouldCatch += issue.count * catchRate;
    }
  });
  
  return { wouldCatch: Math.round(wouldCatch), totalIssues };
}
