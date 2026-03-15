/**
 * ESLint Configuration Generator
 * 
 * Generates custom ESLint configurations based on detected code quality issues.
 */

import { type ESLintRule, calculateEstimatedImpact, getRulesForIssues, issueToRuleMapping } from './ruleMapping';
import { type PresetType, combinePresets, presets } from './presets';
import type { JSFileAnalysis, JSWarning, TypeScriptAnalysis } from '@/types';

export type ConfigFormat = 'json' | 'js' | 'flat';

export interface ESLintConfig {
  extends?: string[];
  plugins?: string[];
  parser?: string;
  parserOptions?: Record<string, unknown>;
  env?: Record<string, boolean>;
  settings?: Record<string, unknown>;
  rules?: Record<string, unknown>;
  ignorePatterns?: string[];
  overrides?: Array<{
    files?: string[];
    rules?: Record<string, unknown>;
  }>;
}

export interface GeneratedConfig {
  config: ESLintConfig;
  format: ConfigFormat;
  content: string;
  plugins: string[];
  estimatedImpact: {
    wouldCatch: number;
    totalIssues: number;
  };
  rules: ESLintRule[];
}

export interface ConfigGenerationOptions {
  format?: ConfigFormat;
  presets?: PresetType[];
  detectedIssues?: Array<{ type: string; count: number }>;
  projectType?: 'react' | 'node' | 'vanilla';
  strictness?: 'strict' | 'moderate' | 'lenient';
}

/**
 * Generate ESLint configuration based on analysis results
 */
export function generateESLintConfig(
  typescriptAnalysis?: TypeScriptAnalysis,
  javascriptAnalysis?: JSFileAnalysis[],
  _reactAnalysis?: unknown,
  options: ConfigGenerationOptions = {}
): GeneratedConfig {
  const {
    format = 'json',
    presets: selectedPresets = ['recommended'],
    projectType = 'vanilla',
    strictness = 'moderate',
  } = options;

  // Collect detected issues
  const detectedIssues: Array<{ type: string; count: number }> = [];

  if (typescriptAnalysis) {
    if (typescriptAnalysis.anyCount > 0) {
      detectedIssues.push({ type: 'any-usage', count: typescriptAnalysis.anyCount });
    }
    if (typescriptAnalysis.strictMode === false) {
      detectedIssues.push({ type: 'implicit-any', count: 1 });
    }
  }

  if (javascriptAnalysis !== undefined) {
    javascriptAnalysis.forEach((file: JSFileAnalysis) => {
      const complexFunctions = file.warnings.filter((w: JSWarning): boolean => w.type === 'high-complexity').length;
      if (complexFunctions > 0) {
        detectedIssues.push({ type: 'complex-function', count: complexFunctions });
      }
      const largeFunctions = file.warnings.filter((w: JSWarning): boolean => w.type === 'large-function').length;
      if (largeFunctions > 0) {
        detectedIssues.push({ type: 'large-function', count: largeFunctions });
      }
    });
  }

  // Combine presets
  const config: ESLintConfig = combinePresets(selectedPresets);

  // Add project-specific configurations
  if (projectType === 'react') {
    config.extends = [
      ...(config.extends ?? []),
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
    ];
    config.plugins = [...(config.plugins ?? []), 'react', 'react-hooks'];
    config.settings = {
      ...config.settings,
      react: { version: 'detect' },
    };
  }

  // Add rules based on detected issues
  const relevantRules = getRulesForIssues(detectedIssues.map((i) => i.type));
  
  relevantRules.forEach((rule): void => {
    config.rules ??= {};
    
    // Adjust rule severity based on strictness
    let severity: string = rule.category === 'error' ? 'error' : 'warn';
    if (strictness === 'lenient' && severity === 'error') {
      severity = 'warn';
    } else if (strictness === 'strict' && severity === 'warn') {
      severity = 'error';
    }
    
    config.rules[rule.rule] = Object.keys(rule.config).length > 0 
      ? [severity, rule.config] 
      : severity;
  });

  // Add base parser settings
  config.parser = '@typescript-eslint/parser';
  config.parserOptions = {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: projectType === 'react',
    },
  };
  config.env = {
    browser: true,
    es2022: true,
    node: true,
  };

  // Calculate estimated impact
  const estimatedImpact = calculateEstimatedImpact(detectedIssues);

  // Generate config content based on format
  const content = formatConfig(config, format);

  // Get unique plugins
  const plugins = [...new Set([...(config.plugins ?? []), ...relevantRules.map((r): string | undefined => r.plugin).filter((p): p is string => Boolean(p))])];

  return {
    config,
    format,
    content,
    plugins,
    estimatedImpact,
    rules: relevantRules,
  };
}

/**
 * Format ESLint config for different output formats
 */
