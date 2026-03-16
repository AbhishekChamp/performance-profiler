import { memo, useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface PieData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieData[];
  width?: number;
  height?: number;
  innerRadius?: number;
}

function PieChartComponent({ 
  data, 
  width = 280, 
  height = 280,
  innerRadius = 0.6 
}: PieChartProps): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredSlice, setHoveredSlice] = useState<PieData | null>(null);
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

  const getThemeColor = useCallback((baseColor: string): string => {
    // Map provided colors to theme-aware colors
    const colorMap: Record<string, { dark: string; light: string }> = {
      '#58a6ff': { dark: '#58a6ff', light: '#0969da' },
      '#3fb950': { dark: '#3fb950', light: '#1a7f37' },
      '#a371f7': { dark: '#a371f7', light: '#8250df' },
      '#d29922': { dark: '#d29922', light: '#9a6700' },
      '#da3633': { dark: '#da3633', light: '#cf222e' },
      '#f778ba': { dark: '#f778ba', light: '#bf3989' },
    };
    
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return colorMap[baseColor]?.[isDark ? 'dark' : 'light'] || baseColor;
  }, [isDark]);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const radius = Math.min(width, height) / 2 - 24;
    const innerR = radius * innerRadius;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Theme-aware stroke color
    const strokeColor = isDark ? '#161b22' : '#f6f8fa';

    // Create pie generator
    const pie = d3.pie<PieData>()
      .value(d => d.value)
      .sort(null)
      .padAngle(0.02);

    // Create arc generators
    const arc = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(innerR)
      .outerRadius(radius)
      .cornerRadius(4);

    const arcHover = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(innerR)
      .outerRadius(radius + 6)
      .cornerRadius(4);

    // Draw slices
    const slices = g.selectAll<SVGPathElement, d3.PieArcDatum<PieData>>('path')
      .data(pie(data))
      .join('path')
      .attr('fill', d => getThemeColor(d.data.color))
      .attr('stroke', strokeColor)
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease');

    // Animate on load
    slices
      .attr('d', arc as unknown as string)
      .transition()
      .duration(800)
      .attrTween('d', function(d: d3.PieArcDatum<PieData>) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t: number): string {
          return arc(i(t) as unknown as d3.PieArcDatum<PieData>) ?? '';
        };
      });

    // Hover effects
    slices
      .on('mouseover', function(_event: MouseEvent, d: d3.PieArcDatum<PieData>) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arcHover as unknown as string);
        setHoveredSlice(d.data);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arc as unknown as string);
        setHoveredSlice(null);
      });

    // Add center circle for cleaner look
    g.append('circle')
      .attr('r', innerR - 4)
      .attr('fill', strokeColor)
      .style('opacity', 0.5);

  }, [data, width, height, innerRadius, isDark, getThemeColor]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hoveredSlice ? (
            <>
              <span className="text-3xl font-bold text-dev-text tracking-tight">
                {((hoveredSlice.value / total) * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-dev-text-muted mt-0.5">{hoveredSlice.label}</span>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold text-dev-text tracking-tight">
                {(total / 1024 / 1024).toFixed(1)}
              </span>
              <span className="text-xs text-dev-text-muted mt-0.5">MB Total</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-5">
        {data.map((d, i) => {
          const percentage = ((d.value / total) * 100).toFixed(0);
          const isHovered = hoveredSlice?.label === d.label;
          
          return (
            <div 
              key={i} 
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                isHovered ? 'bg-dev-surface-hover' : 'hover:bg-dev-surface-hover/50'
              }`}
              onMouseEnter={() => setHoveredSlice(d)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div 
                className="w-3 h-3 rounded-sm shadow-sm"
                style={{ 
                  backgroundColor: getThemeColor(d.color),
                  opacity: isHovered ? 1 : 0.85
                }}
              />
              <span className={`text-xs transition-colors ${
                isHovered ? 'text-dev-text font-medium' : 'text-dev-text-muted'
              }`}>
                {d.label}
                <span className="ml-1.5 font-mono text-dev-text-subtle">{percentage}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const PieChart = memo(PieChartComponent);
