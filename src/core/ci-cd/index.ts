import type { 
  CIPlatform, 
  ConfigFormat, 
  PerformanceBudget, 
  BudgetConfig, 
  GeneratedConfig,
  PlatformInfo,
  BudgetCheckScript 
} from '@/types/cicd';

export const PLATFORMS: PlatformInfo[] = [
  {
    id: 'github-actions',
    name: 'GitHub Actions',
    icon: 'github',
    description: 'Workflow automation for GitHub repositories',
    supportedFormats: ['yaml'],
    defaultFormat: 'yaml',
  },
  {
    id: 'gitlab-ci',
    name: 'GitLab CI',
    icon: 'gitlab',
    description: 'Integrated CI/CD for GitLab repositories',
    supportedFormats: ['yaml'],
    defaultFormat: 'yaml',
  },
  {
    id: 'circleci',
    name: 'CircleCI',
    icon: 'circleci',
    description: 'Continuous integration and delivery platform',
    supportedFormats: ['yaml'],
    defaultFormat: 'yaml',
  },
  {
    id: 'azure-devops',
    name: 'Azure DevOps',
    icon: 'azure',
    description: 'Microsoft Azure DevOps Pipelines',
    supportedFormats: ['yaml'],
    defaultFormat: 'yaml',
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    icon: 'jenkins',
    description: 'Open-source automation server',
    supportedFormats: ['yaml', 'json'],
    defaultFormat: 'yaml',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    icon: 'vercel',
    description: 'Deployment platform with performance insights',
    supportedFormats: ['json'],
    defaultFormat: 'json',
  },
  {
    id: 'netlify',
    name: 'Netlify',
    icon: 'netlify',
    description: 'Static site hosting with build plugins',
    supportedFormats: ['yaml', 'json'],
    defaultFormat: 'yaml',
  },
];

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Generate GitHub Actions workflow config
 */
function generateGitHubActionsConfig(budget: BudgetConfig): GeneratedConfig {
  const budgetJson = JSON.stringify(budget.budgets, null, 2);
  
  const content = `name: Performance Budget Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  performance-budget:
    name: Check Performance Budgets
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Check bundle size
        run: |
          echo "Checking performance budgets..."
          node .github/scripts/check-budgets.js
        env:
          CI: true
          
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: \${{ secrets.LHCI_GITHUB_APP_TOKEN }}
          
      - name: Comment PR with results
        if: github.event_name == 'pull_request' && ${budget.commentOnPR}
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = fs.readFileSync('./lhci-results.json', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '📊 Performance Budget Results\\n\\n' + results
            });

# Performance Budgets Configuration
# ${budgetJson.replace(/\n/g, '\n# ')}
`;

  return {
    platform: 'github-actions',
    format: 'yaml',
    filename: '.github/workflows/performance-budget.yml',
    content,
    setupInstructions: [
      'Create the workflow file at `.github/workflows/performance-budget.yml`',
      'Create `.github/scripts/check-budgets.js` with the budget check script',
      'Add LHCI_GITHUB_APP_TOKEN secret for PR comments (optional)',
      'Commit and push to trigger the workflow',
    ],
    requiredPlugins: ['@lhci/cli'],
  };
}

/**
 * Generate GitLab CI config
 */
