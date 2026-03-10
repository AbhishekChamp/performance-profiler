import type { 
  AnalysisReport, 
  TrendDataPoint, 
  TrendSeries, 
  TrendSummary, 
  RegressionPoint,
  ProjectTrend,
  TrendFilters 
} from '@/types';

/**
 * Convert an AnalysisReport to a TrendDataPoint
 */
export function reportToTrendData(report: AnalysisReport): TrendDataPoint {
  return {
    timestamp: report.timestamp,
    reportId: report.id,
    projectName: report.files[0]?.name || 'Unknown Project',
    overallScore: report.score.overall,
    bundleScore: report.score.bundle,
    domScore: report.score.dom,
    cssScore: report.score.css,
    assetsScore: report.score.assets,
    javascriptScore: report.score.javascript,
    webVitalsScore: report.score.webVitals,
    accessibilityScore: report.score.accessibility,
    seoScore: report.score.seo,
    securityScore: report.score.security,
    totalIssues: report.summary.totalIssues,
    criticalIssues: report.summary.criticalIssues,
    bundleSize: report.bundle?.totalSize,
    domNodes: report.dom?.totalNodes,
    cssSize: report.css?.totalRules,
    jsSize: report.javascript?.reduce((sum, f) => sum + f.size, 0),
    imageSize: report.images?.totalSize,
  };
}

/**
 * Group reports by project name
 */
export function groupReportsByProject(reports: AnalysisReport[]): Map<string, AnalysisReport[]> {
  const groups = new Map<string, AnalysisReport[]>();
  
  reports.forEach(report => {
    const projectName = report.files[0]?.name || 'Unknown Project';
    if (!groups.has(projectName)) {
      groups.set(projectName, []);
    }
    groups.get(projectName)!.push(report);
  });
  
  return groups;
}

/**
 * Create trend series data for a specific metric
 */
export function createTrendSeries(
  data: TrendDataPoint[],
  metric: keyof TrendDataPoint,
  label: string,
  color: string
): TrendSeries | null {
  const seriesData = data
    .filter(point => point[metric] !== undefined && point[metric] !== null)
    .map(point => ({
      x: point.timestamp,
      y: point[metric] as number,
    }));
  
  if (seriesData.length === 0) return null;
  
  return {
    metric,
    label,
    color,
    data: seriesData,
  };
}

/**
 * Calculate trend summary from data points
 */
export function calculateTrendSummary(data: TrendDataPoint[]): TrendSummary {
  if (data.length === 0) {
    return {
      startDate: Date.now(),
      endDate: Date.now(),
      totalReports: 0,
      averageScore: 0,
      trendDirection: 'stable',
      improvementRate: 0,
      bestScore: { value: 0, timestamp: Date.now() },
      worstScore: { value: 0, timestamp: Date.now() },
      regressions: [],
    };
  }
  
  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
  const scores = sorted.map(d => d.overallScore);
  
  // Calculate average
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Find best and worst
  const bestScore = Math.max(...scores);
  const worstScore = Math.min(...scores);
  const bestPoint = sorted.find(d => d.overallScore === bestScore)!;
  const worstPoint = sorted.find(d => d.overallScore === worstScore)!;
  
  // Calculate trend direction
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  let trendDirection: 'improving' | 'declining' | 'stable';
  const change = secondAvg - firstAvg;
  if (change > 5) trendDirection = 'improving';
  else if (change < -5) trendDirection = 'declining';
  else trendDirection = 'stable';
  
  // Calculate improvement rate (points per week)
  const timeSpan = sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
  const weeks = timeSpan / (7 * 24 * 60 * 60 * 1000);
  const totalChange = scores[scores.length - 1] - scores[0];
  const improvementRate = weeks > 0 ? totalChange / weeks : 0;
  
  // Detect regressions
  const regressions = detectRegressions(sorted);
  
  return {
    startDate: sorted[0].timestamp,
    endDate: sorted[sorted.length - 1].timestamp,
    totalReports: data.length,
    averageScore: Math.round(averageScore),
    trendDirection,
    improvementRate: Math.round(improvementRate * 10) / 10,
    bestScore: { value: bestScore, timestamp: bestPoint.timestamp },
    worstScore: { value: worstScore, timestamp: worstPoint.timestamp },
    regressions,
  };
}

/**
 * Detect regression points in trend data
 */
export function detectRegressions(data: TrendDataPoint[]): RegressionPoint[] {
  const regressions: RegressionPoint[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    
    // Check overall score regression
    const scoreDrop = previous.overallScore - current.overallScore;
    if (scoreDrop >= 10) {
      regressions.push({
        timestamp: current.timestamp,
        metric: 'overallScore',
        previousValue: previous.overallScore,
        currentValue: current.overallScore,
        delta: -scoreDrop,
        percentageChange: -(scoreDrop / previous.overallScore) * 100,
        severity: scoreDrop >= 20 ? 'critical' : 'warning',
        message: `Overall score dropped by ${scoreDrop} points`,
      });
    }
    
    // Check bundle size regression
    if (previous.bundleSize && current.bundleSize) {
      const sizeIncrease = current.bundleSize - previous.bundleSize;
      const percentageIncrease = (sizeIncrease / previous.bundleSize) * 100;
      
      if (percentageIncrease >= 20) {
        regressions.push({
          timestamp: current.timestamp,
          metric: 'bundleSize',
          previousValue: previous.bundleSize,
          currentValue: current.bundleSize,
          delta: sizeIncrease,
          percentageChange: percentageIncrease,
          severity: percentageIncrease >= 50 ? 'critical' : 'warning',
          message: `Bundle size increased by ${Math.round(percentageIncrease)}%`,
        });
      }
    }
    
    // Check critical issues regression
    const issueIncrease = current.criticalIssues - previous.criticalIssues;
    if (issueIncrease > 0) {
      regressions.push({
        timestamp: current.timestamp,
        metric: 'criticalIssues',
        previousValue: previous.criticalIssues,
        currentValue: current.criticalIssues,
        delta: issueIncrease,
        percentageChange: previous.criticalIssues > 0 
          ? (issueIncrease / previous.criticalIssues) * 100 
          : 100,
        severity: issueIncrease >= 3 ? 'critical' : 'warning',
        message: `${issueIncrease} new critical issue${issueIncrease > 1 ? 's' : ''} detected`,
      });
    }
  }
  
  return regressions;
}

