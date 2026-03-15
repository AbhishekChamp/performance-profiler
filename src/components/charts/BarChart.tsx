import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useThemeStore } from '@/stores/themeStore';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  width?: number;
  height?: number;
  maxValue?: number;
  formatValue?: (value: number) => string;
}

export function BarChart({ 
  data, 
  width = 600, 
  height = 200,
  maxValue,
  formatValue = (v) => v.toString()
}: BarChartProps): React.ReactNode {
  const svgRef = useRef<SVGSVGElement>(null);
  const { resolvedMode } = useThemeStore();
  const isDark = resolvedMode === 'dark';

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 40, left: 120 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get theme-aware colors
    const textColor = isDark ? '#c9d1d9' : '#24292f';
    const textMutedColor = isDark ? '#8b949e' : '#57606a';
    const defaultBarColor = isDark ? '#58a6ff' : '#0969da';

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, maxValue ?? d3.max(data, d => d.value) ?? 0])
      .range([0, chartWidth]);

    const yScale = d3.scaleBand<string>()
      .domain(data.map(d => d.label))
      .range([0, chartHeight])
      .padding(0.3);

    // Bars
    g.selectAll<SVGRectElement, BarData>('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.label) ?? 0)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d.color ?? defaultBarColor)
      .attr('rx', 2)
      .transition()
      .duration(750)
      .delay((d, i) => i * 50)
      .attr('width', d => xScale(d.value));

    // Y axis labels
    const yAxis = g.append('g');
    yAxis.call(d3.axisLeft(yScale).tickSize(0));
    yAxis.select('.domain').remove();
    yAxis.selectAll<SVGTextElement, string>('text')
      .style('fill', textColor)
      .style('font-size', '11px')
      .call(wrap, margin.left - 10);

    // Value labels
    g.selectAll<SVGTextElement, BarData>('.value-label')
      .data(data)
      .join('text')
      .attr('class', 'value-label')
      .attr('x', d => xScale(d.value) + 5)
      .attr('y', d => (yScale(d.label) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('fill', textMutedColor)
      .style('font-size', '11px')
      .style('opacity', 0)
      .text(d => formatValue(d.value))
      .transition()
      .duration(750)
      .delay((d, i) => i * 50 + 300)
      .style('opacity', 1);

    function wrap(textSelection: d3.Selection<SVGTextElement, string, SVGGElement, unknown>, wrapWidth: number): void {
      textSelection.each(function() {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word: string | undefined;
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1;
        const y = text.attr('y');
        const dy = parseFloat(text.attr('dy')) || 0;
        let tspan = text.text(null).append('tspan').attr('x', -10).attr('y', y).attr('dy', `${dy  }em`);
        
         
        while ((word = words.pop()) !== undefined) {
          line.push(word);
          tspan.text(line.join(' '));
          if ((tspan.node()?.getComputedTextLength() ?? 0) > wrapWidth) {
            line.pop();
            tspan.text(line.join(' '));
            line = [word];
            tspan = text.append('tspan').attr('x', -10).attr('y', y).attr('dy', `${++lineNumber * lineHeight + dy  }em`).text(word);
          }
        }
      });
    }

  }, [data, width, height, maxValue, formatValue, isDark]);

  return <svg ref={svgRef} width={width} height={height} />;
}
