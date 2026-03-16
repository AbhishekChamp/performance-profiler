import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  type Edge,
  type EdgeTypes,
  MiniMap,
  type Node,
  type NodeTypes,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Filter,
  GitCommit,
  Layers,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Package,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { ModuleNode } from './ModuleNode';
import { CircularEdge } from './CircularEdge';
import { 
  buildDependencyGraph, 
  calculateGraphStats, 
  filterNodes,
  generateReactFlowElements,
  getConnectedNodes,
} from '@/core/graph';
import { type LayoutAlgorithm, calculateLayout } from '@/core/graph/layout';
import type { GraphFilter, GraphNode, GraphOptions } from '@/types/graph';
import { Button } from '@/components/ui/Button';

const nodeTypes: NodeTypes = {
  moduleNode: ModuleNode as unknown as NodeTypes[string],
};

const edgeTypes: EdgeTypes = {
  circularEdge: CircularEdge as unknown as EdgeTypes[string],
};

// Module type configuration with theme-aware colors
const MODULE_TYPES = [
  { id: 'entry', label: 'Entry', icon: '●' },
  { id: 'source', label: 'Source', icon: '●' },
  { id: 'vendor', label: 'Vendor', icon: '●' },
  { id: 'dynamic', label: 'Dynamic', icon: '●' },
  { id: 'asset', label: 'Asset', icon: '●' },
] as const;

// Helper function for module colors with theme support
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

