import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { BundleModule } from '@/types';

interface TreemapProps {
  modules: BundleModule[];
  width?: number;
  height?: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function Treemap({ modules, width = 600, height = 400 }: TreemapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: BundleModule | null }>({ x: 0, y: 0, content: null });

  useEffect(() => {
    if (!svgRef.current || modules.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Prepare data
    const root = d3.hierarchy<{ children: BundleModule[] }>({ children: modules })
      .sum((d: any) => d.size)
      .sort((a: any, b: any) => b.value! - a.value!);

    // Create treemap layout
    d3.treemap()
      .size([width, height])
      .padding(2)
      .round(true)
      (root as any);

    // Draw rectangles
    const leaf = svg.selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

    leaf.append('rect')
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', (d: any) => {
        const baseColor = d.data.type === 'vendor' ? '#58a6ff' : '#3fb950';
        return d3.color(baseColor)!.copy({ opacity: 0.7 }).toString();
      })
      .attr('stroke', (d: any) => {
        const baseColor = d.data.type === 'vendor' ? '#58a6ff' : '#3fb950';
        return baseColor;
      })
      .attr('stroke-width', 1)
      .attr('rx', 2)
      .on('mouseover', function(event: MouseEvent, d: any) {
        setTooltip({
          x: event.pageX + 10,
          y: event.pageY - 10,
          content: d.data as BundleModule,
        });
      })
      .on('mousemove', function(event: MouseEvent) {
        setTooltip(prev => ({
          ...prev,
          x: event.pageX + 10,
          y: event.pageY - 10,
        }));
      })
      .on('mouseout', function() {
        setTooltip(prev => ({ ...prev, content: null }));
      });

    // Add labels for larger rectangles
    leaf.append('text')
      .attr('x', 4)
      .attr('y', 14)
      .text((d: any) => {
        const w = d.x1 - d.x0;
        return w > 60 ? (d.data.name as string).slice(0, 15) : '';
      })
      .style('font-size', '10px')
      .style('fill', '#c9d1d9')
      .style('pointer-events', 'none');

    leaf.append('text')
      .attr('x', 4)
      .attr('y', 26)
      .text((d: any) => {
        const w = d.x1 - d.x0;
        return w > 60 ? formatBytes(d.data.size as number) : '';
      })
      .style('font-size', '9px')
      .style('fill', '#8b949e')
      .style('pointer-events', 'none');

  }, [modules, width, height]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} className="rounded-lg" />
      
      {tooltip.content && (
        <div
          className="fixed z-50 px-3 py-2 bg-dev-surface border border-dev-border rounded shadow-lg pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="text-sm font-medium text-dev-text">{tooltip.content.name}</p>
          <p className="text-xs text-dev-text-muted">{formatBytes(tooltip.content.size)}</p>
          {tooltip.content.gzippedSize && (
            <p className="text-xs text-dev-text-subtle">
              Gzipped: {formatBytes(tooltip.content.gzippedSize)}
            </p>
          )}
          <p className="text-xs text-dev-accent capitalize">{tooltip.content.type}</p>
        </div>
      )}
    </div>
  );
}
