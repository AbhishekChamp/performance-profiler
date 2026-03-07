import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

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
}: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 40, left: 120 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, maxValue || d3.max(data, d => d.value) || 0])
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
      .attr('y', d => yScale(d.label) || 0)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d.color || '#58a6ff')
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
      .style('fill', '#c9d1d9')
      .style('font-size', '11px')
      .call(wrap, margin.left - 10);

    // Value labels
    g.selectAll<SVGTextElement, BarData>('.value-label')
      .data(data)
      .join('text')
      .attr('class', 'value-label')
      .attr('x', d => xScale(d.value) + 5)
      .attr('y', d => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('fill', '#8b949e')
      .style('font-size', '11px')
      .style('opacity', 0)
      .text(d => formatValue(d.value))
      .transition()
      .duration(750)
      .delay((d, i) => i * 50 + 300)
      .style('opacity', 1);

    function wrap(text: d3.Selection<SVGTextElement, string, SVGGElement, unknown>, width: number) {
      text.each(function(this: SVGTextElement) {
        const self = d3.select(this);
        const words = self.text().split(/\s+/).reverse();
        let word: string | undefined;
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1;
        const y = self.attr('y');
        const dy = parseFloat(self.attr('dy')) || 0;
        let tspan = self.text(null).append('tspan').attr('x', -10).attr('y', y).attr('dy', dy + 'em');
        
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(' '));
          if ((tspan.node()?.getComputedTextLength() || 0) > width) {
            line.pop();
            tspan.text(line.join(' '));
            line = [word];
            tspan = self.append('tspan').attr('x', -10).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
          }
        }
      });
    }

  }, [data, width, height, maxValue, formatValue]);

  return <svg ref={svgRef} width={width} height={height} />;
}
