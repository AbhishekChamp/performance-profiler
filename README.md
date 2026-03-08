# Frontend Performance Profiler

A comprehensive, browser-based developer tool that performs static analysis on frontend applications to generate detailed performance audit reports. Built with modern web technologies and designed as a production-ready portfolio project demonstrating advanced frontend architecture patterns.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Zustand](https://img.shields.io/badge/Zustand-State%20Management-443E38)](https://github.com/pmndrs/zustand)
[![Web Workers](https://img.shields.io/badge/Web%20Workers-Enabled-orange)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

## Project Overview

The Frontend Performance Profiler is a sophisticated analysis tool that helps developers identify performance bottlenecks, accessibility issues, security vulnerabilities, and SEO problems in their web applications. The tool performs **100% client-side analysis** - no data ever leaves the user's browser, ensuring complete privacy and security.

### Why This Project?

This project demonstrates expertise in:

- **Advanced React Patterns**: Custom hooks, compound components, render optimization
- **TypeScript Architecture**: Complex type systems, generic patterns, strict type safety
- **Performance Engineering**: Web Workers, lazy loading, virtualization-ready components
- **State Management**: Zustand for global state with persistence and computed values
- **Data Visualization**: D3.js for custom charts and interactive visualizations
- **Code Quality**: 16 specialized analyzers covering performance, accessibility, SEO, and security

## Key Features

### 16 Specialized Analyzers

| Category         | Analyzer              | Description                                                 |
| ---------------- | --------------------- | ----------------------------------------------------------- |
| **Performance**  | Bundle Analyzer       | Treemap visualization, duplicate detection, vendor analysis |
| **Performance**  | Web Vitals            | LCP, FID, CLS, FCP, TTFB, INP estimation                    |
| **Performance**  | Network Analysis      | Resource hints, render-blocking detection                   |
| **Performance**  | Image Optimization    | Modern format detection, responsive image analysis          |
| **Performance**  | Font Loading          | font-display validation, preload suggestions                |
| **Performance**  | Memory Estimation     | Leak risk detection, closure analysis                       |
| **Performance**  | Import Cost           | Tree-shaking analysis, barrel file detection                |
| **Code Quality** | JavaScript Complexity | AST parsing, cyclomatic complexity                          |
| **Code Quality** | React Patterns        | Component size, inline functions, prop drilling             |
| **Code Quality** | TypeScript Quality    | Strict mode validation,`any` usage detection                |
| **Quality**      | Accessibility         | WCAG A/AA/AAA compliance checks                             |
| **Quality**      | SEO                   | Meta tags, Open Graph, structured data                      |
| **Quality**      | Security              | XSS detection, secrets scanning, SRI validation             |
| **Quality**      | Third-Party Scripts   | Performance impact, privacy analysis                        |
| **Structure**    | DOM Complexity        | Node count, depth analysis, lazy loading                    |
| **Structure**    | CSS Analysis          | Unused selectors, specificity issues                        |

### Developer Experience Features

- **22 Analysis Sections**: Comprehensive sidebar navigation with lazy-loaded components
- **Report Comparison**: Side-by-side diff mode with regression detection
- **Performance Budgets**: Configurable thresholds with CI/CD export
- **Multi-Format Export**: PDF, HTML, Markdown, and JSON report formats
- **Report History**: IndexedDB persistence with search, filter, and pinning
- **Keyboard Shortcuts**: Full keyboard navigation with help overlay
- **Dark/Light Theme**: System preference detection with manual toggle
- **Setup Wizard**: Onboarding experience for first-time users
- **Toast Notifications**: Non-blocking feedback system

## Architecture Highlights

### Web Worker Integration

Heavy analysis runs in dedicated Web Workers to maintain UI responsiveness:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   UI Thread │────▶│   Comlink   │────▶│  Analysis Worker│
│  (React App)│◀────│   (Proxy)   │◀────│  (Heavy Compute)│
└─────────────┘     └─────────────┘     └─────────────────┘
                                               │
                                               ▼
                                        ┌─────────────────┐
                                        │  Analyzer Chain │
                                        │  (16 Analyzers) │
                                        └─────────────────┘
```

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

### State Management Architecture

Zustand stores with computed values and persistence:

```typescript
// Analysis Store with IndexedDB persistence
interface AnalysisState {
  currentReport: AnalysisReport | null;
  history: AnalysisReport[];
  pinnedReports: PinnedReport[];
  filters: HistoryFilters;
  // ... actions
}

// Budget Store with validation
interface BudgetState {
  budget: PerformanceBudget;
  status: BudgetStatus[];
  alerts: BudgetAlert[];
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

## Technical Stack

### Core Technologies

| Technology      | Purpose          | Version |
| --------------- | ---------------- | ------- |
| React           | UI Framework     | 19.x    |
| TypeScript      | Type Safety      | 5.x     |
| Vite            | Build Tool       | 7.x     |
| TanStack Router | Routing          | 1.x     |
| Zustand         | State Management | 5.x     |
| TanStack Query  | Server State     | 5.x     |

### Analysis & Parsing

| Library     | Purpose                  |
| ----------- | ------------------------ |
| Acorn       | JavaScript AST Parsing   |
| htmlparser2 | HTML Parsing             |
| PostCSS     | CSS Analysis             |
| D3.js       | Data Visualization       |
| Comlink     | Web Worker Communication |

### Export & Utilities

| Library       | Purpose            |
| ------------- | ------------------ |
| jsPDF         | PDF Generation     |
| html2canvas   | Screenshot Capture |
| marked        | Markdown Export    |
| date-fns      | Date Formatting    |
| zod           | Schema Validation  |
| idb-keyval    | IndexedDB Wrapper  |
| framer-motion | UI Animations      |

## Project Structure

```
src/
├── app/
│   └── router/              # TanStack Router configuration
├── components/
│   ├── charts/              # D3.js visualizations
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── ScoreGauge.tsx
│   │   ├── TimelineChart.tsx
│   │   └── Treemap.tsx
│   ├── layout/              # Application shell
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx      # 22 navigation sections
│   │   └── types.ts
│   ├── report/              # Analysis section components
│   │   ├── OverviewSection.tsx
│   │   ├── BundleSection.tsx
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
│   │   └── ... (10 more)
│   ├── compare/             # Report comparison
│   ├── export/              # Export dialogs
│   ├── settings/            # Budget configuration
│   └── ui/                  # Shared UI components
│       ├── NotificationContainer.tsx
│       ├── ThemeToggle.tsx
│       ├── KeyboardShortcutsHelp.tsx
│       └── SetupWizard.tsx
├── core/
│   ├── analyzers/           # 16 analysis modules
│   │   ├── bundle.ts
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
│   │   ├── imports.ts
│   │   └── ... (4 more)
│   ├── parsers/             # File parsers
│   ├── pipeline/            # Analysis orchestration
│   └── scoring/             # Scoring algorithms
├── stores/                  # Zustand state management
│   ├── analysisStore.ts     # Report history, persistence
│   ├── budgetStore.ts       # Performance budgets
│   ├── comparisonStore.ts   # Report comparison
│   ├── notificationStore.ts # Toast notifications
│   ├── setupStore.ts        # First-run wizard
│   └── themeStore.ts        # Theme management
├── hooks/                   # Custom React hooks
│   ├── useKeyboardShortcuts.ts
│   ├── usePersistentStorage.ts
│   └── useFileUpload.ts
├── types/                   # TypeScript definitions
│   └── index.ts             # 40+ interfaces
├── utils/                   # Utility functions
│   └── export.ts            # PDF/HTML/Markdown export
└── workers/                 # Web Workers
    └── analysis.worker.ts
```

## Getting Started

### Prerequisites

- Node.js 20+
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
```

### Deployment

The application is configured for static hosting:

**Netlify**: Configuration included in `netlify.toml`

- Build command: `pnpm build`
- Publish directory: `dist`

**Vercel**:

- Framework preset: Vite
- Build command: `pnpm build`
- Output directory: `dist`

## Usage Guide

### Analyzing a Project

1. **Upload Files**: Drag and drop or select files (HTML, JS, CSS, React build)
2. **Configure Analysis**: Toggle specific analyzers based on your needs
3. **Run Analysis**: Click "Analyze Performance" - processing happens in Web Workers
4. **Review Results**: Navigate through 22 analysis sections via the sidebar
5. **Export Report**: Save as PDF, HTML, Markdown, or JSON

### Keyboard Shortcuts

| Shortcut       | Action               |
| -------------- | -------------------- |
| `Cmd/Ctrl + K` | Open command palette |
| `↑ / ↓`        | Navigate sections    |
| `R`            | Re-run analysis      |
| `E`            | Export report        |
| `?`            | Show keyboard help   |
| `Esc`          | Close modal/dialog   |

### Performance Budgets

Set thresholds for key metrics:

- Bundle size limits
- Image optimization targets
- DOM complexity limits
- Score minimums

Export budgets as `.performance-budget.json` for CI/CD integration.

## Technical Challenges & Solutions

### Challenge 1: Client-Side Analysis Performance

**Problem**: Parsing large JavaScript bundles and HTML files can block the UI thread.

**Solution**: Implemented Web Workers with Comlink for seamless communication. Heavy analysis runs in a separate thread, maintaining 60fps UI responsiveness even with large files.

### Challenge 2: Type Safety Across Analyzers

**Problem**: 16 different analyzers with varying input/output types needed a unified interface.

**Solution**: Created a generic `Analyzer<T>` interface with consistent methods for analysis, scoring, and recommendations. TypeScript's conditional types ensure type safety throughout the pipeline.

### Challenge 3: Report History Persistence

**Problem**: localStorage has 5MB limit, insufficient for storing multiple reports.

**Solution**: Used IndexedDB via `idb-keyval` for unlimited storage. Implemented smart cleanup that preserves pinned reports while removing old unpinned ones.

### Challenge 4: Real-time Scoring Updates

**Problem**: Overall score depends on 9 weighted categories that update independently.

**Solution**: Zustand computed values automatically recalculate overall score when any category changes. Memoization prevents unnecessary re-renders.

### Challenge 5: Export Format Flexibility

**Problem**: Need to support PDF, HTML, and Markdown exports with consistent styling.

**Solution**: Created a unified export pipeline that transforms report data through format-specific adapters. HTML2Canvas captures report screenshots for PDF embedding.

## Performance Metrics

| Metric              | Value                   |
| ------------------- | ----------------------- |
| Initial Bundle      | ~550KB (gzipped: 154KB) |
| Web Worker          | ~305KB                  |
| Time to Interactive | < 2s on 4G              |
| Analysis Throughput | ~10MB/s (worker-bound)  |
| Lighthouse Score    | 95+ (Performance)       |

## Key Learnings

This project reinforced several important software engineering principles:

1. **Modularity Pays Off**: The analyzer plugin architecture made adding 16 analyzers straightforward
2. **Type Safety is Worth It**: TypeScript caught numerous bugs during development and refactoring
3. **Performance is a Feature**: Web Workers transformed the UX from sluggish to responsive
4. **State Management Matters**: Zustand's simplicity with persistence hooks saved significant boilerplate
5. **Privacy by Design**: Client-side only analysis is a compelling differentiator

## License

MIT - See [LICENSE](./LICENSE) for details.

---

**Built with modern web technologies. No data leaves your browser.**
