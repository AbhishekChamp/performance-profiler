import { memo, useEffect, useState } from 'react';
import { Handle, type NodeProps, Position } from '@xyflow/react';

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

// Get theme-aware module color
function getModuleColor(type: string, isDark: boolean): string {
  const colors: Record<string, { dark: string; light: string }> = {
    entry: { dark: '#58a6ff', light: '#0969da' },
    source: { dark: '#3fb950', light: '#1a7f37' },
    vendor: { dark: '#f0883e', light: '#bc4c00' },
    asset: { dark: '#a371f7', light: '#8250df' },
    dynamic: { dark: '#d29922', light: '#9a6700' },
  };
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return colors[type]?.[isDark ? 'dark' : 'light'] ?? (isDark ? '#8b949e' : '#6e7781');
}

function ModuleNodeComponent({ data, selected }: ExtendedNodeProps): React.ReactNode {
  const [isHovered, setIsHovered] = useState(false);
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
  
  const nodeType = data.type;
  const size = Math.max(40, Math.min(120, 40 + Math.log10((data.size || 0) + 1) * 10));
  const color = getModuleColor(nodeType, isDark);
  const isDuplicate = data.isDuplicate ?? false;
  const isUnused = data.isUnused ?? false;
  
  // Theme-aware colors
  const strokeColor = selected === true || data.isSelected === true 
    ? color
    : isDuplicate 
      ? (isDark ? '#f85149' : '#cf222e')
      : (isDark ? '#30363d' : '#d0d7de');
  
  const strokeWidth = selected === true || data.isSelected === true ? 3 : isHovered ? 2 : 1.5;
  const opacity = data.isDimmed === true ? 0.25 : 1;
  
  // Background colors based on theme
  const labelBg = isDark ? '#1c2128' : '#ffffff';
  const labelBorder = isDark ? '#484f58' : '#d0d7de';
  const tooltipBg = isDark ? '#0d1117' : '#ffffff';
  const tooltipBorder = isDark ? '#484f58' : '#d0d7de';
  
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
        <defs>
          {/* Gradient for the node */}
          <radialGradient id={`grad-${data.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="70%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </radialGradient>
          
          {/* Glow filter */}
          <filter id={`glow-${data.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer glow for selected/hovered */}
        {(selected === true || data.isSelected === true || isHovered) && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 + 4}
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeOpacity={0.3}
            className="animate-pulse"
          />
        )}
        
        {/* Main circle with gradient */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill={`url(#grad-${data.id})`}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          className="transition-all duration-200"
          style={{
            filter: selected === true || data.isSelected === true ? `drop-shadow(0 0 8px ${color}50)` : undefined,
          }}
        />
        
        {/* Inner circle for type indication */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 5}
          fill={color}
          fillOpacity={0.8}
          className="transition-all duration-200"
        />
        
        {/* Duplicate indicator */}
        {isDuplicate === true && (
          <g>
            <circle
              cx={size - 8}
              cy={8}
              r={7}
              fill={isDark ? '#f85149' : '#cf222e'}
              stroke={isDark ? '#0d1117' : '#ffffff'}
              strokeWidth={2}
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
          </g>
        )}
        
        {/* Unused export indicator */}
        {isUnused === true && (
          <g>
            <circle
              cx={8}
              cy={size - 8}
              r={7}
              fill={isDark ? '#d29922' : '#9a6700'}
              stroke={isDark ? '#0d1117' : '#ffffff'}
              strokeWidth={2}
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
          </g>
        )}
        
        {/* Tree-shakable indicator */}
        {data.isTreeShakable === true && (
          <g>
            <circle
              cx={size - 8}
              cy={size - 8}
              r={7}
              fill={isDark ? '#3fb950' : '#1a7f37'}
              stroke={isDark ? '#0d1117' : '#ffffff'}
              strokeWidth={2}
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
          </g>
        )}
      </svg>
      
      {/* Label */}
      <div
        className={`
          absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5
          rounded-lg text-xs whitespace-nowrap font-bold
          transition-all duration-200 shadow-xl
          ${isHovered || selected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        style={{ 
          top: size,
          backgroundColor: labelBg,
          border: `1.5px solid ${labelBorder}`,
          color: isDark ? '#f0f6fc' : '#1f2328',
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        {data.label}
      </div>
      
      {/* Tooltip on hover */}
      {isHovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-3 -translate-y-full z-50"
          style={{ minWidth: '180px' }}
        >
          <div 
            className="px-4 py-3 rounded-xl shadow-2xl"
            style={{ 
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.5)' : '0 8px 30px rgba(0,0,0,0.15)',
            }}
          >
            <div 
              className="font-semibold text-sm truncate" 
              style={{ color: isDark ? '#f0f6fc' : '#1f2328' }}
            >
              {data.label}
            </div>
            <div 
              className="text-xs mt-1 flex items-center gap-2" 
              style={{ color: isDark ? '#8b949e' : '#57606a' }}
            >
              <span className="font-mono">{((data.size || 0) / 1024).toFixed(1)} KB</span>
              <span>•</span>
              <span style={{ color }}>{nodeType}</span>
            </div>
            {(data.exports.length > 0 || data.dependencies.length > 0) && (
              <div 
                className="text-xs mt-2 pt-2 flex items-center gap-3" 
                style={{ 
                  color: isDark ? '#8b949e' : '#57606a',
                  borderTop: `1px solid ${isDark ? '#21262d' : '#e1e4e8'}`,
                }}
              >
                {data.exports.length > 0 && (
                  <span>{data.exports.length} exports</span>
                )}
                {data.dependencies.length > 0 && (
                  <span>{data.dependencies.length} deps</span>
                )}
              </div>
            )}
          </div>
          
          {/* Arrow */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
            style={{
              backgroundColor: tooltipBg,
              borderRight: `1px solid ${tooltipBorder}`,
              borderBottom: `1px solid ${tooltipBorder}`,
            }}
          />
        </div>
      )}
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !border-2"
        style={{ 
          backgroundColor: isDark ? '#0d1117' : '#ffffff',
          borderColor: color,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !border-2"
        style={{ 
          backgroundColor: isDark ? '#0d1117' : '#ffffff',
          borderColor: color,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !border-2"
        id="left"
        style={{ 
          backgroundColor: isDark ? '#0d1117' : '#ffffff',
          borderColor: color,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !border-2"
        id="right"
        style={{ 
          backgroundColor: isDark ? '#0d1117' : '#ffffff',
          borderColor: color,
        }}
      />
    </div>
  );
}

export const ModuleNode = memo(ModuleNodeComponent);
ModuleNode.displayName = 'ModuleNode';
