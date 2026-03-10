import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  Minus,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { useTrendStore, selectTrendData, selectAvailableProjects } from '@/stores/trendStore';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { Button } from '@/components/ui/Button';
import { Select, SelectItem } from '@/components/ui/Select';
import type { TrendDataPoint, TrendSeries, RegressionPoint, TrendFilters } from '@/types';
import { exportTrendDataAsCSV, getAvailableMetrics, formatTrendDirection } from '@/core/trends';
import { useClickOutside } from '@/hooks/useClickOutside';

// Metric selector component
function MetricSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (metrics: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setIsOpen(false));

  const metrics = getAvailableMetrics();

  const toggleMetric = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(m => m !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        rightIcon={isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      >
        Metrics ({selected.length})
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute z-20 mt-2 w-56 bg-dev-surface border border-dev-border rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
              {metrics.map(metric => (
                <label
                  key={metric.key}
                  className="flex items-center gap-3 px-3 py-2 rounded hover:bg-dev-surface-hover cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(metric.key)}
                    onChange={() => toggleMetric(metric.key)}
                    className="rounded border-dev-border bg-dev-bg text-dev-accent focus:ring-dev-accent"
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    <span className="text-sm text-dev-text">{metric.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Regression list component
function RegressionList({ regressions }: { regressions: RegressionPoint[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayRegressions = showAll ? regressions : regressions.slice(0, 5);

  if (regressions.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-dev-success" />
        <h3 className="text-lg font-medium text-dev-text">No Regressions Found</h3>
        <p className="text-sm text-dev-text-muted mt-1">
          Your performance is stable or improving
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-dev-surface border-b border-dev-border flex items-center justify-between">
        <h3 className="font-medium text-dev-text flex items-center gap-2">
          <AlertTriangle size={18} className="text-dev-warning" />
          Performance Regressions
          <span className="px-2 py-0.5 bg-dev-warning/20 text-dev-warning text-xs rounded-full">
            {regressions.length}
          </span>
        </h3>
      </div>

      <div className="divide-y divide-dev-border">
        {displayRegressions.map((reg, index) => (
          <motion.div
            key={`${reg.timestamp}-${reg.metric}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="px-4 py-3 hover:bg-dev-surface-hover transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-dev-text">{reg.message}</p>
                <p className="text-xs text-dev-text-muted mt-1">
                  {new Date(reg.timestamp).toLocaleDateString()} • {reg.metric}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  reg.severity === 'critical'
                    ? 'bg-dev-danger/20 text-dev-danger'
                    : 'bg-dev-warning/20 text-dev-warning'
                }`}
              >
                {reg.severity}
              </span>
            </div>
            {reg.percentageChange !== undefined && (
              <div className="mt-2 flex items-center gap-4 text-xs">
                <span className="text-dev-text-muted">
                  Previous: <span className="text-dev-text">{Math.round(reg.previousValue)}</span>
                </span>
                <span className="text-dev-text-muted">
                  Current: <span className="text-dev-text">{Math.round(reg.currentValue)}</span>
                </span>
                <span className="text-dev-danger">
                  {reg.percentageChange > 0 ? '+' : ''}
                  {Math.round(reg.percentageChange * 10) / 10}%
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {regressions.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-dev-accent hover:bg-dev-surface-hover transition-colors"
        >
          {showAll ? 'Show Less' : `Show ${regressions.length - 5} More`}
        </button>
      )}
    </div>
  );
}

// Summary stats component
function TrendSummary() {
  const { projects, selectedProject } = useTrendStore();

  const summary = useMemo(() => {
    if (selectedProject === 'all') {
      // Aggregate across all projects
      const allReports = projects.flatMap(p => p.reports);
      if (allReports.length === 0) return null;

      const scores = allReports.map(r => r.overallScore);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const trendDirection: 'improving' | 'declining' | 'stable' =
        scores[scores.length - 1] > scores[0] + 5 ? 'improving' : 
        scores[scores.length - 1] < scores[0] - 5 ? 'declining' : 'stable';

      return {
        totalReports: allReports.length,
        avgScore: Math.round(avgScore),
        trendDirection,
        projectCount: projects.length,
      };
    } else {
      const project = projects.find(p => p.projectName === selectedProject);
      if (!project) return null;

      return {
        totalReports: project.reports.length,
        avgScore: project.summary.averageScore,
        trendDirection: project.summary.trendDirection,
        projectCount: 1,
      };
    }
  }, [projects, selectedProject]);

  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-panel rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-dev-surface rounded w-20 mb-2" />
            <div className="h-8 bg-dev-surface rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const trendInfo = formatTrendDirection(summary.trendDirection);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2 text-dev-text-muted mb-1">
          <BarChart3 size={16} />
          <span className="text-sm">Reports</span>
        </div>
        <p className="text-2xl font-bold text-dev-text">{summary.totalReports}</p>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2 text-dev-text-muted mb-1">
          <TrendingUp size={16} />
          <span className="text-sm">Avg Score</span>
        </div>
        <p className="text-2xl font-bold text-dev-text">{summary.avgScore}</p>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2 text-dev-text-muted mb-1">
          {summary.trendDirection === 'improving' ? (
            <TrendingUp size={16} className="text-dev-success" />
          ) : summary.trendDirection === 'declining' ? (
            <TrendingDown size={16} className="text-dev-danger" />
          ) : (
            <Minus size={16} className="text-dev-text-muted" />
          )}
          <span className="text-sm">Trend</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: trendInfo.color }}>
          {trendInfo.label}
        </p>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2 text-dev-text-muted mb-1">
          <Calendar size={16} />
          <span className="text-sm">Projects</span>
        </div>
        <p className="text-2xl font-bold text-dev-text">{summary.projectCount}</p>
      </div>
    </div>
  );
}

// Main dashboard component
export function TrendDashboard() {
  const {
    trendData,
    filteredData,
    regressions,
    selectedProject,
    selectedMetrics,
    filters,
    setSelectedProject,
    setSelectedMetrics,
    setFilters,
    clearTrendData,
    refreshFromStorage,
  } = useTrendStore();

  const availableProjects = useTrendStore(selectAvailableProjects);

  // Prepare chart series
  const series: TrendSeries[] = useMemo(() => {
    const metrics = getAvailableMetrics();
    const data =
      selectedProject === 'all'
        ? filteredData
        : filteredData.filter(d => d.projectName === selectedProject);

    return selectedMetrics
      .map(metricKey => {
        const metric = metrics.find(m => m.key === metricKey);
        if (!metric) return null;

        const seriesData = data
          .filter(d => d[metricKey as keyof TrendDataPoint] !== undefined)
          .map(d => ({
            x: d.timestamp,
            y: d[metricKey as keyof TrendDataPoint] as number,
          }));

        if (seriesData.length === 0) return null;

        return {
          metric: metricKey,
          label: metric.label,
          color: metric.color,
          data: seriesData,
        };
      })
      .filter((s): s is TrendSeries => s !== null);
  }, [filteredData, selectedMetrics, selectedProject]);

  // Handle CSV export
  const handleExportCSV = () => {
    const csv = exportTrendDataAsCSV(filteredData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-trends-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    setFilters({ dateRange: value as TrendFilters['dateRange'] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dev-text">Historical Trends</h2>
          <p className="text-sm text-dev-text-muted mt-1">
            Track performance metrics over time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshFromStorage}
            leftIcon={<RefreshCw size={16} />}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet size={16} />}
            disabled={filteredData.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={clearTrendData}
            leftIcon={<Trash2 size={16} />}
            disabled={trendData.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <TrendSummary />

      {/* Filters */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-dev-text-muted" />
            <span className="text-sm font-medium text-dev-text">Filters:</span>
          </div>

          <Select value={selectedProject} onChange={setSelectedProject} className="w-40">
            {availableProjects.map(project => (
              <SelectItem key={project} value={project}>
                {project === 'all' ? 'All Projects' : project}
              </SelectItem>
            ))}
          </Select>

          <Select value={filters.dateRange} onChange={handleDateRangeChange} className="w-32">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </Select>

          <MetricSelector selected={selectedMetrics} onChange={setSelectedMetrics} />
        </div>
      </div>

      {/* Chart */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-lg font-medium text-dev-text mb-4">Performance Over Time</h3>
        {series.length > 0 ? (
          <div className="overflow-x-auto">
            <TrendLineChart
              series={series}
              regressions={regressions}
              width={760}
              height={400}
              enableZoom
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-dev-text-subtle" />
            <h4 className="text-lg font-medium text-dev-text">No Data Available</h4>
            <p className="text-sm text-dev-text-muted mt-2 max-w-md mx-auto">
              Analyze some projects first to build your trend history. Each new report will be
              automatically added to this dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Regressions */}
      <RegressionList regressions={regressions} />
    </div>
  );
}
