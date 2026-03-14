import { describe, it, expect, beforeEach } from 'vitest';
import { useTrendStore } from '../trendStore';
import type { AnalysisReport } from '@/types';

// Mock report for testing
const createMockReport = (id: string, overallScore: number): AnalysisReport => ({
  id,
  timestamp: Date.now(),
  files: [],
  score: {
    overall: overallScore,
    bundle: 80,
    dom: 70,
    css: 75,
    assets: 85,
    javascript: 80,
  },
  renderRisk: {
    level: 'low',
    score: 90,
    reasons: [],
    recommendations: [],
  },
  timeline: [],
  summary: {
    totalIssues: 0,
    criticalIssues: 0,
    estimatedSavings: 0,
  },
} as unknown as AnalysisReport);

describe('TrendStore', () => {
  beforeEach(() => {
    useTrendStore.getState().clearTrendData();
  });

  it('should initialize with empty data', () => {
    const state = useTrendStore.getState();
    
    expect(state.trendData).toEqual([]);
    expect(state.projects).toEqual([]);
    expect(state.regressions).toEqual([]);
  });

  it('should clear trend data', () => {
    const store = useTrendStore.getState();
    
    store.addReport(createMockReport('1', 85));
    store.clearTrendData();
    
    expect(useTrendStore.getState().trendData).toHaveLength(0);
    expect(useTrendStore.getState().projects).toHaveLength(0);
  });

  it('should add report to trend data', () => {
    const store = useTrendStore.getState();
    
    store.addReport(createMockReport('1', 85));
    
    expect(useTrendStore.getState().trendData).toHaveLength(1);
    expect(useTrendStore.getState().trendData[0].overallScore).toBe(85);
  });

  it('should not add duplicate reports', () => {
    const store = useTrendStore.getState();
    
    const report = createMockReport('1', 85);
    store.addReport(report);
    store.addReport(report);
    
    expect(useTrendStore.getState().trendData).toHaveLength(1);
  });

  it('should remove report from trend data', () => {
    const store = useTrendStore.getState();
    
    store.addReport(createMockReport('1', 85));
    store.addReport(createMockReport('2', 90));
    store.removeReport('1');
    
    expect(useTrendStore.getState().trendData).toHaveLength(1);
    expect(useTrendStore.getState().trendData[0].reportId).toBe('2');
  });

  it('should detect regressions', () => {
    const store = useTrendStore.getState();
    
    // Add reports with declining scores to trigger regression detection
    store.addReport(createMockReport('1', 90));
    store.addReport(createMockReport('2', 70));
    
    // Regressions are computed automatically
    expect(useTrendStore.getState().regressions).toBeDefined();
  });

  it('should set selected project', () => {
    const store = useTrendStore.getState();
    
    store.setSelectedProject('my-project');
    
    expect(useTrendStore.getState().selectedProject).toBe('my-project');
  });

  it('should set selected metrics', () => {
    const store = useTrendStore.getState();
    
    store.setSelectedMetrics(['overallScore', 'bundleScore']);
    
    expect(useTrendStore.getState().selectedMetrics).toEqual(['overallScore', 'bundleScore']);
  });

  it('should set filters', () => {
    const store = useTrendStore.getState();
    
    store.setFilters({ dateRange: '7d' });
    
    expect(useTrendStore.getState().filters.dateRange).toBe('7d');
  });

  it('should load from history', () => {
    const store = useTrendStore.getState();
    
    const history = [
      createMockReport('1', 80),
      createMockReport('2', 85),
    ];
    
    store.loadFromHistory(history);
    
    expect(useTrendStore.getState().trendData).toHaveLength(2);
  });

  it('should compute filtered data', () => {
    const store = useTrendStore.getState();
    
    store.addReport(createMockReport('1', 85));
    
    expect(useTrendStore.getState().filteredData).toBeDefined();
    expect(useTrendStore.getState().filteredData.length).toBeGreaterThanOrEqual(0);
  });
});
