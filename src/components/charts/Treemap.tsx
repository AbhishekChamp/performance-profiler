import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { BundleModule } from '@/types';
import { useThemeStore } from '@/stores/themeStore';

interface TreemapProps {
  modules: BundleModule[];
  width?: number;
  height?: number;
}

interface TreemapDatum {
  children: BundleModule[];
}

interface HierarchyNode extends d3.HierarchyRectangularNode<TreemapDatum> {
  data: BundleModule & TreemapDatum;
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
  const { resolvedMode } = useThemeStore();
  const isDark = resolvedMode === 'dark';

  useEffect(() => {
    if (!svgRef.current || modules.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Theme-aware colors
    const vendorColor = isDark ? '#58a6ff' : '#0969da';
    const entryColor = isDark ? '#3fb950' : '#1a7f37';
    const textColor = isDark ? '#c9d1d9' : '#24292f';
    const textMutedColor = isDark ? '#8b949e' : '#57606a';

    // Prepare data
    const root = d3.hierarchy<TreemapDatum>({ children: modules })
      .sum((d) => 'size' in d ? (d as unknown as BundleModule).size : 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    // Create treemap layout
    const treemapLayout = d3.treemap<TreemapDatum>()
      .size([width, height])
      .padding(2)
      .round(true);
    
    treemapLayout(root);

    // Draw rectangles
    const leaves = root.leaves() as unknown as HierarchyNode[];
    
    const leaf = svg.selectAll('g')
      .data(leaves)
      .join('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

    leaf.append('rect')
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('fill', (d) => {
        const baseColor = d.data.type === 'vendor' ? vendorColor : entryColor;
        return d3.color(baseColor)!.copy({ opacity: 0.7 }).toString();
      })
      .attr('stroke', (d) => {
        const baseColor = d.data.type === 'vendor' ? vendorColor : entryColor;
        return baseColor;
      })
      .attr('stroke-width', 1)
      .attr('rx', 2)
      .on('mouseover', function(event: MouseEvent, d: HierarchyNode) {
        setTooltip({
          x: event.pageX + 10,
          y: event.pageY - 10,
          content: d.data,
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
      .text((d) => {
        const w = d.x1 - d.x0;
        return w > 60 ? d.data.name.slice(0, 15) : '';
      })
      .style('font-size', '10px')
      .style('fill', textColor)
      .style('pointer-events', 'none');

    leaf.append('text')
      .attr('x', 4)
      .attr('y', 26)
      .text((d) => {
        const w = d.x1 - d.x0;
        return w > 60 ? formatBytes(d.data.size) : '';
      })
      .style('font-size', '9px')
      .style('fill', textMutedColor)
      .style('pointer-events', 'none');

  }, [modules, width, height, isDark]);

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
