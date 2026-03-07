import { useEffect, useRef, useState } from 'react';
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

export function PieChart({ 
  data, 
  width = 280, 
  height = 280,
  innerRadius = 0.6 
}: PieChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredSlice, setHoveredSlice] = useState<PieData | null>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const radius = Math.min(width, height) / 2 - 20;
    const innerR = radius * innerRadius;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Create pie generator
    const pie = d3.pie<PieData>()
      .value(d => d.value)
      .sort(null);

    // Create arc generators
    const arc = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(innerR)
      .outerRadius(radius);

    const arcHover = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(innerR)
      .outerRadius(radius + 5);

    // Draw slices
    const slices = g.selectAll('path')
      .data(pie(data))
      .join('path')
      .attr('fill', d => d.data.color)
      .attr('stroke', '#0d1117')
      .attr('stroke-width', 2)
      .attr('d', arc as any)
      .on('mouseover', function(_event: MouseEvent, d: d3.PieArcDatum<PieData>) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover as any);
        setHoveredSlice(d.data);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc as any);
        setHoveredSlice(null);
      });

    // Animate on load
    slices
      .transition()
      .duration(750)
      .attrTween('d', function(d: any) {
        const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
        return function(t: number) {
          d.endAngle = i(t);
          return (arc as any)(d);
        };
      });

  }, [data, width, height, innerRadius]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg ref={svgRef} width={width} height={height} />
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hoveredSlice ? (
            <>
              <span className="text-2xl font-semibold text-dev-text">
                {((hoveredSlice.value / total) * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-dev-text-muted">{hoveredSlice.label}</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-semibold text-dev-text">
                {(total / 1024 / 1024).toFixed(1)}
              </span>
              <span className="text-xs text-dev-text-muted">MB</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: d.color }}
            />
            <span className="text-xs text-dev-text-muted">
              {d.label} ({((d.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