function generateGitLabCIConfig(budget: BudgetConfig): GeneratedConfig {
  const budgetJson = JSON.stringify(budget.budgets, null, 2);
  
  const content = `# Performance Budget Pipeline
# Auto-generated for GitLab CI

stages:
  - build
  - test
  - performance

variables:
  npm_config_cache: "$CI_PROJECT_DIR/.npm"
  CI: "true"

# Cache node_modules between jobs
default:
  cache:
    key: \${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/

# Build stage
build:
  stage: build
  image: node:20-alpine
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
      - build/
    expire_in: 1 hour

# Performance budget checks
performance-budget:
  stage: performance
  image: node:20-alpine
  needs:
    - job: build
      artifacts: true
  script:
    - npm ci
    - |
      echo "Checking performance budgets..."
      node scripts/check-budgets.js << 'EOF'
      ${budgetJson}
      EOF
  artifacts:
    reports:
      junit: performance-results.xml
    paths:
      - performance-report.json
    expire_in: 30 days
  rules:
    - if: $CI_MERGE_REQUEST_ID
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "develop"

# Lighthouse CI
lighthouse:
  stage: performance
  image: cypress/browsers:node-20.9.0-chrome-118.0.5993.88-1-ff-118.0.2-edge-118.0.2088.46-1
  needs:
    - job: build
      artifacts: true
  script:
    - npm install -g @lhci/cli@0.12.x
    - lhci autorun
  artifacts:
    paths:
      - .lighthouseci/
    expire_in: 30 days
  rules:
    - if: $CI_MERGE_REQUEST_ID
    - if: $CI_COMMIT_BRANCH == "main"
`;

  return {
    platform: 'gitlab-ci',
    format: 'yaml',
    filename: '.gitlab-ci.yml',
    content,
    setupInstructions: [
      'Create the config file at `.gitlab-ci.yml`',
      'Create `scripts/check-budgets.js` with the budget check script',
      'Ensure your build outputs to `dist/` or `build/`',
      'Push to trigger the pipeline',
    ],
    requiredPlugins: ['@lhci/cli'],
  };
}

/**
 * Generate CircleCI config
 */
function generateCircleCIConfig(budget: BudgetConfig): GeneratedConfig {
  const budgetJson = JSON.stringify(budget.budgets, null, 2);
  
  const content = `# Performance Budget Configuration
# Auto-generated for CircleCI

version: 2.1

orbs:
  node: circleci/node@5.1.0
  lighthouse-check: foo-software/lighthouse-check@0.0.17

jobs:
  build:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Build application
          command: npm run build
      - persist_to_workspace:
          root: .
          paths:
            - dist
            - build

  performance-budget:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - attach_workspace:
          at: .
      - run:
          name: Check Performance Budgets
          command: |
            cat > budgets.json << 'EOF'
            ${budgetJson}
            EOF
            node scripts/check-budgets.js
      - store_artifacts:
          path: performance-report.json
          destination: performance-report

  lighthouse:
    docker:
      - image: cimg/node:20.0-browsers
    steps:
      - checkout
      - attach_workspace:
          at: .
      - run:
          name: Install Lighthouse CI
          command: npm install -g @lhci/cli@0.12.x
      - run:
          name: Run Lighthouse CI
          command: lhci autorun
      - store_artifacts:
          path: .lighthouseci
          destination: lighthouse

workflows:
  performance-check:
    jobs:
      - build
      - performance-budget:
          requires:
            - build
          filters:
            branches:
              only:
                - main
                - develop
      - lighthouse:
          requires:
            - build
          filters:
            branches:
              only:
                - main
                - develop
`;

  return {
    platform: 'circleci',
    format: 'yaml',
    filename: '.circleci/config.yml',
    content,
    setupInstructions: [
      'Create the config file at `.circleci/config.yml`',
      'Create `scripts/check-budgets.js` with the budget check script',
      'Enable the project in CircleCI dashboard',
      'Push to trigger the workflow',
    ],
    requiredPlugins: ['@lhci/cli'],
  };
}

/**
 * Generate Azure DevOps Pipeline config
 */
