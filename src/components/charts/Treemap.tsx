import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';

interface TreemapNode {
  name: string;
  value: number;
  color?: string;
}

interface TreemapProps {
  data: TreemapNode[];
  width?: number;
  height?: number;
}

interface LayoutNode {
  name: string;
  value: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  percentage: number;
}

export function Treemap({ 
  data, 
  width = 600, 
  height = 400 
}: TreemapProps): React.ReactNode {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const total = data.reduce((acc, item) => acc + item.value, 0);

  // Calculate layout using useMemo
  const nodes = useMemo((): LayoutNode[] => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const layoutNodes: LayoutNode[] = [];

    let x = 0, y = 0;
    let rowHeight = 0;

    const colors = [
      'var(--dev-accent)',
      'var(--dev-success)',
      'var(--dev-warning)',
      'var(--dev-info)',
      'var(--dev-danger)',
      'var(--dev-text-muted)',
    ];

    sorted.forEach((item, index) => {
      const ratio = item.value / total;
      const area = ratio * width * height;
      const nodeWidth = Math.sqrt(area * 1.5);
      const nodeHeight = area / nodeWidth;

      if (x + nodeWidth > width) {
        x = 0;
        y += rowHeight;
        rowHeight = 0;
      }

      layoutNodes.push({
        name: item.name,
        value: item.value,
        x,
        y,
        w: Math.min(nodeWidth, width - x),
        h: nodeHeight,
        color: item.color ?? colors[index % colors.length],
        percentage: ratio * 100,
      });

      x += nodeWidth;
      rowHeight = Math.max(rowHeight, nodeHeight);
    });

    return layoutNodes;
  }, [data, total, width, height]);

  return (
    <div 
      className="relative bg-[var(--dev-surface)] rounded-xl overflow-hidden"
      style={{ width, height }}
    >
      {nodes.map((node, index) => {
        const isHovered = hoveredNode === node.name;

        return (
          <motion.div
            key={index}
            className="absolute flex flex-col justify-center items-center p-2 cursor-pointer"
            style={{
              left: node.x,
              top: node.y,
              width: node.w,
              height: node.h,
              backgroundColor: node.color,
              opacity: isHovered ? 0.9 : 0.7,
              border: '1px solid var(--dev-bg)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isHovered ? 0.9 : 0.7, 
              scale: isHovered ? 1.02 : 1,
              zIndex: isHovered ? 10 : 1,
            }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setHoveredNode(node.name)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <span className="text-xs font-medium text-white truncate w-full text-center">
              {node.name}
            </span>
            <span className="text-xs text-white/80">
              {node.percentage.toFixed(1)}%
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
