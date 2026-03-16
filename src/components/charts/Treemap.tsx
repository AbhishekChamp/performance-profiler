import { memo, useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { BundleModule } from '@/types';

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

// Get color scale based on module type and size
function getModuleColor(
  type: string,
  size: number,
  maxSize: number,
  isDark: boolean
): string {
  const intensity = Math.min(1, Math.max(0.3, size / maxSize));
  
  if (type === 'vendor') {
    const base = isDark ? '#58a6ff' : '#0969da';
    const color = d3.color(base);
    if (color) {
      color.opacity = 0.4 + intensity * 0.5;
      return color.toString();
    }
    return base;
  }
  if (type === 'chunk') {
    const base = isDark ? '#a371f7' : '#8250df';
    const color = d3.color(base);
    if (color) {
      color.opacity = 0.4 + intensity * 0.5;
      return color.toString();
    }
    return base;
  }
  if (type === 'asset') {
    const base = isDark ? '#d29922' : '#9a6700';
    const color = d3.color(base);
    if (color) {
      color.opacity = 0.4 + intensity * 0.5;
      return color.toString();
    }
    return base;
  }
  // entry
  const base = isDark ? '#3fb950' : '#1a7f37';
  const color = d3.color(base);
  if (color) {
    color.opacity = 0.4 + intensity * 0.5;
    return color.toString();
  }
  return base;
}

// Memoized Treemap to prevent unnecessary re-renders
function TreemapComponent({ modules, width = 600, height = 400 }: TreemapProps): React.ReactNode {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ 
    x: number; 
    y: number; 
    content: BundleModule | null;
    visible: boolean;
  }>({ x: 0, y: 0, content: null, visible: false });
  const [isDark, setIsDark] = useState(true);

  // Update theme detection
  useEffect(() => {
    const updateTheme = (): void => {
      const dark = document.documentElement.classList.contains('dark');
      setIsDark(dark);
    };
    
    updateTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const handleMouseOver = useCallback((event: MouseEvent, d: HierarchyNode) => {
    setTooltip({
      x: event.clientX + 12,
      y: event.clientY - 12,
      content: d.data,
      visible: true,
    });
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    setTooltip(prev => ({
      ...prev,
      x: event.clientX + 12,
      y: event.clientY - 12,
    }));
  }, []);

  const handleMouseOut = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    if (!svgRef.current || modules.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Get stroke color from CSS
    const strokeColor = isDark ? 'rgba(22, 27, 34, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    const textColor = isDark ? '#f0f6fc' : '#1f2328';
    const textMutedColor = isDark ? '#8b949e' : '#57606a';

    // Limit modules to prevent performance issues (show top 100 largest)
    const sortedModules = [...modules].sort((a, b) => b.size - a.size).slice(0, 100);
    const maxSize = sortedModules[0]?.size || 1;

    // Prepare data
    const root = d3.hierarchy<TreemapDatum>({ children: sortedModules })
      .sum((d) => 'size' in d ? (d as unknown as BundleModule).size : 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    // Create treemap layout with better padding
    const treemapLayout = d3.treemap<TreemapDatum>()
      .size([width, height])
      .paddingInner(1.5)
      .paddingOuter(2)
      .round(true);
    
    treemapLayout(root);

    // Draw rectangles
    const leaves = root.leaves() as unknown as HierarchyNode[];
    
    const leaf = svg.selectAll('g')
      .data(leaves)
      .join('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

    // Add rects with improved styling
    const rects = leaf.append('rect')
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d) => getModuleColor(d.data.type, d.data.size, maxSize, isDark))
      .attr('stroke', strokeColor)
      .attr('stroke-width', 1.5)
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.15s ease');

    // Add hover effect
    rects
      .on('mouseover', function(event: MouseEvent, d: HierarchyNode) {
        d3.select(this)
          .attr('stroke', isDark ? '#58a6ff' : '#0969da')
          .attr('stroke-width', 2.5);
        handleMouseOver(event, d);
      })
      .on('mousemove', function(event: MouseEvent) {
        handleMouseMove(event);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', strokeColor)
          .attr('stroke-width', 1.5);
        handleMouseOut();
      });

    // Add labels for larger rectangles with better text handling
    const minWidthForLabel = 50;
    const minHeightForLabel = 30;

    leaf.each(function(d) {
      const w = d.x1 - d.x0;
      const h = d.y1 - d.y0;
      
      if (w >= minWidthForLabel && h >= minHeightForLabel) {
        const g = d3.select(this);
        
        // Module name
        g.append('text')
          .attr('x', 6)
          .attr('y', 15)
          .text(d.data.name.length > 12 ? `${d.data.name.slice(0, 11)}…` : d.data.name)
          .style('font-size', '11px')
          .style('font-weight', '500')
          .style('fill', textColor)
          .style('pointer-events', 'none');
        
        // Size (if enough height)
        if (h >= 45) {
          g.append('text')
            .attr('x', 6)
            .attr('y', 30)
            .text(formatBytes(d.data.size))
            .style('font-size', '9px')
            .style('font-weight', '400')
            .style('fill', textMutedColor)
            .style('pointer-events', 'none');
        }
        
        // Type badge (if enough space)
        if (w >= 70 && h >= 55) {
          const typeColors: Record<string, string> = {
            vendor: isDark ? '#58a6ff' : '#0969da',
            entry: isDark ? '#3fb950' : '#1a7f37',
            chunk: isDark ? '#a371f7' : '#8250df',
            asset: isDark ? '#d29922' : '#9a6700',
          };
          
          g.append('text')
            .attr('x', 6)
            .attr('y', h - 6)
            .text(d.data.type)
            .style('font-size', '8px')
            .style('font-weight', '600')
            .style('fill', typeColors[d.data.type] || textMutedColor)
            .style('text-transform', 'uppercase')
            .style('letter-spacing', '0.3px')
            .style('pointer-events', 'none');
        }
      }
    });

  }, [modules, width, height, isDark, handleMouseOver, handleMouseMove, handleMouseOut]);

  // Legend data
  const legendItems = [
    { label: 'Entry', type: 'entry', color: isDark ? '#3fb950' : '#1a7f37' },
    { label: 'Vendor', type: 'vendor', color: isDark ? '#58a6ff' : '#0969da' },
    { label: 'Chunk', type: 'chunk', color: isDark ? '#a371f7' : '#8250df' },
    { label: 'Asset', type: 'asset', color: isDark ? '#d29922' : '#9a6700' },
  ];

  return (
    <div ref={containerRef} className="flex flex-col">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-3">
        {legendItems.map((item) => (
          <div key={item.type} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ 
                backgroundColor: item.color,
                opacity: 0.8
              }}
            />
            <span className="text-xs text-dev-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
      
      {/* Treemap */}
      <div className="relative rounded-lg overflow-hidden bg-dev-surface/50">
        <svg ref={svgRef} width={width} height={height} />
      </div>
      
      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          className="fixed z-50 px-3 py-2.5 bg-dev-surface border border-dev-border rounded-lg shadow-xl pointer-events-none"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y,
            maxWidth: '280px'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: tooltip.content.type === 'vendor' 
                  ? (isDark ? '#58a6ff' : '#0969da')
                  : tooltip.content.type === 'chunk'
                    ? (isDark ? '#a371f7' : '#8250df')
                    : tooltip.content.type === 'asset'
                      ? (isDark ? '#d29922' : '#9a6700')
                      : (isDark ? '#3fb950' : '#1a7f37')
              }}
            />
            <p className="text-sm font-semibold text-dev-text truncate">{tooltip.content.name}</p>
          </div>
          <p className="text-xs text-dev-text-muted mb-1.5 truncate">{tooltip.content.path}</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono text-dev-text">{formatBytes(tooltip.content.size)}</span>
            {tooltip.content.gzippedSize !== undefined && tooltip.content.gzippedSize > 0 && (
              <span className="text-dev-text-subtle">
                → {formatBytes(tooltip.content.gzippedSize)} gzipped
              </span>
            )}
          </div>
          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-dev-surface-hover text-dev-text-muted uppercase tracking-wide">
            {tooltip.content.type}
          </span>
        </div>
      )}
    </div>
  );
}

export const Treemap = memo(TreemapComponent);
