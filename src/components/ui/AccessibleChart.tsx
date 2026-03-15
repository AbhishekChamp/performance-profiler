/**
 * Accessible Chart Component
 * 
 * Provides screen reader accessible alternatives to visual charts
 * with data tables and ARIA labels.
 * 
 * @module components/ui/AccessibleChart
 */

import { useId } from 'react';
import type { ReactNode } from 'react';

interface AccessibleChartProps {
  /** Chart title */
  title: string;
  /** Chart description */
  description?: string;
  /** Chart visualization component */
  children: ReactNode;
  /** Data for accessible table view */
  data: Array<Record<string, string | number>>;
  /** Column headers */
  columns: Array<{ key: string; label: string }>;
  /** Summary text for screen readers */
  summary?: string;
  /** Show data table visually */
  showDataTable?: boolean;
}

/**
 * Accessible wrapper for charts with screen reader support
 */
export function AccessibleChart({
  title,
  description,
  children,
  data,
  columns,
  summary,
  showDataTable = false,
}: AccessibleChartProps): React.JSX.Element {
  const chartId = useId();
  const tableId = `${chartId}-table`;
  
  return (
    <div className="accessible-chart">
      {/* Hidden summary for screen readers */}
      {summary != null && (
        <div className="sr-only" role="note">
          {summary}
        </div>
      )}
      
      {/* Chart container with ARIA */}
      <div
        role="img"
        aria-labelledby={`${chartId}-title`}
        aria-describedby={`${chartId}-desc ${tableId}`}
        className="chart-container"
      >
        <h3 id={`${chartId}-title`} className="chart-title">
          {title}
        </h3>
        
        {description != null && (
          <p id={`${chartId}-desc`} className="chart-description">
            {description}
          </p>
        )}
        
        {children}
      </div>
      
      {/* Accessible data table */}
      <div className={showDataTable ? 'data-table-container' : 'sr-only'}>
        <table id={tableId} className="data-table">
          <caption className="sr-only">
            Data for {title}: {description}
          </caption>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} scope="col">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ChartNavigationProps {
  /** Current data point index */
  currentIndex: number;
  /** Total data points */
  total: number;
  /** Current value label */
  currentLabel: string;
  /** Current value */
  currentValue: string | number;
  /** Callback for previous */ 
  onPrevious: () => void;
  /** Callback for next */
  onNext: () => void;
  /** Callback for selection */
  onSelect?: () => void;
}

/**
 * Keyboard navigation for interactive charts
 */
export function ChartNavigation({
  currentIndex,
  total,
  currentLabel,
  currentValue,
  onPrevious,
  onNext,
  onSelect,
}: ChartNavigationProps): React.ReactNode {
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        onPrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onNext();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.();
        break;
    }
  };
  
  return (
    <div
      role="toolbar"
      aria-label="Chart navigation"
      className="chart-navigation"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        aria-label="Previous data point"
        className="nav-button"
      >
        ←
      </button>
      
      <span className="current-point" aria-live="polite" aria-atomic="true">
        {currentLabel}: {currentValue} ({currentIndex + 1} of {total})
      </span>
      
      <button
        onClick={onNext}
        disabled={currentIndex === total - 1}
        aria-label="Next data point"
        className="nav-button"
      >
        →
      </button>
    </div>
  );
}

interface ScreenReaderSummaryProps {
  /** Data to summarize */
  data: Array<Record<string, unknown>>;
  /** Value accessor */
  valueKey: string;
  /** Label accessor */
  labelKey: string;
  /** Summary type */
  type?: 'trend' | 'distribution' | 'comparison';
}

/**
 * Generate screen reader summary for chart data
 */
export function ScreenReaderSummary({
  data,
  valueKey,
  labelKey,
  type = 'distribution',
}: ScreenReaderSummaryProps): React.ReactNode {
  if (data.length === 0) {
    return <span className="sr-only">No data available</span>;
  }
  
  const values = data.map(d => Number(d[valueKey]) || 0);
  const labels = data.map(d => String(d[labelKey]));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  
  const maxIndex = values.indexOf(max);
  const minIndex = values.indexOf(min);
  
  let summary = '';
  
  switch (type) {
    case 'trend': {
      const first = values[0];
      const last = values[values.length - 1];
      const trend = last > first ? 'increasing' : last < first ? 'decreasing' : 'stable';
      summary = `Trend is ${trend} from ${first} to ${last}. Average: ${avg.toFixed(1)}.`;
      break;
    }
      
    case 'distribution': {
      summary = `Distribution shows ${labels[maxIndex]} as highest at ${max}, and ${labels[minIndex]} as lowest at ${min}. Average: ${avg.toFixed(1)}.`;
      break;
    }
      
    case 'comparison': {
      summary = `Comparison of ${data.length} items. Highest: ${labels[maxIndex]} (${max}), Lowest: ${labels[minIndex]} (${min}).`;
      break;
    }
  }
  
  return <span className="sr-only">{summary}</span>;
}
