import type { AnalysisReport } from '@/types';
import { jsPDF } from 'jspdf';

export type ExportFormat = 'json' | 'pdf' | 'html' | 'markdown';

export function exportReport(report: AnalysisReport, format: ExportFormat): void {
  switch (format) {
    case 'json':
      exportJSON(report);
      break;
    case 'pdf':
      exportPDF(report);
      break;
    case 'html':
      exportHTML(report);
      break;
    case 'markdown':
      exportMarkdown(report);
      break;
  }
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportJSON(report: AnalysisReport): void {
  const content = JSON.stringify(report, null, 2);
  downloadFile(content, `performance-report-${report.id}.json`, 'application/json');
}

async function exportPDF(report: AnalysisReport): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.text('Performance Analysis Report', pageWidth / 2, 20, { align: 'center' });
  
  // Date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date(report.timestamp).toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });
  
  // Overall Score
  doc.setFontSize(16);
  doc.text(`Overall Score: ${report.score.overall}/100`, 20, 50);
  
  // Risk Level
  doc.setFontSize(12);
  doc.text(`Risk Level: ${report.renderRisk.level.toUpperCase()}`, 20, 60);
  
  // Individual Scores
  doc.setFontSize(14);
  doc.text('Category Scores:', 20, 80);
  
  doc.setFontSize(10);
  let y = 90;
  const scores = [
    ['Bundle', report.score.bundle],
    ['DOM', report.score.dom],
    ['CSS', report.score.css],
    ['Assets', report.score.assets],
    ['JavaScript', report.score.javascript],
    ['Web Vitals', report.score.webVitals],
    ['Accessibility', report.score.accessibility],
    ['SEO', report.score.seo],
    ['Security', report.score.security],
  ];
  
  for (const [name, score] of scores) {
    if (score !== undefined) {
      doc.text(`${name}: ${score}/100`, 20, y);
      y += 8;
    }
  }
  
  // Summary
  y += 10;
  doc.setFontSize(14);
  doc.text('Summary:', 20, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.text(`Total Issues: ${report.summary.totalIssues}`, 20, y);
  y += 8;
  doc.text(`Critical Issues: ${report.summary.criticalIssues}`, 20, y);
  y += 8;
  doc.text(`Optimizations: ${report.summary.optimizations.length}`, 20, y);
  
  // Top Recommendations
  if (report.summary.optimizations.length > 0) {
    y += 15;
    doc.setFontSize(14);
    doc.text('Top Recommendations:', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    for (let i = 0; i < Math.min(5, report.summary.optimizations.length); i++) {
      const opt = report.summary.optimizations[i];
      const lines = doc.splitTextToSize(`${i + 1}. ${opt.title} (${opt.impact} impact) - ${opt.description}`, pageWidth - 40);
      doc.text(lines, 20, y);
      y += lines.length * 6 + 5;
      
      // Add new page if needed
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
  }
  
  // Save
  doc.save(`performance-report-${report.id}.pdf`);
}

function exportHTML(report: AnalysisReport): void {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Report - ${report.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #1a73e8; margin-bottom: 10px; }
    .meta { color: #666; margin-bottom: 30px; }
    .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .score-card { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #1a73e8; }
    .score-card h3 { font-size: 14px; color: #666; margin-bottom: 5px; }
    .score-card .value { font-size: 24px; font-weight: bold; color: #1a73e8; }
    .score-card.good { border-left-color: #34a853; }
    .score-card.good .value { color: #34a853; }
    .score-card.warning { border-left-color: #fbbc04; }
    .score-card.warning .value { color: #fbbc04; }
    .score-card.danger { border-left-color: #ea4335; }
    .score-card.danger .value { color: #ea4335; }
    h2 { color: #333; margin: 30px 0 15px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }
    .recommendation { background: #e8f0fe; padding: 15px; margin-bottom: 10px; border-radius: 6px; }
    .recommendation h4 { color: #1a73e8; margin-bottom: 5px; }
    .recommendation p { color: #666; font-size: 14px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-high { background: #fce8e8; color: #d93025; }
    .badge-medium { background: #fef3e8; color: #f9ab00; }
    .badge-low { background: #e8f5e9; color: #34a853; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Performance Analysis Report</h1>
    <p class="meta">Generated: ${new Date(report.timestamp).toLocaleString()} | ID: ${report.id}</p>
    
    <div class="score-grid">
      <div class="score-card ${getScoreClass(report.score.overall)}">
        <h3>Overall Score</h3>
        <div class="value">${report.score.overall}/100</div>
      </div>
      ${Object.entries(report.score).filter(([k]) => k !== 'overall').map(([key, value]) => value !== undefined ? `
      <div class="score-card ${getScoreClass(value)}">
        <h3>${key.charAt(0).toUpperCase() + key.slice(1)}</h3>
        <div class="value">${value}/100</div>
      </div>
      ` : '').join('')}
    </div>
    
    <h2>Summary</h2>
    <div class="score-grid">
      <div class="score-card">
        <h3>Total Issues</h3>
        <div class="value">${report.summary.totalIssues}</div>
      </div>
      <div class="score-card warning">
        <h3>Critical Issues</h3>
        <div class="value">${report.summary.criticalIssues}</div>
      </div>
      <div class="score-card good">
        <h3>Optimizations</h3>
        <div class="value">${report.summary.optimizations.length}</div>
      </div>
    </div>
    
    <h2>Top Recommendations</h2>
    ${report.summary.optimizations.slice(0, 10).map((opt, i) => `
    <div class="recommendation">
      <h4>${i + 1}. ${opt.title} <span class="badge badge-${opt.impact}">${opt.impact.toUpperCase()}</span></h4>
      <p>${opt.description}</p>
      ${opt.code ? `<pre><code>${escapeHtml(opt.code)}</code></pre>` : ''}
    </div>
    `).join('')}
  </div>
</body>
</html>`;

  downloadFile(html, `performance-report-${report.id}.html`, 'text/html');
}

function exportMarkdown(report: AnalysisReport): void {
  const md = `# Performance Analysis Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}  
**ID:** ${report.id}

---

## Overall Score: ${report.score.overall}/100

**Risk Level:** ${report.renderRisk.level.toUpperCase()}

---

## Category Scores

| Category | Score | Status |
|----------|-------|--------|
${Object.entries(report.score).filter(([k]) => k !== 'overall').map(([key, value]) => {
  if (value === undefined) return '';
  const status = value >= 70 ? '✅' : value >= 50 ? '⚠️' : '❌';
  return `| ${key.charAt(0).toUpperCase() + key.slice(1)} | ${value}/100 | ${status} |\n`;
}).join('')}

---

## Summary

- **Total Issues:** ${report.summary.totalIssues}
- **Critical Issues:** ${report.summary.criticalIssues}
- **Warnings:** ${report.summary.warnings}
- **Optimizations Available:** ${report.summary.optimizations.length}

---

## Top Recommendations

${report.summary.optimizations.slice(0, 10).map((opt, i) => `
### ${i + 1}. ${opt.title}

**Impact:** ${opt.impact}  
**Effort:** ${opt.effort}

${opt.description}

${opt.code ? `\`\`\`\n${opt.code}\n\`\`\`` : ''}
`).join('\n---\n')}

---

## Risk Factors

${report.renderRisk.reasons.map(reason => `- ${reason}`).join('\n')}

---

*Generated by Frontend Performance Profiler*
`;

  downloadFile(md, `performance-report-${report.id}.md`, 'text/markdown');
}

function getScoreClass(score: number): string {
  if (score >= 70) return 'good';
  if (score >= 50) return 'warning';
  return 'danger';
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Copy to clipboard
export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

// Format metrics for sharing
export function formatMetricsForSharing(report: AnalysisReport): string {
  return `📊 Performance Report

Overall Score: ${report.score.overall}/100
Risk Level: ${report.renderRisk.level}

Category Scores:
${Object.entries(report.score)
  .filter(([k, v]) => k !== 'overall' && v !== undefined)
  .map(([k, v]) => `- ${k}: ${v}/100`)
  .join('\n')}

Top Issues:
${report.summary.optimizations.slice(0, 3).map((opt, i) => `${i + 1}. ${opt.title}`).join('\n')}

#webperf #performance`;
}
