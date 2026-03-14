import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import type { WaterfallData, WaterfallResource } from '@/core/waterfall/timingCalculator';
import { calculatePotentialSavings } from '@/core/waterfall/timingCalculator';
import { ZoomIn, ZoomOut, Filter, Download } from 'lucide-react';

interface WaterfallChartProps {
  data: WaterfallData;
  height?: number;
}

const TYPE_COLORS: Record<WaterfallResource['type'], string> = {
  html: '#58a6ff',
  css: '#d29922',
  js: '#f0883e',
  image: '#3fb950',
  font: '#a371f7',
  json: '#79c0ff',
  other: '#8b949e',
};

export function WaterfallChart({ data, height = 500 }: WaterfallChartProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedResource, setSelectedResource] = useState<WaterfallResource | null>(null);
  const [filter, setFilter] = useState<WaterfallResource['type'] | 'all'>('all');
  const [zoom, setZoom] = useState(1);

  const filteredResources = useMemo(() => {
    if (filter === 'all') return data.resources;
    return data.resources.filter((r) => r.type === filter);
  }, [data.resources, filter]);

  const savings = useMemo(() => calculatePotentialSavings(data.resources), [data.resources]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 20, bottom: 60, left: 200 };
    const width = (svgRef.current.clientWidth ?? 800) - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, data.totalDuration * zoom])
      .range([0, width]);

    const yScale = d3
      .scaleBand()
      .domain(filteredResources.map((_, i) => i.toString()))
      .range([0, chartHeight])
      .padding(0.1);

    // Time axis
    const xAxis = d3.axisBottom(xScale).tickFormat((d) => `${d}ms`);
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', 'var(--dev-text-muted)');

    g.selectAll('.domain, .tick line').style('stroke', 'var(--dev-border)');

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(xScale.ticks(10))
      .enter()
      .append('line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .style('stroke', 'var(--dev-border)')
      .style('stroke-opacity', 0.3);

    // Performance markers
    const markers = [
      { time: data.markers.domContentLoaded, label: 'DOMContentLoaded', color: '#d29922' },
      { time: data.markers.load, label: 'Load', color: '#58a6ff' },
      { time: data.markers.firstPaint, label: 'FCP', color: '#3fb950' },
      { time: data.markers.largestContentfulPaint, label: 'LCP', color: '#a371f7' },
    ];

    markers.forEach((marker) => {
      if (marker.time <= data.totalDuration * zoom) {
        g.append('line')
          .attr('x1', xScale(marker.time))
          .attr('x2', xScale(marker.time))
          .attr('y1', 0)
          .attr('y2', chartHeight)
          .style('stroke', marker.color)
          .style('stroke-width', 2)
          .style('stroke-dasharray', '5,5');

        g.append('text')
          .attr('x', xScale(marker.time) + 5)
          .attr('y', -5)
          .text(marker.label)
          .style('fill', marker.color)
          .style('font-size', '10px')
          .style('font-weight', 'bold');
      }
    });

    // Resource bars
    const bars = g
      .selectAll('.resource-bar')
      .data(filteredResources)
      .enter()
      .append('g')
      .attr('class', 'resource-bar')
      .style('cursor', 'pointer')
      .on('click', (_, d) => setSelectedResource(d));

    // Bar background (full duration)
    bars
      .append('rect')
      .attr('x', (d) => xScale(d.startTime))
      .attr('y', (_, i) => yScale(i.toString()) ?? 0)
      .attr('width', (d) => Math.max(2, xScale(d.endTime) - xScale(d.startTime)))
      .attr('height', yScale.bandwidth())
      .style('fill', (d) => TYPE_COLORS[d.type])
      .style('opacity', 0.8)
      .style('rx', 2);

    // Resource labels
    g.selectAll('.resource-label')
      .data(filteredResources)
      .enter()
      .append('text')
      .attr('class', 'resource-label')
      .attr('x', -10)
      .attr('y', (_, i) => (yScale(i.toString()) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('text-anchor', 'end')
      .style('fill', 'var(--dev-text)')
      .style('font-size', '11px')
      .text((d) => {
        const name = d.url.split('/').pop() ?? d.url;
        return name.length > 30 ? name.substring(0, 27) + '...' : name;
      });

    // Duration labels on bars
    bars
      .append('text')
      .attr('x', (d) => xScale(d.endTime) + 5)
      .attr('y', (_, i) => (yScale(i.toString()) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('fill', 'var(--dev-text-muted)')
      .style('font-size', '10px')
      .text((d) => `${Math.round(d.duration)}ms`);
  }, [data, filteredResources, height, zoom]);

  const handleExport = (): void => {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waterfall-chart.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dev-text-muted" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="dev-input"
          >
            <option value="all">All Resources</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="js">JavaScript</option>
            <option value="image">Images</option>
            <option value="font">Fonts</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="dev-button-secondary p-2"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-dev-text-muted min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="dev-button-secondary p-2"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="dev-button-secondary flex items-center gap-2 ml-4"
          >
            <Download className="w-4 h-4" />
            Export SVG
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-dev-text-muted capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          className="min-w-[800px]"
        />
      </div>

      {/* Resource Details Modal */}
      {selectedResource && (
        <ResourceDetailsModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}

      {/* Optimization Suggestions */}
      {savings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dev-surface border border-dev-border rounded-lg p-4"
        >
          <h4 className="text-sm font-semibold text-dev-text mb-3">
            Potential Optimizations
          </h4>
          <div className="space-y-2">
            {savings.slice(0, 3).map((saving, _index) => (
              <div
                key={saving.type}
                className="flex items-center justify-between py-2 px-3 bg-dev-bg rounded"
              >
                <span className="text-sm text-dev-text">{saving.description}</span>
                <span className="text-sm font-medium text-dev-success-bright">
                  -{Math.round(saving.saving)}ms
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface ResourceDetailsModalProps {
  resource: WaterfallResource;
  onClose: () => void;
}

function ResourceDetailsModal({ resource, onClose }: ResourceDetailsModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dev-surface border border-dev-border rounded-lg p-6 max-w-md w-full"
      >
        <h3 className="text-lg font-semibold text-dev-text mb-4">Resource Details</h3>
        
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-dev-text-muted">URL:</span>
            <p className="text-dev-text break-all">{resource.url}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-dev-text-muted">Type:</span>
              <p className="text-dev-text capitalize">{resource.type}</p>
            </div>
            <div>
              <span className="text-dev-text-muted">Size:</span>
              <p className="text-dev-text">
                {(resource.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-dev-text-muted">Start:</span>
              <p className="text-dev-text">{Math.round(resource.startTime)}ms</p>
            </div>
            <div>
              <span className="text-dev-text-muted">Duration:</span>
              <p className="text-dev-text">{Math.round(resource.duration)}ms</p>
            </div>
            <div>
              <span className="text-dev-text-muted">End:</span>
              <p className="text-dev-text">{Math.round(resource.endTime)}ms</p>
            </div>
          </div>
          
          <div>
            <span className="text-dev-text-muted">Priority:</span>
            <span
              className={`ml-2 px-2 py-0.5 rounded text-xs ${
                resource.priority === 'highest'
                  ? 'bg-dev-danger/10 text-dev-danger-bright'
                  : resource.priority === 'high'
                  ? 'bg-dev-warning/10 text-dev-warning-bright'
                  : 'bg-dev-success/10 text-dev-success-bright'
              }`}
            >
              {resource.priority}
            </span>
          </div>
          
          {resource.isBlocking && (
            <div className="p-3 bg-dev-warning/10 border border-dev-warning/30 rounded">
              <p className="text-dev-warning-bright text-xs">
                ⚠️ This resource is render-blocking and delays page load
              </p>
            </div>
          )}
          
          {resource.isPreload && (
            <div className="p-3 bg-dev-success/10 border border-dev-success/30 rounded">
              <p className="text-dev-success-bright text-xs">
                ✓ This resource is preloaded for faster discovery
              </p>
            </div>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="dev-button w-full mt-6"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
