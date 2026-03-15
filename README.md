# Frontend Performance Profiler

A comprehensive, browser-based developer tool that performs static analysis on frontend applications to generate detailed performance audit reports. Built with modern web technologies and designed as a production-ready portfolio project demonstrating advanced frontend architecture patterns.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-238636?style=for-the-badge)](https://your-demo-url.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-5-443E38)](https://github.com/pmndrs/zustand)
[![Web Workers](https://img.shields.io/badge/Web%20Workers-Enabled-orange)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)

## 🎯 Project Overview

The Frontend Performance Profiler is a sophisticated analysis tool that helps developers identify performance bottlenecks, accessibility issues, security vulnerabilities, and SEO problems in their web applications. The tool performs **100% client-side analysis** - no data ever leaves the user's browser, ensuring complete privacy and security.

## 🎨 Portfolio Project Showcase

This repository represents a **production-grade frontend application** built to demonstrate senior-level software engineering capabilities. It serves as a comprehensive example of modern web development practices, architecture patterns, and technical decision-making.

### What This Project Demonstrates

| Area                 | Skills Demonstrated                                                       |
| -------------------- | ------------------------------------------------------------------------- |
| **Architecture**     | Modular monolith, plugin-based analyzers, clean separation of concerns    |
| **Performance**      | Web Workers, lazy loading, virtualization-ready, memory management        |
| **TypeScript**       | Strict mode, 80+ interfaces, generic patterns, type guards                |
| **React**            | React 19 features, custom hooks, compound components, render optimization |
| **State Management** | Zustand with persistence, computed values, optimistic updates             |
| **Testing**          | Unit, integration, and E2E tests with Vitest and Playwright               |
| **DevOps**           | CI/CD ready, PWA deployment, automated budgets                            |
| **UX/UI**            | Accessibility-first, keyboard navigation, dark/light themes, animations   |

### Technical Highlights

- **17 Specialized Analyzers**: Each analyzer is a self-contained module with its own parsing, analysis, and scoring logic
- **Web Worker Architecture**: Heavy computation offloaded to workers for 60fps UI
- **100% Client-Side**: No backend required - pure frontend processing with IndexedDB storage
- **Real-time Analysis**: Progress tracking, cancellation support, streaming results
- **PWA Features**: Offline support, background sync, installable app
- **Comprehensive Testing**: 90%+ test coverage across analyzers and components

### Project Statistics

| Metric               | Value                     |
| -------------------- | ------------------------- |
| **Lines of Code**    | ~25,000+                  |
| **Components**       | 80+ React components      |
| **Test Files**       | 15+ test suites           |
| **Analyzers**        | 17 specialized modules    |
| **Stores**           | 10 Zustand stores         |
| **Type Definitions** | 80+ TypeScript interfaces |
| **Build Time**       | < 30 seconds              |
| **Bundle Size**      | ~550KB (gzipped: ~150KB)  |

### Why This Project?

This project demonstrates expertise in:

- **Advanced React Patterns**: Custom hooks, compound components, render optimization with React 19
- **TypeScript Architecture**: Complex type systems, generic patterns, strict type safety
- **Performance Engineering**: Web Workers, lazy loading, memory management
- **State Management**: Zustand for global state with IndexedDB persistence
- **Data Visualization**: D3.js for custom charts and @xyflow/react for dependency graphs
- **Code Quality**: 17 specialized analyzers covering performance, accessibility, SEO, and security
- **Progressive Web App**: Offline support, service workers, installable application

## ✨ Key Features

### 17 Specialized Analyzers

| Category         | Analyzer              | Description                                                           |
| ---------------- | --------------------- | --------------------------------------------------------------------- |
| **Performance**  | Bundle Analyzer       | Treemap visualization, duplicate detection, vendor analysis           |
| **Performance**  | Web Vitals            | LCP, FID, CLS, FCP, TTFB, INP estimation                              |
| **Performance**  | Network Analysis      | Resource hints, render-blocking detection                             |
| **Performance**  | Image Optimization    | Modern format detection (WebP, AVIF), responsive image analysis       |
| **Performance**  | Font Loading          | font-display validation, preload suggestions, variable font detection |
| **Performance**  | Memory Estimation     | Leak risk detection, closure analysis, DOM reference tracking         |
| **Performance**  | Import Cost           | Tree-shaking analysis, barrel file detection, duplicate imports       |
| **Code Quality** | JavaScript Complexity | AST parsing with Acorn, cyclomatic complexity, nested loop detection  |
| **Code Quality** | React Patterns        | Component size analysis, inline functions, excessive props detection  |
| **Code Quality** | TypeScript Quality    | Strict mode validation, `any` usage detection, type coverage          |
| **Quality**      | Accessibility         | WCAG A/AA/AAA compliance checks, 50+ validation rules                 |
| **Quality**      | SEO                   | Meta tags, Open Graph, Twitter Cards, structured data validation      |
| **Quality**      | Security              | XSS detection, secrets scanning, SRI validation, CSP analysis         |
| **Quality**      | Third-Party Scripts   | Performance impact, privacy risk analysis, blocking detection         |
| **Structure**    | DOM Complexity        | Node count, depth analysis, lazy loading detection                    |
| **Structure**    | CSS Analysis          | Unused selectors, specificity issues, `!important` usage              |
| **Structure**    | Assets                | Distribution by type, compression analysis, largest assets            |

### Developer Experience Features

- **29 Analysis Sections**: Comprehensive sidebar navigation with 25+ specialized report sections
- **Report Comparison**: Side-by-side diff mode with regression detection
- **Performance Budgets**: Configurable thresholds with CI/CD export (GitHub Actions, GitLab CI, CircleCI, Travis)
- **Multi-Format Export**: PDF, HTML, Markdown, JSON, HAR waterfall exports
- **Report History**: IndexedDB persistence with search, filter, pinning, and tagging
- **Trend Analysis**: Historical performance tracking with regression detection
- **Report Templates**: Pre-configured templates for e-commerce, SPA, blog, dashboard, landing pages
- **Code Playground**: Interactive code editor with real-time analysis
- **Dependency Graph**: Interactive module graph visualization with @xyflow/react
- **Waterfall Chart**: Network waterfall visualization with HAR export
- **Keyboard Shortcuts**: Full keyboard navigation with help overlay
- **Dark/Light Theme**: System preference detection with manual toggle
- **Setup Wizard**: Onboarding experience for first-time users
- **Toast Notifications**: Non-blocking feedback system
- **Offline Support**: Full PWA with IndexedDB storage for reports

## 🏗️ Architecture Highlights

### Web Worker Integration

Heavy analysis runs in dedicated Web Workers to maintain UI responsiveness:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   UI Thread │────▶│    Comlink  │────▶│  Analysis Worker│
│  (React App)│◀────│    (Proxy)  │◀────│  (Heavy Compute)│
└─────────────┘     └─────────────┘     └─────────────────┘
                                               │
                                               ▼
                                        ┌─────────────────┐
                                        │  Analyzer Chain │
                                        │  (17 Analyzers) │
                                        └─────────────────┘
```

**Features:**

- Cancellation support for long-running analyses
- Progress reporting with granular stage updates
- Error handling with recoverable states
- Memory cleanup between analyses

### Modular Analyzer Pipeline

Each analyzer follows a consistent interface pattern:

```typescript
interface Analyzer<T> {
  name: string;
  analyze: (files: AnalyzedFile[], options: AnalysisOptions) => Promise<T>;
  calculateScore: (result: T) => number;
  generateRecommendations: (result: T) => Optimization[];
}
```

**Pipeline Features:**

- Parallel execution of independent analyzers
- Streaming results for real-time UI updates
- Configurable batch sizes and concurrency limits
- Memory-constrained detection with automatic cleanup

### State Management Architecture

Zustand stores with computed values and IndexedDB persistence:

```typescript
// Analysis Store with IndexedDB persistence
interface AnalysisState {
  currentReport: AnalysisReport | null;
  history: AnalysisReport[];
  pinnedReports: PinnedReport[];
  historyFilters: HistoryFilters;
  // ... 30+ more fields and actions
}

// Budget Store with validation and CI/CD export
interface BudgetState {
  budget: PerformanceBudget;
  status: BudgetStatus[];
  alerts: BudgetAlert[];
  // ... actions
}

// Trend Store for historical analysis
interface TrendState {
  trends: TrendDataPoint[];
  regressions: RegressionPoint[];
  summary: TrendSummary;
  // ... actions
}
```

### Scoring Algorithm

Weighted scoring system with 9 categories:

```
Overall Score =
  Bundle (20%) + DOM (15%) + CSS (10%) + Assets (10%) +
  JavaScript (10%) + Web Vitals (15%) + Accessibility (5%) +
  SEO (3%) + Security (2%)
```

Scores are color-coded:

- 🟢 **90-100**: Excellent
- 🟡 **70-89**: Good
- 🟠 **50-69**: Fair
- 🔴 **0-49**: Poor

## 🛠️ Technical Stack

### Core Technologies

| Technology      | Purpose          | Version |
| --------------- | ---------------- | ------- |
| React           | UI Framework     | 19.x    |
| TypeScript      | Type Safety      | 5.9.x   |
| Vite            | Build Tool       | 7.x     |
| TanStack Router | Routing          | 1.x     |
| Zustand         | State Management | 5.x     |
| TanStack Query  | Server State     | 5.x     |
| TailwindCSS     | Styling          | 4.x     |

### Analysis & Parsing

| Library       | Purpose                |
| ------------- | ---------------------- |
| Acorn         | JavaScript AST Parsing |
| htmlparser2   | HTML Parsing           |
| PostCSS       | CSS Analysis           |
| D3.js         | Data Visualization     |
| @xyflow/react | Dependency Graphs      |
| Monaco Editor | Code Editing           |

### Export & Utilities

| Library         | Purpose             |
| --------------- | ------------------- |
| jsPDF           | PDF Generation      |
| html2canvas     | Screenshot Capture  |
| marked          | Markdown Export     |
| date-fns        | Date Formatting     |
| zod             | Schema Validation   |
| idb-keyval      | IndexedDB Wrapper   |
| framer-motion   | UI Animations       |
| canvas-confetti | Celebration Effects |

### Testing

| Tool            | Purpose           |
| --------------- | ----------------- |
| Vitest          | Unit Testing      |
| Playwright      | E2E Testing       |
| Testing Library | Component Testing |
| jsdom           | DOM Environment   |

## 📁 Project Structure

```
src/
├── app/
│   └── router/              # TanStack Router configuration
│       ├── index.tsx        # Router provider setup
│       ├── routeTree.gen.ts # Auto-generated route tree
│       └── routes/
│           ├── __root.route.ts
│           ├── __root.component.tsx
│           ├── index.route.tsx
│           └── index.component.tsx
├── components/
│   ├── animations/          # Framer Motion animations
│   │   ├── AnimatedScore.tsx
│   │   ├── ConfettiTrigger.tsx
│   │   ├── Gauge.tsx
│   │   └── ScoreRing.tsx
│   ├── charts/              # D3.js visualizations
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── ScoreGauge.tsx
│   │   ├── TimelineChart.tsx
│   │   ├── Treemap.tsx
│   │   └── TrendLineChart.tsx
│   ├── cicd/                # CI/CD config generator
│   │   ├── CICDConfigGenerator.tsx
│   │   └── PlatformSelector.tsx
│   ├── compare/             # Report comparison
│   │   └── ReportComparison.tsx
│   ├── eslint/              # ESLint config generator
│   │   └── ESLintConfigGenerator.tsx
│   ├── export/              # Export dialogs
│   │   └── ExportDialog.tsx
│   ├── graph/               # Dependency graph (@xyflow/react)
│   │   ├── DependencyGraph.tsx
│   │   ├── GraphSection.tsx
│   │   ├── ModuleNode.tsx
│   │   └── CircularEdge.tsx
│   ├── layout/              # Application shell
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx      # 29 navigation sections
│   │   ├── sidebarData.ts
│   │   └── types.ts
│   ├── playground/          # Interactive code playground
│   │   ├── CodePlayground.tsx
│   │   ├── IssueList.tsx
│   │   ├── OptimizationPanel.tsx
│   │   └── ScoreComparison.tsx
│   ├── projects/            # Project management
│   │   ├── CreateProjectDialog.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── ProjectFileUpload.tsx
│   │   └── ProjectsList.tsx
│   ├── report/              # Analysis section components (22 sections)
│   │   ├── OverviewSection.tsx
│   │   ├── BundleSection.tsx
│   │   ├── DOMSection.tsx
│   │   ├── CSSSection.tsx
│   │   ├── AssetsSection.tsx
│   │   ├── JavaScriptSection.tsx
│   │   ├── ReactSection.tsx
│   │   ├── WebVitalsSection.tsx
│   │   ├── NetworkSection.tsx
│   │   ├── ImagesSection.tsx
│   │   ├── FontsSection.tsx
│   │   ├── AccessibilitySection.tsx
│   │   ├── SEOSection.tsx
│   │   ├── TypeScriptSection.tsx
│   │   ├── SecuritySection.tsx
│   │   ├── ThirdPartySection.tsx
│   │   ├── MemorySection.tsx
│   │   ├── ImportsSection.tsx
│   │   ├── TimelineSection.tsx
│   │   ├── RisksSection.tsx
│   │   ├── BudgetSection.tsx
│   │   └── RealMetricsSection.tsx
│   ├── settings/            # Budget configuration
│   │   └── BudgetSettings.tsx
│   ├── templates/           # Report templates
│   │   └── TemplateSelector.tsx
│   ├── trends/              # Trend analysis
│   │   └── TrendDashboard.tsx
│   ├── ui/                  # Shared UI components (25+ components)
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Tabs.tsx
│   │   ├── Dropdown.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── SetupWizard.tsx
│   │   ├── KeyboardShortcutsHelp.tsx
│   │   └── ...
│   ├── upload/              # File upload
│   │   └── FileUpload.tsx
│   └── waterfall/           # Waterfall chart
│       ├── HARExport.tsx
│       ├── ResourcePreview.tsx
│       ├── WaterfallChart.tsx
│       └── WaterfallShare.tsx
├── core/
│   ├── analyzers/           # 17 analysis modules
│   │   ├── bundle.ts
│   │   ├── dom.ts
│   │   ├── css.ts
│   │   ├── assets.ts
│   │   ├── javascript.ts
│   │   ├── react.ts
│   │   ├── webVitals.ts
│   │   ├── network.ts
│   │   ├── images.ts
│   │   ├── fonts.ts
│   │   ├── accessibility.ts
│   │   ├── seo.ts
│   │   ├── typescript.ts
│   │   ├── security.ts
│   │   ├── thirdParty.ts
│   │   ├── memory.ts
│   │   └── imports.ts
│   ├── browser-analysis/    # Real browser metrics
│   │   ├── lighthouse.ts
│   │   ├── rum-adapters.ts
│   │   └── index.ts
│   ├── ci-cd/               # CI/CD config generation
│   │   └── index.ts
│   ├── eslint/              # ESLint config generation
│   │   ├── index.ts
│   │   ├── ruleMapping.ts
│   │   └── presets.ts
│   ├── graph/               # Graph layout algorithms
│   │   ├── index.ts
│   │   └── layout.ts
│   ├── parsers/             # File parsers
│   ├── pipeline/            # Analysis orchestration
│   │   └── index.ts
│   ├── playground/          # Code playground analysis
│   │   ├── analyzer.ts
│   │   └── transformer.ts
│   ├── scoring/             # Scoring algorithms
│   │   └── index.ts
│   ├── templates/           # Template presets
│   │   ├── index.ts
│   │   └── presets.ts
│   ├── trends/              # Trend analysis utilities
│   │   └── index.ts
│   └── waterfall/           # Waterfall timing calculation
│       ├── index.ts
│       └── timingCalculator.ts
├── hooks/                   # Custom React hooks
│   ├── useAnalysis.ts
│   ├── useFileUpload.ts
│   ├── useKeyboardShortcuts.ts
│   ├── useClickOutside.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   ├── useConfirm.tsx
│   ├── usePWA.tsx
│   └── index.ts
├── stores/                  # Zustand state management
│   ├── analysisStore.ts     # Report history, persistence
│   ├── budgetStore.ts       # Performance budgets
│   ├── comparisonStore.ts   # Report comparison
│   ├── notificationStore.ts # Toast notifications
│   ├── playgroundStore.ts   # Code playground state
│   ├── projectStore.ts      # Project management
│   ├── pwaStore.ts          # PWA installation state
│   ├── setupStore.ts        # First-run wizard
│   ├── templateStore.ts     # Report templates
│   ├── themeStore.ts        # Theme management
│   └── trendStore.ts        # Historical trends
├── types/                   # TypeScript type definitions
│   ├── index.ts             # 80+ interfaces
│   ├── graph.ts             # Graph visualization types
│   ├── cicd.ts              # CI/CD config types
│   ├── playground.ts        # Code playground types
│   └── pwa.d.ts             # PWA type declarations
├── utils/                   # Utility functions
│   ├── downloadFile.ts
│   ├── export.ts
│   ├── formatDate.ts
│   ├── offlineStorage.ts
│   ├── syntaxHighlight.ts
│   ├── errorHandler.ts
│   ├── accessibility.ts
│   ├── schemaMigration.ts
│   ├── fileCache.ts
│   ├── dataImport.ts
│   ├── dataExport.ts
│   └── streamProcessor.ts
├── workers/                 # Web Workers
│   ├── analysis.worker.ts   # Main analysis worker
│   └── types.ts             # Worker type definitions
├── index.css                # Global styles with Tailwind
└── main.tsx                 # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd frontend-performance-profiler

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Build & Deploy

```bash
# Production build
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

### Deployment

The application is configured for static hosting:

**Netlify** (Configuration included in `netlify.toml`):

- Build command: `pnpm build`
- Publish directory: `dist`
- Node version: 20

**Vercel**:

- Framework preset: Vite
- Build command: `pnpm build`
- Output directory: `dist`

## 📖 Usage Guide

### Analyzing a Project

1. **Upload Files**: Drag and drop or select files (HTML, JS, CSS, React builds, TypeScript)
2. **Configure Analysis**: Toggle specific analyzers or select a template
3. **Run Analysis**: Click "Analyze Performance" - processing happens in Web Workers
4. **Review Results**: Navigate through 29 analysis sections via the sidebar
5. **Export Report**: Save as PDF, HTML, Markdown, JSON, or HAR

### Keyboard Shortcuts

| Shortcut       | Action                   |
| -------------- | ------------------------ |
| `Cmd/Ctrl + K` | Open command palette     |
| `1-9`          | Navigate to sections 1-9 |
| `0`            | Navigate to Web Vitals   |
| `↑ / ↓`        | Navigate sections        |
| `R`            | Re-run analysis          |
| `E`            | Export report            |
| `?`            | Show keyboard help       |
| `Esc`          | Close modal/dialog       |

### Performance Budgets

Set thresholds for key metrics:

- Bundle size limits (JavaScript, CSS, images)
- DOM complexity limits (node count, max depth)
- Score minimums per category
- Unused CSS thresholds

Export budgets as CI/CD configuration for automated checks.

### Report Templates

Choose from pre-configured templates:

- **E-commerce**: Optimized for product pages, checkout flows
- **SPA (Single Page App)**: Focus on bundle size, code splitting
- **Blog**: Content-focused, image optimization, SEO
- **Dashboard**: Data visualization, interactivity metrics
- **Landing Page**: Conversion optimization, critical rendering path

### Trend Analysis

Track performance over time:

- View historical score trends
- Detect regressions automatically
- Compare metrics across time periods
- Export trend data for reporting

## 🧪 Testing Strategy

The project includes a comprehensive test suite:

| Type            | Tool            | Coverage                     |
| --------------- | --------------- | ---------------------------- |
| Unit Tests      | Vitest          | Analyzers, utilities, stores |
| Component Tests | Testing Library | UI components, hooks         |
| E2E Tests       | Playwright      | Critical user flows          |

```bash
# Run unit tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

## 🎨 Theme Color Variables

The application uses CSS custom properties for theming:

```css
/* Dark Theme (Default) */
--dev-bg: #0d1117 /* Background */ --dev-surface: #161b22 /* Card/Panel background */
  --dev-surface-hover: #1c2128 /* Hover state */ --dev-border: #30363d /* Borders */
  --dev-text: #c9d1d9 /* Primary text */ --dev-text-muted: #8b949e /* Secondary text */
  --dev-text-subtle: #6e7681 /* Tertiary text */ --dev-accent: #58a6ff /* Primary accent (blue) */
  --dev-success: #238636 /* Success green */ --dev-warning: #d29922 /* Warning yellow */
  --dev-danger: #da3633 /* Danger red */ --dev-info: #1f6feb /* Info blue */;
```

## 🔒 Security Considerations

1. **File Upload Security**
   - Files are processed client-side only
   - File content is read via FileReader API
   - No server-side file storage

2. **Worker Security**
   - Web Workers use ES module format
   - Worker scripts are bundled with the application
   - Extension message filtering in workers

3. **Content Security**
   - No inline scripts (except critical CSS in index.html)
   - External resources limited to Google Fonts
   - CSP-friendly PWA configuration

4. **XSS Prevention**
   - User content is never rendered as HTML without sanitization
   - Monaco Editor handles code display safely

## 📱 Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- ES2022 target
- PWA with offline support
- Responsive design (mobile, tablet, desktop)

## ♿ Accessibility

- Full keyboard navigation support
- ARIA attributes on interactive components
- Focus management (trap, restore, visible indicators)
- Skip-to-content link
- Semantic HTML structure
- Color contrast compliance (WCAG AA)
- Reduced motion support (`prefers-reduced-motion`)
- High contrast mode support (`prefers-contrast: high`)
- Screen reader optimized

## 📊 Performance Metrics

| Metric              | Value                    |
| ------------------- | ------------------------ |
| Initial Bundle      | ~550KB (gzipped: ~150KB) |
| Web Worker          | ~305KB                   |
| Time to Interactive | < 2s on 4G               |
| Analysis Throughput | ~10MB/s (worker-bound)   |
| Lighthouse Score    | 95+ (Performance)        |

## 🔧 Technical Challenges & Solutions

### Challenge 1: Client-Side Analysis Performance

**Problem**: Parsing large JavaScript bundles and HTML files can block the UI thread.

**Solution**: Implemented Web Workers with Comlink for seamless communication. Heavy analysis runs in a separate thread, maintaining 60fps UI responsiveness even with large files. Added cancellation support for long-running analyses.

### Challenge 2: Type Safety Across Analyzers

**Problem**: 17 different analyzers with varying input/output types needed a unified interface.

**Solution**: Created a generic `Analyzer<T>` interface with consistent methods for analysis, scoring, and recommendations. TypeScript's conditional types ensure type safety throughout the pipeline.

### Challenge 3: Report History Persistence

**Problem**: localStorage has 5MB limit, insufficient for storing multiple reports.

**Solution**: Used IndexedDB via `idb-keyval` for unlimited storage. Implemented smart cleanup that preserves pinned reports while removing old unpinned ones (LRU eviction).

### Challenge 4: Real-time Scoring Updates

**Problem**: Overall score depends on 9 weighted categories that update independently.

**Solution**: Zustand computed values automatically recalculate overall score when any category changes. Memoization prevents unnecessary re-renders.

### Challenge 5: Export Format Flexibility

**Problem**: Need to support PDF, HTML, Markdown, JSON, and HAR exports with consistent styling.

**Solution**: Created a unified export pipeline that transforms report data through format-specific adapters. HTML2Canvas captures report screenshots for PDF embedding.

### Challenge 6: PWA Offline Support

**Problem**: Users need access to previous reports when offline.

**Solution**: Implemented service worker with Workbox for asset caching. All reports stored in IndexedDB for offline access. Background sync for pending operations.

## 📈 Key Learnings

This project reinforced several important software engineering principles:

1. **Modularity Pays Off**: The analyzer plugin architecture made adding 17 analyzers straightforward
2. **Type Safety is Worth It**: TypeScript caught numerous bugs during development and refactoring
3. **Performance is a Feature**: Web Workers transformed the UX from sluggish to responsive
4. **State Management Matters**: Zustand's simplicity with persistence hooks saved significant boilerplate
5. **Privacy by Design**: Client-side only analysis is a compelling differentiator
6. **PWA is Viable**: Modern browsers make offline-capable web apps practical
7. **Testing is Essential**: Comprehensive test suite prevents regressions in complex analysis logic

## 👤 Author

**Abhishek R.** - Versatile Developer

- 🔗 [Portfolio](https://coderdeck.in)
- 💼 [LinkedIn](https://in.linkedin.com/in/abhishek-versatile-dev)
- 🐙 [GitHub](https://github.com/AbhishekChamp)

---

## ⭐ Star This Project

If you find this project interesting or useful, please consider giving it a star! It helps others discover the project and shows appreciation for the work involved.

---

## 📄 License

MIT License - Copyright (c) 2026-present Abhishek R.

See [LICENSE](./LICENSE) for full details.

---

**Built with modern web technologies. No data leaves your browser.** 🔒

_This project was built as a portfolio piece to demonstrate senior frontend engineering capabilities. Feel free to explore the code and reach out with any questions!_