function generateAzureDevOpsConfig(budget: BudgetConfig): GeneratedConfig {
  const budgetJson = JSON.stringify(budget.budgets, null, 2);
  
  const content = `# Performance Budget Pipeline
# Auto-generated for Azure DevOps

trigger:
  branches:
    include:
      - main
      - develop

pr:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  npm_config_cache: $(Pipeline.Workspace)/.npm

stages:
  - stage: Build
    jobs:
      - job: BuildApp
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
            displayName: 'Install Node.js'
            
          - task: Cache@2
            inputs:
              key: 'npm | "$(Agent.OS)" | package-lock.json'
              restoreKeys: |
                npm | "$(Agent.OS)"
              path: $(npm_config_cache)
            displayName: 'Cache npm'
            
          - script: npm ci
            displayName: 'Install dependencies'
            
          - script: npm run build
            displayName: 'Build application'
            
          - publish: $(System.DefaultWorkingDirectory)/dist
            artifact: build-output
            displayName: 'Publish build artifacts'

  - stage: Performance
    dependsOn: Build
    jobs:
      - job: PerformanceBudget
        steps:
          - download: current
            artifact: build-output
            
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
            displayName: 'Install Node.js'
            
          - script: |
              echo '${budgetJson.replace(/'/g, "'\\''")}' > budgets.json
              node scripts/check-budgets.js
            displayName: 'Check performance budgets'
            
          - task: PublishTestResults@2
            inputs:
              testResultsFormat: JUnit
              testResultsFiles: '**/performance-results.xml'
              testRunTitle: 'Performance Budget'
            condition: succeededOrFailed()
            
          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(System.DefaultWorkingDirectory)/performance-report.json'
              artifactName: performance-report
            displayName: 'Publish performance report'
`;

  return {
    platform: 'azure-devops',
    format: 'yaml',
    filename: 'azure-pipelines.yml',
    content,
    setupInstructions: [
      'Create the config file at `azure-pipelines.yml`',
      'Create `scripts/check-budgets.js` with the budget check script',
      'Configure the pipeline in Azure DevOps',
      'Push to trigger the pipeline',
    ],
    requiredPlugins: ['@lhci/cli'],
  };
}

/**
 * Generate Jenkins Pipeline config
 */
function generateJenkinsConfig(budget: BudgetConfig): GeneratedConfig {
  const budgetJson = JSON.stringify(budget.budgets, null, 2);
  
  const content = `pipeline {
    agent any
    
    tools {
        nodejs 'node-20'
    }
    
    environment {
        CI = 'true'
        NPM_CONFIG_CACHE = '\${WORKSPACE}/.npm'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
                stash includes: 'dist/**,build/**', name: 'build-artifacts'
            }
        }
        
        stage('Performance Budget Check') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    changeRequest()
                }
            }
            steps {
                script {
                    writeFile file: 'budgets.json', text: '''${budgetJson}'''
                    sh 'node scripts/check-budgets.js'
                }
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'performance-report.html',
                        reportName: 'Performance Report'
                    ])
                }
            }
        }
        
        stage('Lighthouse CI') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                sh 'npm install -g @lhci/cli@0.12.x'
                sh 'lhci autorun'
            }
        }
    }
    
    post {
        failure {
            emailext (
                subject: "Performance Budget Failed: \${env.JOB_NAME} - \${env.BUILD_NUMBER}",
                body: """<p>Performance budget checks failed.</p>
                       <p>Check the <a href="\${env.BUILD_URL}">build report</a>.</p>""",
                to: "\${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}`;

  return {
    platform: 'jenkins',
    format: 'yaml',
    filename: 'Jenkinsfile',
    content,
    setupInstructions: [
      'Create the config file at `Jenkinsfile`',
      'Create `scripts/check-budgets.js` with the budget check script',
      'Configure Node.js tool installation in Jenkins',
      'Create a new Pipeline job pointing to your repository',
    ],
    requiredPlugins: ['Pipeline', 'HTML Publisher', 'Email Extension'],
  };
}

/**
 * Generate Vercel config
 */
