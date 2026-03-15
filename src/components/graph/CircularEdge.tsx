import { memo } from 'react';
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
  
  const edgeData = data;
  const isCircular = edgeData?.type === 'circular';
  const count = edgeData?.count ?? 1;
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  
  const strokeColor = isCircular ? '#f85149' : '#58a6ff';
  const strokeWidth = Math.min(4, 1 + count * 0.5);
  const strokeDasharray = edgeData?.type === 'dynamic' ? '5,5' : 'none';
  
  return (
    <>
      {/* Background line for hover area */}
      <path
        id={`${id}-bg`}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(10, strokeWidth + 4)}
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
        style={{
          ...(style as React.CSSProperties),
          filter: selected === true ? 'drop-shadow(0 0 4px rgba(88, 166, 255, 0.5))' : undefined,
        }}
        className="transition-all duration-200"
      />
      
      {/* Arrow marker */}
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
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
            r={10}
            fill="#161b22"
            stroke={strokeColor}
            strokeWidth={1}
          />
          <text
            y={4}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="10"
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
            r={8}
            fill="#f85149"
          />
          <text
            y={3}
            textAnchor="middle"
            fill="white"
            fontSize="10"
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
