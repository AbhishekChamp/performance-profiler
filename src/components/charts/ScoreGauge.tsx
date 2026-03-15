import { memo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getScoreColor, getScoreLabel } from '@/core/scoring';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
  showLabel?: boolean;
}

function ScoreGaugeComponent({ score, size = 120, label, showLabel = true }: ScoreGaugeProps): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const color = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  // Get theme from CSS variable instead of store to prevent re-renders
  const isDark = typeof document !== 'undefined' 
    ? document.documentElement.classList.contains('dark')
    : true;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = 10;
    const radius = (size - margin * 2) / 2;
    const innerRadius = radius * 0.75;

    const g = svg
      .append('g')
      .attr('transform', `translate(${size / 2}, ${size / 2})`);

    // Get theme-aware colors from CSS variables
    const bgColor = isDark ? '#30363d' : '#d0d7de';
    const labelColor = isDark ? '#8b949e' : '#57606a';

    // Background arc
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .cornerRadius(4);

    g.append('path')
      .attr('d', arc.endAngle(Math.PI / 2) as unknown as string)
      .attr('fill', bgColor);

    // Score arc
    const scoreAngle = -Math.PI / 2 + (score / 100) * Math.PI;
    
    g.append('path')
      .attr('d', arc.endAngle(-Math.PI / 2) as unknown as string)
      .attr('fill', color)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attrTween('d', function() {
        const interpolate = d3.interpolate(-Math.PI / 2, scoreAngle);
        return function(t: number) {
          const angle = interpolate(t);
          const arcGenerator = arc.endAngle(angle);
          return (arcGenerator as unknown as () => string)() || '';
        };
      });

    // Center text
    const textGroup = g.append('g');
    
    textGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.1em')
      .style('font-size', '28px')
      .style('font-weight', '600')
      .style('fill', color)
      .text('0')
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .tween('text', function() {
        const i = d3.interpolate(0, score);
        return function(t: number) {
          this.textContent = Math.round(i(t)).toString();
        };
      });

    if (showLabel) {
      textGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .style('font-size', '11px')
        .style('fill', labelColor)
        .text(scoreLabel);
    }

  }, [score, size, color, showLabel, scoreLabel, isDark]);

  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef} width={size} height={size} />
      {label != null && label !== '' && (
        <span className="text-xs text-dev-text-muted mt-2">{label}</span>
      )}
    </div>
  );
}

export const ScoreGauge = memo(ScoreGaugeComponent);