function generateVercelConfig(budget: BudgetConfig): GeneratedConfig {
  const budgetJson = JSON.stringify(budget.budgets, null, 2);
  
  const content = `{
  \"$schema\": \"https://openapi.vercel.sh/vercel.json\",
  \"version\": 2,
  \"buildCommand\": \"npm run build\",
  \"outputDirectory\": \"dist\",
  \"framework\": null,
  \"installCommand\": \"npm ci\",
  \"functions\": {},
  \"crons\": [],
  \\"git\\": {
    \\"deploymentEnabled\\": {
      \\"main\\": true,
      \\"develop\\": true
    }
  },
  \\"performance\\": {
    \\"bundleSize\\": ${budget.budgets.bundleSize ? budget.budgets.bundleSize * 1024 : 256000},
    \\"jsSize\\": ${budget.budgets.jsSize ? budget.budgets.jsSize * 1024 : 153600},
    \\"cssSize\\": ${budget.budgets.cssSize ? budget.budgets.cssSize * 1024 : 51200}
  },
  \\"github\\": {
    \\"enabled\\": true,
    \\"silent\\": false,
    \\"autoJobCancelation\\": true
  }
}`;

  return {
    platform: 'vercel',
    format: 'json',
    filename: 'vercel.json',
    content,
    setupInstructions: [
      'Create the config file at `vercel.json`',
      'Install Vercel CLI: `npm i -g vercel`',
      'Link project: `vercel link`',
      'Deploy: `vercel --prod`',
    ],
    requiredPlugins: [],
  };
}

/**
 * Generate Netlify config
 */
function generateNetlifyConfig(budget: BudgetConfig): GeneratedConfig {
  const budgetJson = JSON.stringify(budget.budgets, null, 2);
  
  const content = `[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  CI = "true"

# Performance Budget Plugin
[[plugins]]
  package = "netlify-plugin-performance-budget"
  
  [plugins.inputs]
    # Bundle size budgets (in KB)
    bundleSize = ${budget.budgets.bundleSize || 500}
    jsSize = ${budget.budgets.jsSize || 300}
    cssSize = ${budget.budgets.cssSize || 100}
    imageSize = ${budget.budgets.imageSize || 200}
    fontSize = ${budget.budgets.fontSize || 100}
    
    # Lighthouse score thresholds
    lighthousePerformance = ${budget.budgets.lighthousePerformance || 90}
    lighthouseAccessibility = ${budget.budgets.lighthouseAccessibility || 90}
    lighthouseBestPractices = ${budget.budgets.lighthouseBestPractices || 90}
    lighthouseSEO = ${budget.budgets.lighthouseSEO || 90}

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache static assets
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Redirect rules
[[redirects]]
  from = "/old-path"
  to = "/new-path"
  status = 301
`;

  return {
    platform: 'netlify',
    format: 'yaml',
    filename: 'netlify.toml',
    content,
    setupInstructions: [
      'Create the config file at `netlify.toml`',
      'Install Netlify CLI: `npm i -g netlify-cli`',
      'Link project: `netlify link`',
      'Install performance budget plugin: `npm i netlify-plugin-performance-budget`',
      'Deploy: `netlify deploy --prod`',
    ],
    requiredPlugins: ['netlify-plugin-performance-budget'],
  };
}

/**
 * Generate budget check script
 */
