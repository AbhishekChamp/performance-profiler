import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { PerformanceTimeline, TimelineEvent } from '@/types';

interface TimelineChartProps {
  timeline: PerformanceTimeline;
  width?: number;
  height?: number;
}

const TYPE_COLORS: Record<string, string> = {
  parse: '#58a6ff',
  load: '#d29922',
  execute: '#f85149',
  render: '#3fb950',
  paint: '#a371f7',
};

export function TimelineChart({ timeline, width = 700, height = 180 }: TimelineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || timeline.events.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 40, left: 100 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, timeline.totalTime])
      .range([0, chartWidth]);

    const yScale = d3.scaleBand<string>()
      .domain(timeline.events.map((e: TimelineEvent) => e.name))
      .range([0, chartHeight])
      .padding(0.3);

    // Grid lines
    g.selectAll<SVGLineElement, number>('.grid-line')
      .data(xScale.ticks(5))
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', (d: number) => xScale(d))
      .attr('x2', (d: number) => xScale(d))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#30363d')
      .attr('stroke-dasharray', '3,3');

    // X axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${chartHeight})`);

    xAxis.call(d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat((d: d3.NumberValue) => `${d.valueOf()}ms`)
      .tickSize(0)
    );

    xAxis.select('.domain').remove();
    xAxis.selectAll('text')
      .style('fill', '#8b949e')
      .style('font-size', '11px');

    // Y axis
    const yAxis = g.append('g');
    yAxis.call(d3.axisLeft(yScale).tickSize(0));
    yAxis.select('.domain').remove();
    yAxis.selectAll('text')
      .style('fill', '#c9d1d9')
      .style('font-size', '11px');

    // Bars
    g.selectAll<SVGRectElement, TimelineEvent>('.bar')
      .data(timeline.events)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d: TimelineEvent) => xScale(d.start))
      .attr('y', (d: TimelineEvent) => yScale(d.name) || 0)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', (d: TimelineEvent) => TYPE_COLORS[d.type] || '#8b949e')
      .attr('rx', 3)
      .transition()
      .duration(800)
      .delay((d: TimelineEvent, i: number) => i * 100)
      .attr('width', (d: TimelineEvent) => xScale(d.end) - xScale(d.start));

    // Duration labels
    g.selectAll<SVGTextElement, TimelineEvent>('.duration-label')
      .data(timeline.events)
      .join('text')
      .attr('class', 'duration-label')
      .attr('x', (d: TimelineEvent) => xScale(d.end) + 5)
      .attr('y', (d: TimelineEvent) => (yScale(d.name) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('fill', '#8b949e')
      .style('font-size', '10px')
      .style('opacity', 0)
      .text((d: TimelineEvent) => `${Math.round(d.duration)}ms`)
      .transition()
      .duration(800)
      .delay((d: TimelineEvent, i: number) => i * 100 + 400)
      .style('opacity', 1);

    // Critical path indicator
    if (timeline.criticalPath.length > 0) {
      const criticalEventNames = new Set(timeline.criticalPath);
      const criticalY = timeline.events
        .filter((e: TimelineEvent) => criticalEventNames.has(e.name))
        .map((e: TimelineEvent) => yScale(e.name));
      
      if (criticalY.length > 0) {
        const avgY = criticalY.reduce((a: number, b: number | undefined) => a + (b || 0), 0) / criticalY.length;
        
        g.append('text')
          .attr('x', chartWidth + 10)
          .attr('y', avgY + yScale.bandwidth())
          .style('fill', '#f85149')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .text('⚡ Critical');
      }
    }

  }, [timeline, width, height]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} />
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 px-4">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
            <span className="text-xs text-dev-text-muted capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
