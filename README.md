# Frontend Performance Profiler

A browser-based developer tool that analyzes uploaded HTML files, JavaScript bundles, and React builds to generate a Lighthouse-style performance audit report.

![Performance Score](https://img.shields.io/badge/performance-analyzer-blue)
![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20TypeScript%20%2B%20Vite-green)
![Build](https://img.shields.io/badge/build-Vite-orange)

## Features

### Analyzers

- **Bundle Analyzer**: Treemap visualization, duplicate library detection, vendor size analysis
- **DOM Complexity Analyzer**: Node count, depth analysis, lazy loading detection
- **CSS Analyzer**: Unused selectors, inline styles, !important usage
- **Asset Weight Report**: Distribution visualization by type (JS, CSS, images, fonts)
- **JavaScript Complexity Analyzer**: AST parsing, cyclomatic complexity, nested loops
- **React Anti-Pattern Detector**: Component size, inline functions, excessive props
- **Rendering Risk Predictor**: Composite risk score with recommendations
- **Performance Timeline Simulation**: Visual page load phase analysis

### Scoring Engine

Weighted algorithm calculating overall performance score:
- Bundle Score: 35%
- DOM Score: 25%
- CSS Score: 15%
- Asset Score: 15%
- JavaScript Score: 10%

## Tech Stack

- **Framework**: React 19 + TypeScript 5
- **Build**: Vite 7
- **Routing**: TanStack Router
- **State**: Zustand
- **Data**: TanStack Query
- **Charts**: D3.js
- **Parsing**: Acorn (JS), htmlparser2 (HTML), PostCSS (CSS)
- **Workers**: Web Workers + Comlink
- **Styling**: TailwindCSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd frontend-performance-profiler

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Build

```bash
# Production build
pnpm build

# Preview production build
pnpm preview
```

### Lint

```bash
pnpm lint
```

## Project Structure

```
src/
├── app/
│   └── router/          # TanStack Router configuration
├── components/
│   ├── charts/          # D3.js visualizations
│   ├── layout/          # Header, Sidebar, panels
│   ├── report/          # Report section components
│   └── upload/          # File upload component
├── core/
│   ├── analyzers/       # Analysis modules
│   ├── parsers/         # File parsers
│   ├── pipeline/        # Analysis orchestration
│   └── scoring/         # Scoring algorithms
├── features/            # Feature-specific code
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── types/               # TypeScript types
├── utils/               # Utility functions
└── workers/             # Web Workers
```

## Usage

1. Open the application in your browser
2. Drag and drop files (HTML, JS, CSS, or React build folder)
3. Click "Analyze Performance"
4. Navigate through analysis sections using the sidebar
5. Export report as JSON for sharing

## Supported File Types

- HTML files (.html)
- JavaScript/TypeScript (.js, .jsx, .ts, .tsx, .mjs)
- CSS/SCSS (.css, .scss, .sass, .less)
- JSON configuration files

## Deployment

### Netlify

1. Connect your repository to Netlify
2. Build command: `pnpm build`
3. Publish directory: `dist`

Configuration is provided in `netlify.toml`.

## Architecture

### Web Workers

Heavy analysis runs in Web Workers to prevent UI blocking:

```
UI Thread → Worker (Comlink) → Analyzer Pipeline → Report
```

### Analysis Pipeline

```
Upload → Parser → Analyzer Modules → Metrics → Scoring → Report
```

## License

MIT