export function generateBudgetCheckScript(budget: BudgetConfig): BudgetCheckScript {
  const budgetJson = JSON.stringify(budget.budgets, null, 2);
  
  const script = `const fs = require('fs');
const path = require('path');

// Performance Budget Configuration
const budgets = ${budgetJson};

// ANSI color codes
const colors = {
  reset: '\\x1b[0m',
  red: '\\x1b[31m',
  green: '\\x1b[32m',
  yellow: '\\x1b[33m',
  blue: '\\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (e) {
    return 0;
  }
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }
  
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkBudget(name, actual, budget, unit = '') {
  const passed = actual <= budget;
  const status = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  
  log(\`  \${status} \${name}: \${actual}\${unit} / \${budget}\${unit} (budget)\`, color);
  
  return passed;
}

async function runBudgetChecks() {
  log('\\n📊 Performance Budget Check\\n', 'blue');
  
  let allPassed = true;
  const results = [];
  
  // Check bundle size
  if (budgets.bundleSize) {
    const buildDir = fs.existsSync('dist') ? 'dist' : 'build';
    const bundleSize = getDirectorySize(buildDir);
    const bundleSizeKB = bundleSize / 1024;
    
    const passed = checkBudget('Bundle Size', bundleSizeKB.toFixed(2), budgets.bundleSize, ' KB');
    allPassed = allPassed && passed;
    results.push({ name: 'Bundle Size', actual: bundleSizeKB, budget: budgets.bundleSize, passed });
  }
  
  // Check JS size
  if (budgets.jsSize) {
    const jsSize = getDirectorySize('dist/js') + getDirectorySize('build/static/js');
    const jsSizeKB = jsSize / 1024;
    
    const passed = checkBudget('JavaScript Size', jsSizeKB.toFixed(2), budgets.jsSize, ' KB');
    allPassed = allPassed && passed;
    results.push({ name: 'JavaScript', actual: jsSizeKB, budget: budgets.jsSize, passed });
  }
  
  // Check CSS size
  if (budgets.cssSize) {
    const cssSize = getDirectorySize('dist/css') + getDirectorySize('build/static/css');
    const cssSizeKB = cssSize / 1024;
    
    const passed = checkBudget('CSS Size', cssSizeKB.toFixed(2), budgets.cssSize, ' KB');
    allPassed = allPassed && passed;
    results.push({ name: 'CSS', actual: cssSizeKB, budget: budgets.cssSize, passed });
  }
  
  // Check Image size
  if (budgets.imageSize) {
    const imageSize = getDirectorySize('dist/images') + getDirectorySize('build/static/media');
    const imageSizeKB = imageSize / 1024;
    
    const passed = checkBudget('Image Size', imageSizeKB.toFixed(2), budgets.imageSize, ' KB');
    allPassed = allPassed && passed;
    results.push({ name: 'Images', actual: imageSizeKB, budget: budgets.imageSize, passed });
  }
  
  // Check Font size
  if (budgets.fontSize) {
    const fontSize = getDirectorySize('dist/fonts') + getDirectorySize('build/static/fonts');
    const fontSizeKB = fontSize / 1024;
    
    const passed = checkBudget('Font Size', fontSizeKB.toFixed(2), budgets.fontSize, ' KB');
    allPassed = allPassed && passed;
    results.push({ name: 'Fonts', actual: fontSizeKB, budget: budgets.fontSize, passed });
  }
  
  // Save results
  fs.writeFileSync('performance-report.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    passed: allPassed,
  }, null, 2));
  
  log('\\n' + (allPassed ? '✓ All performance budgets passed!' : '✗ Some performance budgets failed!'), allPassed ? 'green' : 'red');
  
  if (${budget.failOnViolation ? 'true' : 'false'} && !allPassed) {
    process.exit(1);
  }
}

runBudgetChecks().catch(err => {
  console.error('Error running budget checks:', err);
  process.exit(1);
});
`;

  return {
    name: 'check-budgets.js',
    description: 'Node.js script to check performance budgets against build output',
    script,
    language: 'javascript',
  };
}

/**
 * Main config generator function
 */
export function generateConfig(
  platform: CIPlatform,
  budget: BudgetConfig
): GeneratedConfig {
  switch (platform) {
    case 'github-actions':
      return generateGitHubActionsConfig(budget);
    case 'gitlab-ci':
      return generateGitLabCIConfig(budget);
    case 'circleci':
      return generateCircleCIConfig(budget);
    case 'azure-devops':
      return generateAzureDevOpsConfig(budget);
    case 'jenkins':
      return generateJenkinsConfig(budget);
    case 'vercel':
      return generateVercelConfig(budget);
    case 'netlify':
      return generateNetlifyConfig(budget);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get platform by ID
 */
export function getPlatform(id: CIPlatform): PlatformInfo | undefined {
  return PLATFORMS.find(p => p.id === id);
}

/**
 * Get all supported platforms
 */
export function getAllPlatforms(): PlatformInfo[] {
  return PLATFORMS;
}

/**
 * Validate budget configuration
 */
export function validateBudget(budget: PerformanceBudget): string[] {
  const errors: string[] = [];
  
  if (budget.bundleSize !== undefined && budget.bundleSize <= 0) {
    errors.push('Bundle size must be greater than 0');
  }
  if (budget.lighthousePerformance !== undefined && 
      (budget.lighthousePerformance < 0 || budget.lighthousePerformance > 100)) {
    errors.push('Lighthouse performance score must be between 0 and 100');
  }
  
  return errors;
}
