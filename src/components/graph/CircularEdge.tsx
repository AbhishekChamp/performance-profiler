import { memo, useEffect, useState } from 'react';
import { type EdgeProps, getBezierPath } from '@xyflow/react';

interface CircularEdgeData extends Record<string, unknown> {
  type: 'static' | 'dynamic' | 'circular';
  count: number;
}

// Extended edge props that include our custom data
interface ExtendedEdgeProps extends EdgeProps {
  data?: CircularEdgeData;
}

function CircularEdgeComponent(props: ExtendedEdgeProps): React.ReactNode {
  const { 
    id, 
    sourceX, 
    sourceY, 
    targetX, 
    targetY, 
    sourcePosition, 
    targetPosition, 
    style = {}, 
    data,
    selected 
  } = props;
  
  const [isDark, setIsDark] = useState(true);
  
  // Theme detection
  useEffect(() => {
    const updateTheme = (): void => {
      const dark = document.documentElement.classList.contains('dark');
      setIsDark(dark);
    };
    
    updateTheme();
    
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  const edgeData = data;
  const isCircular = edgeData?.type === 'circular';
  const isDynamic = edgeData?.type === 'dynamic';
  const count = edgeData?.count ?? 1;
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  
  // Theme-aware colors
  const strokeColor = isCircular 
    ? (isDark ? '#f85149' : '#cf222e')
    : isDynamic
      ? (isDark ? '#d29922' : '#9a6700')
      : (isDark ? '#58a6ff' : '#0969da');
  
  const strokeWidth = Math.min(5, 1.5 + count * 0.5);
  const strokeDasharray = isDynamic ? '6,4' : 'none';
  
  const labelBg = isDark ? '#0d1117' : '#ffffff';
  
  return (
    <>
      {/* Background line for hover area */}
      <path
        id={`${id}-bg`}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(12, strokeWidth + 6)}
        className="cursor-pointer"
      />
      
      {/* Main edge line */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        style={{
          ...(style as React.CSSProperties),
          filter: selected === true ? `drop-shadow(0 0 8px ${strokeColor}60)` : undefined,
        }}
        className="transition-all duration-200"
        markerEnd={`url(#arrow-${id})`}
      />
      
      {/* Arrow marker */}
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={strokeColor}
          />
        </marker>
      </defs>
      
      {/* Count label for multiple imports */}
      {count > 1 && (
        <g transform={`translate(${labelX},${labelY})`}>
          <circle
            r={12}
            fill={labelBg}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <text
            y={4}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="11"
            fontWeight="bold"
          >
            {count}
          </text>
        </g>
      )}
      
      {/* Circular dependency warning indicator */}
      {isCircular && (
        <g transform={`translate(${labelX},${labelY})`}>
          <circle
            r={10}
            fill={strokeColor}
            className="animate-pulse"
          />
          <text
            y={4}
            textAnchor="middle"
            fill="white"
            fontSize="12"
            fontWeight="bold"
          >
            !
          </text>
        </g>
      )}
    </>
  );
}

export const CircularEdge = memo(CircularEdgeComponent);
CircularEdge.displayName = 'CircularEdge';
