import { TimelineChart } from '../charts/TimelineChart';
import type { PerformanceTimeline, TimelineEvent } from '@/types';
import { Clock, Zap } from 'lucide-react';

interface TimelineSectionProps {
  timeline: PerformanceTimeline;
}

const TYPE_COLORS: Record<string, string> = {
  parse: '#58a6ff',
  load: '#d29922',
  execute: '#f85149',
  render: '#3fb950',
  paint: '#a371f7',
};

export function TimelineSection({ timeline }: TimelineSectionProps) {
  const criticalEvents = timeline.events.filter((e: TimelineEvent) => timeline.criticalPath.includes(e.name));
  const criticalTime = criticalEvents.reduce((sum: number, e: TimelineEvent) => sum + e.duration, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-dev-accent" />
        <h2 className="text-lg font-semibold text-dev-text">Performance Timeline</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <span className="metric-label">Total Time</span>
          <span className="metric-value">{Math.round(timeline.totalTime)}ms</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Events</span>
          <span className="metric-value">{timeline.events.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Critical Path</span>
          <span className="metric-value text-dev-warning-bright">{Math.round(criticalTime)}ms</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Optimization</span>
          <span className="metric-value text-dev-success-bright">
            {Math.round((1 - criticalTime / timeline.totalTime) * 100)}%
          </span>
        </div>
      </div>

      {/* Critical Path Alert */}
      {criticalEvents.length > 0 && (
        <div className="dev-panel p-4 border-dev-warning/30">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-dev-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-dev-warning-bright mb-2">
                Critical Path Events
              </h3>
              <p className="text-sm text-dev-text-muted mb-3">
                These events directly impact your page load time. Optimizing them will have the greatest impact.
              </p>
              <div className="flex flex-wrap gap-2">
                {criticalEvents.map((event, i) => (
                  <span 
                    key={i} 
                    className="px-2 py-1 bg-dev-warning/10 text-dev-warning-bright text-xs rounded"
                  >
                    {event.name} ({Math.round(event.duration)}ms)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Chart */}
      <div className="dev-panel p-4">
        <h3 className="text-sm font-semibold text-dev-text mb-4">Load Timeline</h3>
        <TimelineChart timeline={timeline} />
      </div>

      {/* Event Details */}
      <div className="dev-panel">
        <div className="px-4 py-3 border-b border-dev-border">
          <h3 className="text-sm font-semibold text-dev-text">Event Details</h3>
        </div>
        <div className="divide-y divide-dev-border-subtle">
          {timeline.events.map((event, i) => {
            const isCritical = timeline.criticalPath.includes(event.name);
            const percentage = (event.duration / timeline.totalTime) * 100;
            
            return (
              <div 
                key={i} 
                className={`px-4 py-3 flex items-center justify-between hover:bg-dev-surface-hover ${
                  isCritical ? 'bg-dev-warning/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[event.type] || '#8b949e' }}
                  />
                  <div>
                    <p className="text-sm font-medium text-dev-text">
                      {event.name}
                      {isCritical && (
                        <span className="ml-2 text-xs text-dev-warning-bright">⚡ Critical</span>
                      )}
                    </p>
                    <p className="text-xs text-dev-text-muted capitalize">{event.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-dev-text">{Math.round(event.duration)}ms</p>
                  <p className="text-xs text-dev-text-muted">{percentage.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
