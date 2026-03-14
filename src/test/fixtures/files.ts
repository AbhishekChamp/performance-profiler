import type { AnalyzedFile, AnalysisReport } from '@/types';

export const mockHtmlFile: AnalyzedFile = {
  name: 'index.html',
  type: 'html',
  size: 2500,
  content: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Page</title>
  <link rel="stylesheet" href="styles.css">
  <script src="app.js" defer></script>
</head>
<body>
  <div id="root">
    <h1>Test Page</h1>
    <p>This is a test paragraph with some content.</p>
    <img src="image.jpg" alt="Test image" width="800" height="600" loading="lazy">
    <div class="nested">
      <div class="deep">
        <div class="nesting">
          <span>Deep nesting</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim(),
};

export const mockJsFile: AnalyzedFile = {
  name: 'app.js',
  type: 'javascript',
  size: 5000,
  content: `
import React from 'react';
import ReactDOM from 'react-dom';

// Unused variable
const unusedVar = 'test';

// Complex function
function calculateSomething(a, b, c) {
  if (a > 0) {
    if (b > 0) {
      if (c > 0) {
        return a + b + c;
      }
    }
  }
  return 0;
}

// Nested loops
function processData(data) {
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      for (let k = 0; k < data[i][j].length; k++) {
        console.log(data[i][j][k]);
      }
    }
  }
}

// Large function
function largeFunction() {
  const a = 1;
  const b = 2;
  const c = 3;
  const d = 4;
  const e = 5;
  const f = 6;
  const g = 7;
  const h = 8;
  const i = 9;
  const j = 10;
  const k = 11;
  const l = 12;
  const m = 13;
  const n = 14;
  const o = 15;
  const p = 16;
  const q = 17;
  const r = 18;
  const s = 19;
  const t = 20;
  const u = 21;
  const v = 22;
  const w = 23;
  const x = 24;
  const y = 25;
  const z = 26;
  return a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r + s + t + u + v + w + x + y + z;
}

// Eval usage (security issue)
eval('console.log("test")');

class MyComponent extends React.Component {
  render() {
    return React.createElement('div', null, 'Hello');
  }
}

ReactDOM.render(
  React.createElement(MyComponent),
  document.getElementById('root')
);
  `.trim(),
};

export const mockCssFile: AnalyzedFile = {
  name: 'styles.css',
  type: 'css',
  size: 1500,
  content: `
/* Global styles */
body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}

/* Header styles */
.header {
  background: #333;
  color: white;
  padding: 1rem;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
}

/* Unused selector */
.unused-class {
  display: none;
}

/* Another unused selector */
.another-unused {
  color: red !important;
  background: blue !important;
}

/* Inline style simulation */
#root {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Nested selectors */
.nested .deep .nesting {
  padding: 10px;
  border: 1px solid #ccc;
}

/* Responsive */
@media (max-width: 768px) {
  .header h1 {
    font-size: 1.5rem;
  }
}
  `.trim(),
};

export const mockReport: Partial<AnalysisReport> = {
  id: 'test-report-123',
  timestamp: Date.now(),
  files: [mockHtmlFile, mockJsFile, mockCssFile],
  score: {
    overall: 75,
    bundle: 80,
    dom: 70,
    css: 65,
    assets: 85,
    javascript: 75,
  },
  summary: {
    totalIssues: 15,
    criticalIssues: 3,
    warnings: 12,
    optimizations: [],
  },
};
