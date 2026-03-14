import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { WaterfallData, WaterfallResource } from '@/core/waterfall/timingCalculator';
import { ArrowLeftRight, ChevronDown, ChevronUp } from 'lucide-react';

interface WaterfallComparisonProps {
  baseline: WaterfallData;
  current: WaterfallData;
}

interface ResourceComparison {
  url: string;
  baseline?: WaterfallResource;
  current?: WaterfallResource;
  delta: number;
  percentageChange: number;
  status: 'added' | 'removed' | 'improved' | 'regressed' | 'unchanged';
}

export function WaterfallComparison({ baseline, current }: WaterfallComparisonProps): JSX.Element {
  const [sortBy, setSortBy] = useState<'delta' | 'name'>('delta');
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);

  const comparisons = useMemo<ResourceComparison[]>(() => {
    const baselineMap = new Map(baseline.resources.map(r => [r.url, r]));
    const currentMap = new Map(current.resources.map(r => [r.url, r]));
    const allUrls = new Set([...baselineMap.keys(), ...currentMap.keys()]);

    return Array.from(allUrls).map(url => {
      const b = baselineMap.get(url);
      const c = currentMap.get(url);

      if (!b) {
        return {
          url,
          current: c,
          delta: c?.duration ?? 0,
          percentageChange: 100,
          status: 'added',
        };
      }

      if (!c) {
        return {
          url,
          baseline: b,
          delta: -b.duration,
          percentageChange: -100,
          status: 'removed',
        };
      }

      const delta = c.duration - b.duration;
      const percentageChange = b.duration > 0 ? (delta / b.duration) * 100 : 0;

      let status: ResourceComparison['status'] = 'unchanged';
      if (Math.abs(percentageChange) > 10) {
        status = delta > 0 ? 'regressed' : 'improved';
      }

      return { url, baseline: b, current: c, delta, percentageChange, status };
    });
  }, [baseline, current]);

  const filteredComparisons = useMemo(() => {
    let filtered = showOnlyChanges 
      ? comparisons.filter(c => c.status !== 'unchanged')
      : comparisons;
    
    return filtered.sort((a, b) => {
      if (sortBy === 'delta') {
        return Math.abs(b.delta) - Math.abs(a.delta);
      }
      return a.url.localeCompare(b.url);
    });
  }, [comparisons, showOnlyChanges, sortBy]);

  const stats = useMemo(() => {
    const added = comparisons.filter(c => c.status === 'added').length;
    const removed = comparisons.filter(c => c.status === 'removed').length;
    const improved = comparisons.filter(c => c.status === 'improved').length;
    const regressed = comparisons.filter(c => c.status === 'regressed').length;
    const totalDelta = current.totalDuration - baseline.totalDuration;

    return { added, removed, improved, regressed, totalDelta };
  }, [comparisons, baseline, current]);

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Change" value={formatDuration(stats.totalDelta)} 
          color={stats.totalDelta > 0 ? 'red' : 'green'} />
        <StatCard label="Added" value={stats.added} color="blue" />
        <StatCard label="Removed" value={stats.removed} color="purple" />
        <StatCard label="Improved" value={stats.improved} color="green" />
        <StatCard label="Regressed" value={stats.regressed} color="red" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowOnlyChanges(!showOnlyChanges)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              showOnlyChanges 
                ? 'bg-dev-accent/10 border-dev-accent/50 text-dev-accent' 
                : 'border-dev-border text-dev-text-muted'
            }`}
          >
            {showOnlyChanges ? 'Showing Changes Only' : 'Showing All'}
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'delta' | 'name')}
            className="dev-input text-sm"
          >
            <option value="delta">Sort by Impact</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
        <span className="text-sm text-dev-text-muted">
          {filteredComparisons.length} resources
        </span>
      </div>

      {/* Comparison List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredComparisons.map((comp, index) => (
          <motion.div
            key={comp.url}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-lg border ${getStatusClasses(comp.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dev-text truncate" title={comp.url}>
                  {comp.url.split('/').pop() ?? comp.url}
                </p>
                <p className="text-xs text-dev-text-muted capitalize">
                  {(comp.baseline?.type ?? comp.current?.type) ?? ''} • {comp.status}
                </p>
              </div>

              <div className="flex items-center gap-4 ml-4">
                {comp.baseline && (
                  <div className="text-right">
                    <p className="text-xs text-dev-text-muted">Before</p>
                    <p className="text-sm text-dev-text">{Math.round(comp.baseline.duration)}ms</p>
                  </div>
                )}

                <ArrowLeftRight className="w-4 h-4 text-dev-text-subtle" />

                {comp.current && (
                  <div className="text-right">
                    <p className="text-xs text-dev-text-muted">After</p>
                    <p className="text-sm text-dev-text">{Math.round(comp.current.duration)}ms</p>
                  </div>
                )}

                {comp.status !== 'added' && comp.status !== 'removed' && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    comp.delta < 0 ? 'text-green-400' : comp.delta > 0 ? 'text-red-400' : 'text-dev-text-muted'
                  }`}>
                    {comp.delta < 0 ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : comp.delta > 0 ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : null}
                    {Math.abs(comp.percentageChange).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }): JSX.Element {
  const colorClasses = {
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={`p-3 rounded-lg border text-center ${colorClasses[color as keyof typeof colorClasses]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}

function getStatusClasses(status: ResourceComparison['status']): string {
  switch (status) {
    case 'added':
      return 'bg-blue-500/5 border-blue-500/20';
    case 'removed':
      return 'bg-purple-500/5 border-purple-500/20';
    case 'improved':
      return 'bg-green-500/5 border-green-500/20';
    case 'regressed':
      return 'bg-red-500/5 border-red-500/20';
    default:
      return 'bg-dev-surface border-dev-border';
  }
}

function formatDuration(ms: number): string {
  const sign = ms > 0 ? '+' : '';
  return `${sign}${Math.round(ms)}ms`;
}