// Module detail panel
function ModuleDetailPanel({ 
  node, 
  onClose,
  graph,
  isDark,
}: { 
  node: GraphNode; 
  onClose: () => void;
  graph: ReturnType<typeof buildDependencyGraph>;
  isDark: boolean;
}): React.ReactNode {
  const color = getModuleColor(node.type, isDark);
  
  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute right-4 top-4 bottom-4 w-80 bg-[#1c2128] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-20"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#21262d]">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}25` }}
          >
            <Package size={22} style={{ color }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[#f0f6fc] truncate text-sm">{node.label}</h3>
            <p className="text-xs text-[#8b949e] font-mono">{((node.size || 0) / 1024).toFixed(1)} KB</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-[#30363d] rounded-xl transition-colors shrink-0"
        >
          <X size={20} className="text-[#8b949e]" />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Type Badge */}
        <div className="flex items-center gap-2">
          <span 
            className="px-4 py-2 rounded-full text-xs font-bold capitalize"
            style={{ 
              backgroundColor: `${color}20`,
              color,
              border: `1px solid ${color}50`,
            }}
          >
            {node.type}
          </span>
        </div>
        
        {/* Path */}
        <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d]">
          <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">Path</label>
          <p className="text-xs text-[#f0f6fc] mt-2 break-all font-mono leading-relaxed">{node.path}</p>
        </div>
        
        {/* Warnings */}
        {((node.isDuplicate ?? false) || (node.isUnused ?? false) || (node.isTreeShakable ?? false)) && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">Status</label>
            <div className="space-y-2">
              {node.isDuplicate === true && (
                <div className="flex items-center gap-3 text-sm text-[#f85149] bg-[#f85149]/10 p-4 rounded-xl border border-[#f85149]/30">
                  <div className="w-10 h-10 rounded-xl bg-[#f85149]/20 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="font-bold">Duplicate Module</p>
                    <p className="text-xs text-[#8b949e] mt-0.5">Multiple versions detected</p>
                  </div>
                </div>
              )}
              {node.isUnused === true && (
                <div className="flex items-center gap-3 text-sm text-[#d29922] bg-[#d29922]/10 p-4 rounded-xl border border-[#d29922]/30">
                  <div className="w-10 h-10 rounded-xl bg-[#d29922]/20 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="font-bold">Unused Exports</p>
                    <p className="text-xs text-[#8b949e] mt-0.5">Consider removing</p>
                  </div>
                </div>
              )}
              {node.isTreeShakable === true && (
                <div className="flex items-center gap-3 text-sm text-[#3fb950] bg-[#3fb950]/10 p-4 rounded-xl border border-[#3fb950]/30">
                  <div className="w-10 h-10 rounded-xl bg-[#3fb950]/20 flex items-center justify-center shrink-0">
                    <GitCommit size={20} />
                  </div>
                  <div>
                    <p className="font-bold">Tree-shakeable</p>
                    <p className="text-xs text-[#8b949e] mt-0.5">Optimization candidate</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Dependencies */}
        {node.dependencies.length > 0 && (
          <div>
            <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
              Dependencies
              <span className="px-2.5 py-1 bg-[#30363d] rounded-full text-[#f0f6fc] text-xs font-bold">
                {node.dependencies.length}
              </span>
            </label>
            <ul className="mt-3 space-y-1 max-h-32 overflow-y-auto bg-[#0d1117] rounded-xl border border-[#30363d] p-3">
              {node.dependencies.map(depId => {
                const dep = graph.nodes.find(n => n.id === depId);
                return dep ? (
                  <li key={depId} className="text-sm text-[#f0f6fc] flex items-center gap-2 py-1.5 px-2 hover:bg-[#21262d] rounded-lg transition-colors">
                    <span className="text-[#58a6ff]">→</span>
                    <span className="truncate font-mono">{dep.label}</span>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
        
        {/* Dependents */}
        {node.dependents.length > 0 && (
          <div>
            <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
              Dependents
              <span className="px-2.5 py-1 bg-[#30363d] rounded-full text-[#f0f6fc] text-xs font-bold">
                {node.dependents.length}
              </span>
            </label>
            <ul className="mt-3 space-y-1 max-h-32 overflow-y-auto bg-[#0d1117] rounded-xl border border-[#30363d] p-3">
              {node.dependents.map(depId => {
                const dep = graph.nodes.find(n => n.id === depId);
                return dep ? (
                  <li key={depId} className="text-sm text-[#f0f6fc] flex items-center gap-2 py-1.5 px-2 hover:bg-[#21262d] rounded-lg transition-colors">
                    <span className="text-[#3fb950]">←</span>
                    <span className="truncate font-mono">{dep.label}</span>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
        
        {/* Exports */}
        {node.exports.length > 0 && (
          <div>
            <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
              Exports
              <span className="px-2.5 py-1 bg-[#30363d] rounded-full text-[#f0f6fc] text-xs font-bold">
                {node.exports.length}
              </span>
            </label>
            <ul className="mt-3 space-y-1 max-h-32 overflow-y-auto bg-[#0d1117] rounded-xl border border-[#30363d] p-3">
              {node.exports.map(exp => (
                <li key={exp} className="text-sm text-[#f0f6fc] font-mono py-1.5 px-2">
                  {exp}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Graph controls panel
function GraphControls({
  filter,
  setFilter,
  options,
  setOptions,
  onSearch,
  stats,
  isDark,
}: {
  filter: GraphFilter;
  setFilter: (f: GraphFilter) => void;
  options: GraphOptions;
  setOptions: (o: GraphOptions) => void;
  onSearch: (query: string) => void;
  stats: ReturnType<typeof calculateGraphStats>;
  isDark: boolean;
}): React.ReactNode {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  
  const handleSearch = (): void => {
    onSearch(searchQuery);
    setFilter({ ...filter, searchQuery });
  };
  
  const toggleType = (type: GraphFilter['types'][number]): void => {
    const types = filter.types.includes(type)
      ? filter.types.filter(t => t !== type)
      : [...filter.types, type];
    setFilter({ ...filter, types });
  };
  
  const clearFilters = (): void => {
    setFilter({ ...filter, types: [], searchQuery: '' });
    setSearchQuery('');
  };
  
  const activeFiltersCount = filter.types.length + (filter.searchQuery ? 1 : 0);
  
  return (
    <div className="bg-[#1c2128] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden w-80">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-[#30363d] cursor-pointer hover:bg-[#21262d] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#58a6ff]/15 rounded-xl">
            <Filter size={16} className="text-[#58a6ff]" />
          </div>
          <span className="text-sm font-bold text-[#f0f6fc]">Controls</span>
          {activeFiltersCount > 0 && (
            <span className="px-2.5 py-1 bg-[#58a6ff] text-white text-xs rounded-full font-bold">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <button className="p-2 hover:bg-[#30363d] rounded-xl transition-colors">
          {isExpanded ? <Minimize2 size={16} className="text-[#8b949e]" /> : <Maximize2 size={16} className="text-[#8b949e]" />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="p-4 space-y-5">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">Search</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7681]" size={16} />
                <input
                  type="text"
                  placeholder="Find modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl
                             text-sm text-[#f0f6fc] placeholder-[#6e7681]
                             focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/40 focus:border-[#58a6ff] transition-all"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={handleSearch} className="px-4 py-2.5">
                Find
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d1117] rounded-xl p-3 border border-[#30363d]">
              <span className="text-[#8b949e] text-xs font-medium block mb-1">Modules</span>
              <span className="text-[#f0f6fc] font-bold text-xl">{stats.totalModules}</span>
            </div>
            <div className="bg-[#0d1117] rounded-xl p-3 border border-[#30363d]">
              <span className="text-[#8b949e] text-xs font-medium block mb-1">Dependencies</span>
              <span className="text-[#f0f6fc] font-bold text-xl">{stats.totalDependencies}</span>
            </div>
            <div className="bg-[#0d1117] rounded-xl p-3 border border-[#30363d]">
              <span className="text-[#8b949e] text-xs font-medium block mb-1">Circular</span>
              <span className={`font-bold text-xl ${stats.circularDependencyCount > 0 ? 'text-[#f85149]' : 'text-[#3fb950]'}`}>
                {stats.circularDependencyCount}
              </span>
            </div>
            <div className="bg-[#0d1117] rounded-xl p-3 border border-[#30363d]">
              <span className="text-[#8b949e] text-xs font-medium block mb-1">Duplicates</span>
              <span className={`font-bold text-xl ${stats.duplicateModuleCount > 0 ? 'text-[#d29922]' : 'text-[#3fb950]'}`}>
                {stats.duplicateModuleCount}
              </span>
            </div>
          </div>
          
          {/* Type filters */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid size={14} />
              Filter by Type
            </label>
            <div className="flex flex-wrap gap-2">
              {(['entry', 'source', 'vendor', 'dynamic'] as const).map(type => {
                const isActive = filter.types.includes(type);
                const color = getModuleColor(type, isDark);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`
                      px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all
                      ${isActive
                        ? 'text-white shadow-lg'
                        : 'bg-[#0d1117] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] hover:border-[#8b949e]'
                      }
                    `}
                    style={{
                      backgroundColor: isActive ? color : undefined,
                      borderColor: isActive ? color : undefined,
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Layout options */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
              <RotateCcw size={14} />
              Layout Algorithm
            </label>
            <select
              value={options.layout}
              onChange={(e) => setOptions({ ...options, layout: e.target.value as LayoutAlgorithm })}
              className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl
                         text-sm text-[#f0f6fc] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/40 
                         focus:border-[#58a6ff] transition-all cursor-pointer"
            >
              <option value="force">Force-Directed</option>
              <option value="hierarchical">Hierarchical</option>
              <option value="circular">Circular</option>
              <option value="grid">Grid</option>
            </select>
          </div>
          
          {/* Toggle options */}
          <div className="space-y-2 pt-2 border-t border-dev-border">
            <label className="flex items-center gap-3 text-sm text-dev-text cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={options.highlightCircular}
                  onChange={(e) => setOptions({ ...options, highlightCircular: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="w-9 h-5 bg-dev-border rounded-full peer-checked:bg-dev-accent transition-colors" />
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
              </div>
              <span className="group-hover:text-dev-accent transition-colors">Highlight circular deps</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-dev-text cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={options.highlightDuplicates}
                  onChange={(e) => setOptions({ ...options, highlightDuplicates: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="w-9 h-5 bg-dev-border rounded-full peer-checked:bg-dev-accent transition-colors" />
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
              </div>
              <span className="group-hover:text-dev-accent transition-colors">Highlight duplicates</span>
            </label>
          </div>
          
          {/* Clear filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="w-full py-2.5 text-xs text-[#8b949e] hover:text-[#f85149] transition-colors
                         border border-dashed border-[#30363d] hover:border-[#f85149]/50 rounded-xl font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Legend component
function GraphLegend({ isDark }: { isDark: boolean }): React.ReactNode {
  return (
    <div className="bg-[#1c2128] border border-[#30363d] rounded-2xl shadow-2xl p-4 space-y-4">
      <div className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">
        Module Types
      </div>
      <div className="space-y-2">
        {MODULE_TYPES.map(type => (
          <div key={type.id} className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ 
                backgroundColor: getModuleColor(type.id, isDark),
                boxShadow: `0 0 8px ${getModuleColor(type.id, isDark)}66`,
              }}
            />
            <span className="text-sm text-[#f0f6fc] capitalize font-medium">{type.label}</span>
          </div>
        ))}
      </div>
      
      <div className="pt-3 border-t border-[#30363d] space-y-2">
        <div className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">
          Indicators
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#f85149] flex items-center justify-center shadow-lg">
            <span className="text-[10px] text-white font-bold">D</span>
          </div>
          <span className="text-sm text-[#f0f6fc]">Duplicate</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#d29922] flex items-center justify-center shadow-lg">
            <span className="text-[10px] text-white font-bold">U</span>
          </div>
          <span className="text-sm text-[#f0f6fc]">Unused</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#3fb950] flex items-center justify-center shadow-lg">
            <span className="text-[10px] text-white font-bold">T</span>
          </div>
          <span className="text-sm text-[#f0f6fc]">Tree-shakeable</span>
        </div>
      </div>
    </div>
  );
}

export function DependencyGraph(): React.ReactNode {
  const { currentReport } = useAnalysisStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [isDark, setIsDark] = useState(true);
  const [filter, setFilter] = useState<GraphFilter>({
    types: [],
    searchQuery: '',
    showDuplicatesOnly: false,
    showUnusedOnly: false,
    minSize: 0,
    maxSize: null,
  });
  const [options, setOptions] = useState<GraphOptions>({
    layout: 'force',
    nodeSize: 'bySize',
    showLabels: true,
    showEdges: true,
    highlightCircular: true,
    highlightDuplicates: true,
  });
  
  const reactFlow = useReactFlow();
  
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
  
  // Build graph from current report
  const graph = useMemo(() => {
    if (!currentReport) return null;
    
    const files = currentReport.files.map(f => ({
      name: f.name,
      content: f.content || '',
      size: f.size,
    }));
    
    return buildDependencyGraph(files);
  }, [currentReport]);
  
  // Calculate stats
  const stats = useMemo(() => {
    if (!graph) {
      return {
        totalModules: 0,
        totalDependencies: 0,
        circularDependencyCount: 0,
        duplicateModuleCount: 0,
        unusedExportCount: 0,
        largestModule: null,
        deepestLevel: 0,
      };
    }
    return calculateGraphStats(graph);
  }, [graph]);
  
  // Update layout when graph or options change
  useEffect(() => {
    if (!graph) return;
    
    // Filter nodes
    const filteredNodes = filter.types.length > 0 
      ? filterNodes(graph.nodes, filter)
      : graph.nodes;
    
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graph.edges.filter(
      e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );
    
    // Calculate layout
    const layout = calculateLayout(
      filteredNodes,
      filteredEdges,
      options.layout,
      1000,
      800
    );
    
    // Generate React Flow elements
    const { nodes: flowNodes, edges: flowEdges } = generateReactFlowElements(
      { ...graph, nodes: filteredNodes, edges: filteredEdges },
      layout
    );
    
    setNodes(flowNodes as unknown as Node[]);
    setEdges(flowEdges as unknown as Edge[]);
  }, [graph, options.layout, filter, setNodes, setEdges]);
  
  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node): void => {
    if (!graph) return;
    
    const graphNode = graph.nodes.find(n => n.id === node.id);
    if (graphNode) {
      setSelectedNode(graphNode);
      
      // Highlight connected nodes
      const connected = getConnectedNodes(node.id, graph);
      setHighlightedNodes(new Set([node.id, ...connected]));
    }
  }, [graph]);
  
  // Handle search
  const handleSearch = useCallback((query: string): void => {
    if (!graph || !query) return;
    
    const matches = graph.nodes.filter(n => 
      n.label.toLowerCase().includes(query.toLowerCase()) ||
      n.path.toLowerCase().includes(query.toLowerCase())
    );
    
    if (matches.length > 0) {
      // Center on first match
      const match = matches[0];
      reactFlow.setCenter(0, 0, { zoom: 1.5, duration: 500 });
      setSelectedNode(match);
    }
  }, [graph, reactFlow]);
  
  // Clear highlighting when clicking background
  const onPaneClick = useCallback((): void => {
    setSelectedNode(null);
    setHighlightedNodes(new Set());
  }, []);
  
  // Apply highlighting to nodes - memoized to prevent infinite loops
  const highlightedNodeIds = useMemo(() => highlightedNodes, [highlightedNodes]);
  const selectedNodeId = useMemo(() => selectedNode?.id, [selectedNode]);
  
  useEffect(() => {
    if (!nodes.length) return;
    
    setNodes((nds: Node[]) => {
      // Only update if highlighting actually changed
      const needsUpdate = nds.some((node: Node) => {
        const isHighlighted = highlightedNodeIds.has(node.id);
        const isDimmed = highlightedNodeIds.size > 0 && !highlightedNodeIds.has(node.id);
        const isSelected = node.id === selectedNodeId;
        return (
          (node.data as { isHighlighted?: boolean; isDimmed?: boolean; isSelected?: boolean } | undefined)?.isHighlighted !== isHighlighted ||
          (node.data as { isHighlighted?: boolean; isDimmed?: boolean; isSelected?: boolean } | undefined)?.isDimmed !== isDimmed ||
          (node.data as { isHighlighted?: boolean; isDimmed?: boolean; isSelected?: boolean } | undefined)?.isSelected !== isSelected
        );
      });
      
      if (!needsUpdate) return nds;
      
      return nds.map((node: Node) => ({
        ...node,
        data: {
          ...node.data,
          isHighlighted: highlightedNodeIds.has(node.id),
          isDimmed: highlightedNodeIds.size > 0 && !highlightedNodeIds.has(node.id),
          isSelected: node.id === selectedNodeId,
        },
      }));
    });
  }, [highlightedNodeIds, selectedNodeId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  if (!currentReport) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-dev-surface border border-dev-border flex items-center justify-center mb-4">
          <Layers className="w-10 h-10 text-dev-text-subtle" />
        </div>
        <h3 className="text-lg font-semibold text-dev-text">No Report Available</h3>
        <p className="text-sm text-dev-text-muted mt-2 max-w-sm">
          Upload and analyze files to view the dependency graph
        </p>
      </div>
    );
  }
  
  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-dev-surface border border-dev-border flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-dev-text-subtle" />
        </div>
        <h3 className="text-lg font-semibold text-dev-text">No Dependencies Found</h3>
        <p className="text-sm text-dev-text-muted mt-2 max-w-sm">
          No import relationships detected in the analyzed files
        </p>
      </div>
    );
  }
  
  // Theme-aware colors for ReactFlow
  const gridColor = isDark ? '#21262d' : '#e1e4e8';
  const bgColor = isDark ? '#0d1117' : '#ffffff';
  const minimapMask = isDark ? 'rgba(13, 17, 23, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  
  return (
    <div 
      className="relative w-full h-full rounded-2xl overflow-hidden border border-[#30363d]"
      style={{ backgroundColor: bgColor }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
        className="!bg-transparent"
      >
        <Background 
          color={gridColor} 
          gap={24} 
          size={1}
          style={{ backgroundColor: bgColor }}
        />
        <Controls 
          className="!bg-dev-surface !border-dev-border !shadow-xl !rounded-xl"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-dev-surface !border-dev-border !shadow-xl !rounded-xl !overflow-hidden"
          nodeColor={(node): string => {
            const nodeData = node.data as { type?: string } | undefined;
            const type = nodeData?.type ?? 'source';
            return getModuleColor(type, isDark);
          }}
          maskColor={minimapMask}
          maskStrokeColor={isDark ? '#30363d' : '#d0d7de'}
          maskStrokeWidth={2}
          style={{
            backgroundColor: isDark ? '#161b22' : '#f6f8fa',
          }}
        />
        
        {/* Controls Panel */}
        <Panel position="top-left" className="!m-4">
          <GraphControls
            filter={filter}
            setFilter={setFilter}
            options={options}
            setOptions={setOptions}
            onSearch={handleSearch}
            stats={stats}
            isDark={isDark}
          />
        </Panel>
        
        {/* Legend */}
        <Panel position="bottom-right" className="!m-4">
          <GraphLegend isDark={isDark} />
        </Panel>
      </ReactFlow>
      
      {/* Module Detail Panel */}
      <AnimatePresence>
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
        {selectedNode !== null && graph !== null && (
          <ModuleDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            graph={graph}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
