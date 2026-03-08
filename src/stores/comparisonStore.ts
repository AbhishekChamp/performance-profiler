import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AnalysisReport, ReportComparison, MetricDiff } from '@/types';

interface ComparisonState {
  // Comparison state
  baseline: AnalysisReport | null;
  current: AnalysisReport | null;
  comparison: ReportComparison | null;
  
  // Actions
  setBaseline: (report: AnalysisReport) => void;
  setCurrent: (report: AnalysisReport) => void;
  clearComparison: () => void;
  generateComparison: () => void;
  swapReports: () => void;
}

function calculateMetricDiff(before: number, after: number): MetricDiff {
  const delta = after - before;
  const percentageChange = before !== 0 ? (delta / before) * 100 : 0;
  
  return {
    before,
    after,
    delta,
    percentageChange: Math.round(percentageChange * 100) / 100,
  };
}

export const useComparisonStore = create<ComparisonState>()(
  devtools(
    (setState, getState) => ({
      // Initial state
      baseline: null,
      current: null,
      comparison: null,

      // Actions
      setBaseline: (report) => {
        setState({ baseline: report });
        getState().generateComparison();
      },

      setCurrent: (report) => {
        setState({ current: report });
        getState().generateComparison();
      },

      clearComparison: () => {
        setState({
          baseline: null,
          current: null,
          comparison: null,
        });
      },

      generateComparison: () => {
        const { baseline, current } = getState();
        
        if (!baseline || !current) {
          setState({ comparison: null });
          return;
        }

        const changes: ReportComparison['changes'] = {
          overall: calculateMetricDiff(baseline.score.overall, current.score.overall),
        };

        if (baseline.bundle && current.bundle) {
          changes.bundle = calculateMetricDiff(
            baseline.bundle.totalSize,
            current.bundle.totalSize
          );
        }

        if (baseline.dom && current.dom) {
          changes.dom = calculateMetricDiff(
            baseline.dom.totalNodes,
            current.dom.totalNodes
          );
        }

        if (baseline.css && current.css) {
          changes.css = calculateMetricDiff(
            baseline.css.totalRules,
            current.css.totalRules
          );
        }

        if (baseline.assets && current.assets) {
          changes.assets = calculateMetricDiff(
            baseline.assets.breakdown.total,
            current.assets.breakdown.total
          );
        }

        if (baseline.webVitals && current.webVitals) {
          changes.webVitals = calculateMetricDiff(
            baseline.webVitals.overallScore,
            current.webVitals.overallScore
          );
        }

        if (baseline.accessibility && current.accessibility) {
          changes.accessibility = calculateMetricDiff(
            baseline.accessibility.score,
            current.accessibility.score
          );
        }

        if (baseline.seo && current.seo) {
          changes.seo = calculateMetricDiff(
            baseline.seo.score,
            current.seo.score
          );
        }

        if (baseline.security && current.security) {
          changes.security = calculateMetricDiff(
            baseline.security.score,
            current.security.score
          );
        }

        // Generate improvements and regressions
        const improvements: string[] = [];
        const regressions: string[] = [];

        if (changes.overall.delta > 5) {
          improvements.push(`Overall score improved by ${changes.overall.delta} points`);
        } else if (changes.overall.delta < -5) {
          regressions.push(`Overall score decreased by ${Math.abs(changes.overall.delta)} points`);
        }

        if (changes.bundle) {
          if (changes.bundle.delta < 0) {
            improvements.push(`Bundle size reduced by ${formatBytes(Math.abs(changes.bundle.delta))}`);
          } else if (changes.bundle.delta > 50 * 1024) {
            regressions.push(`Bundle size increased by ${formatBytes(changes.bundle.delta)}`);
          }
        }

        if (changes.dom) {
          if (changes.dom.delta < 0) {
            improvements.push(`DOM nodes reduced by ${Math.abs(changes.dom.delta)}`);
          } else if (changes.dom.delta > 100) {
            regressions.push(`DOM nodes increased by ${changes.dom.delta}`);
          }
        }

        const comparison: ReportComparison = {
          baseline,
          current,
          changes,
          improvements,
          regressions,
          timestamp: Date.now(),
        };

        setState({ comparison });
      },

      swapReports: () => {
        const { baseline, current } = getState();
        setState({
          baseline: current,
          current: baseline,
        });
        getState().generateComparison();
      },
    }),
    { name: 'ComparisonStore' }
  )
);

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Selectors
export const selectComparison = (state: ComparisonState) => state.comparison;
export const selectBaseline = (state: ComparisonState) => state.baseline;
export const selectCurrentCompare = (state: ComparisonState) => state.current;
