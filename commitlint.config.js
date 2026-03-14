/**
 * Commitlint configuration
 * Enforces conventional commit messages
 * 
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Changes that do not affect the meaning of the code
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding missing tests
        'chore',    // Changes to the build process or auxiliary tools
        'ci',       // Changes to CI configuration
        'build',    // Changes that affect the build system
        'revert',   // Reverts a previous commit
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'analyzer',   // Analysis modules
        'component',  // UI components
        'store',      // State management
        'hook',       // React hooks
        'util',       // Utilities
        'worker',     // Web workers
        'test',       // Tests
        'ci',         // CI/CD
        'deps',       // Dependencies
        'config',     // Configuration
        'docs',       // Documentation
        'ui',         // UI/UX
        'perf',       // Performance
        'a11y',       // Accessibility
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'body-max-line-length': [1, 'always', 100],
    'footer-max-line-length': [1, 'always', 100],
  },
}
