import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { TrendSeries, RegressionPoint } from '@/types';
import { useThemeStore } from '@/stores/themeStore';

interface TrendLineChartProps {
  series: TrendSeries[];
  regressions?: RegressionPoint[];
  width?: number;
  height?: number;
  showLegend?: boolean;
  enableZoom?: boolean;
}

export function TrendLineChart({
  series,
  regressions = [],
  width = 800,
  height = 400,
  showLegend = true,
  enableZoom = true,
}: TrendLineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: { series: string; value: number; date: Date } } | null>(null);
  const { resolvedMode } = useThemeStore();
  const isDark = resolvedMode === 'dark';

  useEffect(() => {
    if (!svgRef.current || series.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Theme-aware colors
    const gridColor = isDark ? '#30363d' : '#d0d7de';
    const textColor = isDark ? '#8b949e' : '#57606a';
    const axisColor = isDark ? '#30363d' : '#d0d7de';

    const margin = { top: 20, right: 80, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Find data ranges
    const allData = series.flatMap(s => s.data);
    const xExtent = d3.extent(allData, d => d.x) as [number, number];
    const yExtent = d3.extent(allData, d => d.y) as [number, number];
    
    // Add padding to y extent
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
    yExtent[0] = Math.max(0, yExtent[0] - yPadding);
    yExtent[1] = yExtent[1] + yPadding;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleTime()
      .domain(xExtent)
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([chartHeight, 0]);

    // Add grid lines
    const yAxisGrid = d3.axisLeft(yScale)
      .tickSize(-chartWidth)
      .tickFormat('' as any)
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', gridColor)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.5);

    g.select('.grid').select('.domain').remove();

    // Add X axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d3.timeFormat('%b %d') as any);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', textColor)
      .style('font-size', '11px');

    g.select('.domain').attr('stroke', axisColor);
    g.selectAll('.tick line').attr('stroke', axisColor);

    // Add Y axis
    const yAxis = d3.axisLeft(yScale).ticks(5);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('fill', textColor)
      .style('font-size', '11px');

    // Create line generator
    const line = d3.line<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Draw lines for each series
    series.forEach(s => {
      if (s.data.length < 2) return;

      // Draw line
      g.append('path')
        .datum(s.data)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 2)
        .attr('d', line)
        .attr('opacity', 0)
        .transition()
        .duration(750)
        .attr('opacity', 1);

      // Draw dots
      g.selectAll(`.dot-${s.metric}`)
        .data(s.data)
        .join('circle')
        .attr('class', `dot-${s.metric}`)
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', 4)
        .attr('fill', s.color)
        .attr('stroke', isDark ? '#161b22' : '#ffffff')
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', 6);
          setHoveredPoint({
            x: event.pageX,
            y: event.pageY,
            data: {
              series: s.label,
              value: d.y,
              date: new Date(d.x),
            },
          });
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 4);
          setHoveredPoint(null);
        })
        .transition()
        .duration(750)
        .delay((d, i) => i * 30)
        .attr('opacity', 1);
    });

    // Draw regression markers
    regressions.forEach(reg => {
      const x = xScale(reg.timestamp);
      const color = reg.severity === 'critical' ? '#f85149' : '#d29922';
      
      // Draw vertical line
      g.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.5);
      
      // Draw warning icon
      g.append('circle')
        .attr('cx', x)
        .attr('cy', 10)
        .attr('r', 8)
        .attr('fill', color)
        .attr('stroke', isDark ? '#161b22' : '#ffffff')
        .attr('stroke-width', 2);
      
      g.append('text')
        .attr('x', x)
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text('!');
    });

    // Add legend
    if (showLegend) {
      const legend = g.append('g')
        .attr('transform', `translate(${chartWidth + 10}, 0)`);

      series.forEach((s, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 20})`);

        legendItem.append('line')
          .attr('x1', 0)
          .attr('x2', 15)
          .attr('y1', 5)
          .attr('y2', 5)
          .attr('stroke', s.color)
          .attr('stroke-width', 2);

        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 9)
          .text(s.label)
          .style('fill', textColor)
          .style('font-size', '11px');
      });
    }

    // Add zoom behavior if enabled
    if (enableZoom) {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 5])
        .on('zoom', (event) => {
          const newXScale = event.transform.rescaleX(xScale);
          
          // Update axes
          g.select<SVGGElement>('.x-axis')?.call(d3.axisBottom(newXScale) as any);
          
          // Update lines
          g.selectAll('path.line')
            .attr('d', line.x(d => newXScale(d.x)) as any);
          
          // Update dots
          g.selectAll('[class^="dot-"]')
            .attr('cx', (d: any) => newXScale(d.x));
        });

      svg.call(zoom);
    }

  }, [series, regressions, width, height, isDark, enableZoom, showLegend]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} />
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="fixed z-50 px-3 py-2 bg-dev-surface border border-dev-border rounded-lg shadow-lg pointer-events-none"
          style={{ left: hoveredPoint.x + 10, top: hoveredPoint.y - 10 }}
        >
          <p className="text-sm font-medium text-dev-text">{hoveredPoint.data.series}</p>
          <p className="text-xs text-dev-text-muted">
            {hoveredPoint.data.date.toLocaleDateString()}
          </p>
          <p className="text-lg font-semibold text-dev-accent">
            {Math.round(hoveredPoint.data.value)}
          </p>
        </div>
      )}
    </div>
  );
}
