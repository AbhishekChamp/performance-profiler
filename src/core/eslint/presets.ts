/**
 * ESLint Configuration Presets
 * 
 * Pre-configured ESLint setups for different project types
 */

import type { ESLintConfig } from './index';

export type PresetType = 'strict-typescript' | 'react-optimized' | 'performance' | 'accessibility' | 'security' | 'recommended';
export type { PresetType as ESLintPresetType };

export interface Preset {
  name: string;
  description: string;
  type: PresetType;
  config: Partial<ESLintConfig>;
  recommendedFor: string[];
}

export const presets: Record<PresetType, Preset> = {
  'strict-typescript': {
    name: 'Strict TypeScript',
    description: 'Maximum type safety with all TypeScript rules enabled',
    type: 'strict-typescript',
    recommendedFor: ['Enterprise applications', 'Libraries', 'Critical systems'],
    config: {
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:@typescript-eslint/strict',
      ],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-implied-eval': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/strict-boolean-expressions': 'error',
      },
    },
  },
  'react-optimized': {
    name: 'React Optimized',
    description: 'Best practices for React applications with Hooks support',
    type: 'react-optimized',
    recommendedFor: ['React applications', 'Next.js projects', 'Single Page Apps'],
    config: {
      parser: '@typescript-eslint/parser',
      plugins: ['react', 'react-hooks', '@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/jsx-runtime',
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/jsx-no-target-blank': 'error',
        'react/no-danger': 'error',
        'react/no-deprecated': 'error',
        'react/no-direct-mutation-state': 'error',
        'react/no-find-dom-node': 'error',
        'react/no-is-mounted': 'error',
        'react/no-render-return-value': 'error',
        'react/no-string-refs': 'error',
        'react/no-unescaped-entities': 'error',
        'react/no-unknown-property': 'error',
        'react/no-unused-prop-types': 'warn',
        'react/no-will-update-set-state': 'error',
        'react/require-render-return': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
      },
    },
  },
  'performance': {
    name: 'Performance',
    description: 'Rules focused on bundle size and runtime performance',
    type: 'performance',
    recommendedFor: ['Large applications', 'E-commerce sites', 'Mobile web'],
    config: {
      parser: '@typescript-eslint/parser',
      plugins: ['import', 'react', '@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:import/recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'lodash',
                message: 'Import specific lodash methods instead of the entire library: import method from "lodash/method"',
              },
              {
                name: 'moment',
                message: 'Consider using date-fns or dayjs for smaller bundle size',
              },
            ],
            patterns: [
              {
                group: ['../../*'],
                message: 'Avoid deep relative imports, use path aliases',
              },
            ],
          },
        ],
        'import/no-duplicates': 'error',
        'import/no-cycle': 'error',
        'import/no-self-import': 'error',
        'import/no-useless-path-segments': 'error',
        'import/no-mutable-exports': 'error',
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/order': [
          'error',
          {
            groups: [
              'builtin',
              'external',
              'internal',
              'parent',
              'sibling',
              'index',
            ],
            'newlines-between': 'always',
            alphabetize: {
              order: 'asc',
              caseInsensitive: true,
            },
          },
        ],
        'react/jsx-no-bind': [
          'warn',
          {
            ignoreDOMComponents: true,
            ignoreRefs: true,
            allowArrowFunctions: true,
            allowFunctions: false,
            allowBind: false,
          },
        ],
      },
    },
  },
  'accessibility': {
    name: 'Accessibility',
    description: 'WCAG compliance and accessibility best practices',
    type: 'accessibility',
    recommendedFor: ['Public websites', 'Government sites', 'Enterprise apps'],
    config: {
      parser: '@typescript-eslint/parser',
      plugins: ['jsx-a11y', '@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:jsx-a11y/strict',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/anchor-has-content': 'error',
        'jsx-a11y/anchor-is-valid': 'error',
        'jsx-a11y/aria-props': 'error',
        'jsx-a11y/aria-proptypes': 'error',
        'jsx-a11y/aria-role': 'error',
        'jsx-a11y/aria-unsupported-elements': 'error',
        'jsx-a11y/click-events-have-key-events': 'error',
        'jsx-a11y/heading-has-content': 'error',
        'jsx-a11y/html-has-lang': 'error',
        'jsx-a11y/iframe-has-title': 'error',
        'jsx-a11y/img-redundant-alt': 'error',
        'jsx-a11y/interactive-supports-focus': 'error',
        'jsx-a11y/label-has-associated-control': 'error',
        'jsx-a11y/media-has-caption': 'error',
        'jsx-a11y/mouse-events-have-key-events': 'error',
        'jsx-a11y/no-access-key': 'error',
        'jsx-a11y/no-autofocus': 'warn',
        'jsx-a11y/no-distracting-elements': 'error',
        'jsx-a11y/no-redundant-roles': 'error',
        'jsx-a11y/prefer-tag-over-role': 'warn',
      },
    },
  },
  'security': {
    name: 'Security',
    description: 'Security-focused rules to prevent common vulnerabilities',
    type: 'security',
    recommendedFor: ['All applications', 'User-facing apps', 'E-commerce'],
    config: {
      parser: '@typescript-eslint/parser',
      plugins: ['security', '@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:security/recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'security/detect-buffer-noassert': 'error',
        'security/detect-child-process': 'error',
        'security/detect-disable-mustache-escape': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-new-buffer': 'error',
        'security/detect-no-csrf-before-method-override': 'error',
        'security/detect-non-literal-fs-filename': 'warn',
        'security/detect-non-literal-regexp': 'error',
        'security/detect-non-literal-require': 'warn',
        'security/detect-object-injection': 'error',
        'security/detect-possible-timing-attacks': 'error',
        'security/detect-pseudoRandomBytes': 'error',
        'security/detect-unsafe-regex': 'error',
      },
    },
  },
  'recommended': {
    name: 'Recommended',
    description: 'Balanced set of rules for general use',
    type: 'recommended',
    recommendedFor: ['New projects', 'Teams getting started with ESLint'],
    config: {
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-debugger': 'error',
        'no-alert': 'warn',
        'no-var': 'error',
        'prefer-const': 'error',
        'prefer-arrow-callback': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
      },
    },
  },
};

export function getPreset(type: PresetType): Preset {
  return presets[type];
}

export function getAllPresets(): Preset[] {
  return Object.values(presets);
}

export function combinePresets(types: PresetType[]): Partial<ESLintConfig> {
  const combined: Partial<ESLintConfig> = {
    extends: [],
    plugins: [],
    rules: {},
  };

  types.forEach((type) => {
    const preset = presets[type];
    if (preset.config.extends !== undefined) {
      combined.extends = [...(combined.extends ?? []), ...preset.config.extends];
    }
    if (preset.config.plugins !== undefined) {
      combined.plugins = [...(combined.plugins ?? []), ...preset.config.plugins];
    }
    if (preset.config.rules !== undefined) {
      combined.rules = { ...combined.rules, ...preset.config.rules };
    }
  });

  // Remove duplicates
  combined.extends = [...new Set(combined.extends)];
  combined.plugins = [...new Set(combined.plugins)];

  return combined;
}