/**
 * Filter trend data based on filters
 */
export function filterTrendData(
  data: TrendDataPoint[],
  filters: TrendFilters
): TrendDataPoint[] {
  let filtered = [...data];
  
  // Filter by date range
  if (filters.dateRange !== 'all') {
    const now = Date.now();
    let cutoff = now;
    
    switch (filters.dateRange) {
      case '7d':
        cutoff = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        cutoff = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90d':
        cutoff = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case 'custom':
        if (filters.startDate) {
          filtered = filtered.filter(d => d.timestamp >= filters.startDate!);
        }
        if (filters.endDate) {
          filtered = filtered.filter(d => d.timestamp <= filters.endDate!);
        }
        break;
    }
    
    if (filters.dateRange !== 'custom') {
      filtered = filtered.filter(d => d.timestamp >= cutoff);
    }
  }
  
  // Filter by project name
  if (filters.projectName) {
    filtered = filtered.filter(d => 
      d.projectName.toLowerCase().includes(filters.projectName!.toLowerCase())
    );
  }
  
  // Filter by branch
  if (filters.branch) {
    filtered = filtered.filter(d => d.branch === filters.branch);
  }
  
  return filtered.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Export trend data as CSV
 */
export function exportTrendDataAsCSV(data: TrendDataPoint[]): string {
  const headers = [
    'Date',
    'Project',
    'Overall Score',
    'Bundle Score',
    'DOM Score',
    'CSS Score',
    'Assets Score',
    'JS Score',
    'Web Vitals',
    'Accessibility',
    'SEO',
    'Security',
    'Total Issues',
    'Critical Issues',
    'Bundle Size (KB)',
    'DOM Nodes',
  ].join(',');
  
  const rows = data.map(point => [
    new Date(point.timestamp).toISOString(),
    `"${point.projectName}"`,
    point.overallScore,
    point.bundleScore ?? '',
    point.domScore ?? '',
    point.cssScore ?? '',
    point.assetsScore ?? '',
    point.javascriptScore ?? '',
    point.webVitalsScore ?? '',
    point.accessibilityScore ?? '',
    point.seoScore ?? '',
    point.securityScore ?? '',
    point.totalIssues,
    point.criticalIssues,
    point.bundleSize ? Math.round(point.bundleSize / 1024) : '',
    point.domNodes ?? '',
  ].join(','));
  
  return [headers, ...rows].join('\n');
}

/**
 * Get available metrics for trend analysis
 */
export function getAvailableMetrics(): { key: string; label: string; color: string }[] {
  return [
    { key: 'overallScore', label: 'Overall Score', color: '#58a6ff' },
    { key: 'bundleScore', label: 'Bundle', color: '#f0883e' },
    { key: 'domScore', label: 'DOM', color: '#3fb950' },
    { key: 'cssScore', label: 'CSS', color: '#a371f7' },
    { key: 'assetsScore', label: 'Assets', color: '#d29922' },
    { key: 'javascriptScore', label: 'JavaScript', color: '#f778ba' },
    { key: 'webVitalsScore', label: 'Web Vitals', color: '#58a6ff' },
    { key: 'accessibilityScore', label: 'Accessibility', color: '#3fb950' },
    { key: 'seoScore', label: 'SEO', color: '#79c0ff' },
    { key: 'securityScore', label: 'Security', color: '#f85149' },
    { key: 'totalIssues', label: 'Total Issues', color: '#d29922' },
    { key: 'criticalIssues', label: 'Critical Issues', color: '#f85149' },
  ];
}

/**
 * Sample data for large datasets
 */
export function sampleData(data: TrendDataPoint[], maxPoints: number = 100): TrendDataPoint[] {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  const sampled: TrendDataPoint[] = [];
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }
  
  // Always include the last point
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }
  
  return sampled;
}

/**
 * Format trend direction with emoji/icon
 */
export function formatTrendDirection(direction: 'improving' | 'declining' | 'stable'): {
  label: string;
  icon: string;
  color: string;
} {
  switch (direction) {
    case 'improving':
      return { label: 'Improving', icon: '↗️', color: '#3fb950' };
    case 'declining':
      return { label: 'Declining', icon: '↘️', color: '#f85149' };
    case 'stable':
      return { label: 'Stable', icon: '→', color: '#8b949e' };
  }
}

/**
 * Create a ProjectTrend from reports
 */
export function createProjectTrend(
  projectName: string,
  reports: AnalysisReport[]
): ProjectTrend {
  const trendData = reports.map(reportToTrendData);
  const summary = calculateTrendSummary(trendData);
  
  return {
    projectName,
    reports: trendData,
    summary,
  };
}
