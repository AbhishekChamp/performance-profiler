import { memo, useState } from 'react';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import { getModuleColor } from '@/core/graph/layout';

interface ModuleNodeData extends Record<string, unknown> {
  label: string;
  id: string;
  type: string;
  size: number;
  path: string;
  exports: string[];
  imports: string[];
  dependencies: string[];
  dependents: string[];
  level: number;
  isDuplicate?: boolean;
  isUnused?: boolean;
  isTreeShakable?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isSelected?: boolean;
}

// Extended node props that include our custom data
interface ExtendedNodeProps extends NodeProps {
  data: ModuleNodeData;
}

function ModuleNodeComponent({ data, selected }: ExtendedNodeProps): React.ReactNode {
  const [isHovered, setIsHovered] = useState(false);
  
  const size = Math.max(40, Math.min(120, 40 + Math.log10((data.size || 0) + 1) * 10));
  const color = getModuleColor(data.type || 'source');
  const isDuplicate = data.isDuplicate ?? false;
  const isUnused = data.isUnused ?? false;
  
  // Dynamic styles based on state
  const opacity = data.isDimmed === true ? 0.3 : 1;
  const strokeWidth = selected === true || data.isSelected === true ? 3 : isHovered ? 2 : 1;
  const strokeColor = selected === true || data.isSelected === true ? '#58a6ff' : isDuplicate ? '#f85149' : '#30363d';
  
  return (
    <div
      className="relative"
      style={{ 
        width: size, 
        height: size,
        opacity,
        transition: 'opacity 0.2s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Node Shape */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Main circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill={color}
          fillOpacity={0.2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          className="transition-all duration-200"
        />
        
        {/* Inner circle for type indication */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 4}
          fill={color}
          fillOpacity={0.6}
        />
        
        {/* Duplicate indicator */}
        {isDuplicate === true && (
          <>
            <circle
              cx={size - 8}
              cy={8}
              r={6}
              fill="#f85149"
            />
            <text
              x={size - 8}
              y={11}
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="bold"
            >
              D
            </text>
          </>
        )}
        
        {/* Unused export indicator */}
        {isUnused === true && (
          <>
            <circle
              cx={8}
              cy={size - 8}
              r={6}
              fill="#d29922"
            />
            <text
              x={8}
              y={size - 5}
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="bold"
            >
              U
            </text>
          </>
        )}
        
        {/* Tree-shakable indicator */}
        {data.isTreeShakable === true && (
          <>
            <circle
              cx={size - 8}
              cy={size - 8}
              r={6}
              fill="#3fb950"
            />
            <text
              x={size - 8}
              y={size - 5}
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="bold"
            >
              T
            </text>
          </>
        )}
      </svg>
      
      {/* Label */}
      <div
        className={`
          absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5
          bg-dev-surface border border-dev-border rounded
          text-xs text-dev-text whitespace-nowrap
          transition-opacity duration-200
          ${isHovered || selected ? 'opacity-100' : 'opacity-70'}
        `}
        style={{ top: size }}
      >
        {data.label}
      </div>
      
      {/* Size tooltip on hover */}
      {isHovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full
                     px-2 py-1 bg-dev-surface border border-dev-border rounded
                     text-xs text-dev-text whitespace-nowrap z-10"
        >
          <div className="font-medium">{data.label}</div>
          <div className="text-dev-text-muted">
            {((data.size || 0) / 1024).toFixed(2)} KB • {data.type}
          </div>
          {data.exports.length > 0 && (
            <div className="text-dev-text-muted">
              {data.exports.length} exports
            </div>
          )}
          {data.dependencies.length > 0 && (
            <div className="text-dev-text-muted">
              {data.dependencies.length} deps
            </div>
          )}
        </div>
      )}
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-dev-accent !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-dev-accent !w-2 !h-2"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-dev-accent !w-2 !h-2"
        id="left"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-dev-accent !w-2 !h-2"
        id="right"
      />
    </div>
  );
}

export const ModuleNode = memo(ModuleNodeComponent);
ModuleNode.displayName = 'ModuleNode';
