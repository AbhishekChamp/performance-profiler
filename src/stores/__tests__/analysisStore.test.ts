import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalysisStore } from '../analysisStore';
import type { AnalysisReport } from '@/types';

describe('analysisStore', () => {
  beforeEach(() => {
    const store = useAnalysisStore.getState();
    store.reset();
    store.clearHistory();
  });

  it('should have correct initial state', () => {
    const state = useAnalysisStore.getState();
    
    expect(state.currentReport).toBeNull();
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
    expect(state.history).toEqual([]);
    expect(state.pinnedReports).toEqual([]);
  });

  it('should set status', () => {
    const store = useAnalysisStore.getState();
    
    store.setStatus('analyzing');
    expect(useAnalysisStore.getState().status).toBe('analyzing');
  });

  it('should set error', () => {
    const store = useAnalysisStore.getState();
    
    store.setError('Test error');
    expect(useAnalysisStore.getState().error).toBe('Test error');
  });

  it('should set report and update status', () => {
    const store = useAnalysisStore.getState();
    const mockReport: AnalysisReport = {
      id: 'test-123',
      timestamp: Date.now(),
      files: [],
      score: {
        overall: 85,
        bundle: 80,
        dom: 90,
        css: 85,
        assets: 88,
        javascript: 82,
      },
      renderRisk: {
        level: 'low',
        score: 20,
        reasons: [],
        recommendations: [],
      },
      timeline: {
        events: [],
        totalTime: 100,
        criticalPath: [],
      },
      summary: {
        totalIssues: 5,
        criticalIssues: 0,
        warnings: 5,
        optimizations: [],
      },
    };

    store.setReport(mockReport);
    
    const state = useAnalysisStore.getState();
    expect(state.currentReport).toEqual(mockReport);
    expect(state.status).toBe('complete');
  });

  it('should add report to history', () => {
    const store = useAnalysisStore.getState();
    const mockReport = createMockReport('test-123');

    store.addToHistory(mockReport);
    
    expect(useAnalysisStore.getState().history).toContain(mockReport);
  });

  it('should not add duplicate reports to history', () => {
    const store = useAnalysisStore.getState();
    const mockReport = createMockReport('test-123');

    store.addToHistory(mockReport);
    store.addToHistory(mockReport);
    
    expect(useAnalysisStore.getState().history).toHaveLength(1);
  });

  it('should pin and unpin reports', () => {
    const store = useAnalysisStore.getState();
    
    store.pinReport('report-1');
    expect(useAnalysisStore.getState().pinnedReports).toHaveLength(1);
    expect(useAnalysisStore.getState().isPinned('report-1')).toBe(true);
    
    store.unpinReport('report-1');
    expect(useAnalysisStore.getState().pinnedReports).toHaveLength(0);
    expect(useAnalysisStore.getState().isPinned('report-1')).toBe(false);
  });

  it('should update options', () => {
    const store = useAnalysisStore.getState();
    
    store.updateOptions({ includeBundle: false });
    
    expect(useAnalysisStore.getState().options.includeBundle).toBe(false);
  });

  it('should reset to initial state', () => {
    const store = useAnalysisStore.getState();
    
    store.setStatus('analyzing');
    store.setError('test error');
    store.reset();
    
    const state = useAnalysisStore.getState();
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });
});

function createMockReport(id: string): AnalysisReport {
  return {
    id,
    timestamp: Date.now(),
    files: [],
    score: {
      overall: 85,
      bundle: 80,
      dom: 90,
      css: 85,
      assets: 88,
      javascript: 82,
    },
    renderRisk: {
      level: 'low',
      score: 20,
      reasons: [],
      recommendations: [],
    },
    timeline: {
      events: [],
      totalTime: 100,
      criticalPath: [],
    },
    summary: {
      totalIssues: 5,
      criticalIssues: 0,
      warnings: 5,
      optimizations: [],
    },
  };
}