function formatConfig(config: ESLintConfig, format: ConfigFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(config, null, 2);
    case 'js':
      return formatAsJS(config);
    case 'flat':
      return formatAsFlat(config);
    default:
      return JSON.stringify(config, null, 2);
  }
}

function formatAsJS(config: ESLintConfig): string {
  const lines = ['module.exports = {'];

  if (config.extends !== undefined && config.extends.length > 0) {
    lines.push(`  extends: ${JSON.stringify(config.extends)},`);
  }
  if (config.plugins !== undefined && config.plugins.length > 0) {
    lines.push(`  plugins: ${JSON.stringify(config.plugins)},`);
  }
  if (config.parser !== undefined) {
    lines.push(`  parser: '${config.parser}',`);
  }
  if (config.parserOptions) {
    lines.push(`  parserOptions: ${JSON.stringify(config.parserOptions, null, 2).replace(/\n/g, '\n  ')},`);
  }
  if (config.env) {
    lines.push(`  env: ${JSON.stringify(config.env)},`);
  }
  if (config.settings) {
    lines.push(`  settings: ${JSON.stringify(config.settings, null, 2).replace(/\n/g, '\n  ')},`);
  }
  if (config.rules !== undefined) {
    lines.push(`  rules: {`);
    Object.entries(config.rules).forEach(([key, value]): void => {
      lines.push(`    '${key}': ${JSON.stringify(value)},`);
    });
    lines.push(`  },`);
  }
  if (config.ignorePatterns !== undefined && config.ignorePatterns.length > 0) {
    lines.push(`  ignorePatterns: ${JSON.stringify(config.ignorePatterns)},`);
  }

  lines.push('};');
  return lines.join('\n');
}

function formatAsFlat(config: ESLintConfig): string {
  const lines = [
    "import js from '@eslint/js';",
    "import tseslint from 'typescript-eslint';",
  ];

  if ((config.plugins?.includes('react')) ?? false) {
    lines.push("import react from 'eslint-plugin-react';");
    lines.push("import reactHooks from 'eslint-plugin-react-hooks';");
  }

  lines.push('');
  lines.push('export default [');
  lines.push("  js.configs.recommended,");
  lines.push("  ...tseslint.configs.recommended,");

  if ((config.plugins?.includes('react')) ?? false) {
    lines.push("  react.configs.flat.recommended,");
    lines.push("  reactHooks.configs['recommended-latest'],");
  }

  lines.push('  {');
  lines.push("    files: ['**/*.{ts,tsx}'],");
  
  if (config.rules !== undefined && Object.keys(config.rules).length > 0) {
    lines.push('    rules: {');
    Object.entries(config.rules).forEach(([key, value]): void => {
      lines.push(`      '${key}': ${JSON.stringify(value)},`);
    });
    lines.push('    },');
  }

  lines.push('  },');
  lines.push('];');

  return lines.join('\n');
}

/**
 * Generate installation commands for required plugins
 */
export function generateInstallCommands(plugins: string[]): string {
  const npmPackages: string[] = ['eslint'];

  plugins.forEach((plugin): void => {
    switch (plugin) {
      case '@typescript-eslint':
        npmPackages.push('@typescript-eslint/eslint-plugin', '@typescript-eslint/parser');
        break;
      case 'react':
        npmPackages.push('eslint-plugin-react');
        break;
      case 'react-hooks':
        npmPackages.push('eslint-plugin-react-hooks');
        break;
      case 'import':
        npmPackages.push('eslint-plugin-import');
        break;
      case 'jsx-a11y':
        npmPackages.push('eslint-plugin-jsx-a11y');
        break;
      case 'security':
        npmPackages.push('eslint-plugin-security');
        break;
    }
  });

  const uniquePackages = [...new Set(npmPackages)];
  
  return `# Using npm\nnpm install --save-dev ${uniquePackages.join(' ')}\n\n# Using yarn\nyarn add --dev ${uniquePackages.join(' ')}\n\n# Using pnpm\npnpm add --save-dev ${uniquePackages.join(' ')}`;
}

/**
 * Validate ESLint configuration
 */
export function validateConfig(config: ESLintConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if ((config.extends === undefined || config.extends.length === 0) && 
      (config.rules === undefined || Object.keys(config.rules).length === 0)) {
    errors.push('Config must have either extends or rules');
  }

  if (config.rules !== undefined) {
    Object.entries(config.rules).forEach(([rule, value]): void => {
      const validSeverities = ['off', 'warn', 'error', 0, 1, 2];
      const severity = Array.isArray(value) ? value[0] : value;
      
      if (!validSeverities.includes(severity as string | number)) {
        errors.push(`Invalid severity for rule "${rule}": ${severity}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export { issueToRuleMapping, getRulesForIssues, calculateEstimatedImpact, presets, combinePresets };
export type { ESLintRule };
