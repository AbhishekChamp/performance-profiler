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
  GitCommit,
  Layers,
  Package,
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

// Module detail panel
function ModuleDetailPanel({ 
  node, 
  onClose,
  graph,
}: { 
  node: GraphNode; 
  onClose: () => void;
  graph: ReturnType<typeof buildDependencyGraph>;
}): React.ReactNode {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute right-4 top-4 bottom-4 w-80 glass-panel rounded-xl overflow-hidden flex flex-col z-10"
    >
      <div className="p-4 border-b border-dev-border flex items-center justify-between">
        <h3 className="font-semibold text-dev-text truncate">{node.label}</h3>
        <button onClick={onClose} className="p-1 hover:bg-dev-surface-hover rounded">
          <X size={18} className="text-dev-text-muted" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Type & Size */}
        <div className="flex items-center gap-2">
          <span 
            className="px-2 py-1 rounded text-xs font-medium capitalize"
            style={{ 
              backgroundColor: `${getModuleColor(node.type)}20`,
              color: getModuleColor(node.type),
            }}
          >
            {node.type}
          </span>
          <span className="text-sm text-dev-text-muted">
            {(node.size / 1024).toFixed(2)} KB
          </span>
        </div>
        
        {/* Path */}
        <div>
          <label className="text-xs text-dev-text-muted uppercase tracking-wide">Path</label>
          <p className="text-sm text-dev-text break-all">{node.path}</p>
        </div>
        
        {/* Warnings */}
        {((node.isDuplicate ?? false) || (node.isUnused ?? false) || (node.isTreeShakable ?? false)) && (
          <div className="space-y-2">
            <label className="text-xs text-dev-text-muted uppercase tracking-wide">Warnings</label>
            {node.isDuplicate === true && (
              <div className="flex items-center gap-2 text-sm text-dev-warning">
                <AlertTriangle size={14} />
                <span>Duplicate module detected</span>
              </div>
            )}
            {node.isUnused === true && (
              <div className="flex items-center gap-2 text-sm text-dev-warning">
                <AlertTriangle size={14} />
                <span>Unused exports</span>
              </div>
            )}
            {node.isTreeShakable === true && (
              <div className="flex items-center gap-2 text-sm text-dev-success">
                <GitCommit size={14} />
                <span>Tree-shaking candidate</span>
              </div>
            )}
          </div>
        )}
        
        {/* Dependencies */}
        {node.dependencies.length > 0 && (
          <div>
            <label className="text-xs text-dev-text-muted uppercase tracking-wide">
              Dependencies ({node.dependencies.length})
            </label>
            <ul className="mt-1 space-y-1 max-h-32 overflow-y-auto">
              {node.dependencies.map(depId => {
                const dep = graph.nodes.find(n => n.id === depId);
                return dep ? (
                  <li key={depId} className="text-sm text-dev-text truncate">
                    → {dep.label}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
        
        {/* Dependents */}
        {node.dependents.length > 0 && (
          <div>
            <label className="text-xs text-dev-text-muted uppercase tracking-wide">
              Dependents ({node.dependents.length})
            </label>
            <ul className="mt-1 space-y-1 max-h-32 overflow-y-auto">
              {node.dependents.map(depId => {
                const dep = graph.nodes.find(n => n.id === depId);
                return dep ? (
                  <li key={depId} className="text-sm text-dev-text truncate">
                    ← {dep.label}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
        
        {/* Exports */}
        {node.exports.length > 0 && (
          <div>
            <label className="text-xs text-dev-text-muted uppercase tracking-wide">
              Exports ({node.exports.length})
            </label>
            <ul className="mt-1 space-y-1 max-h-32 overflow-y-auto">
              {node.exports.map(exp => (
                <li key={exp} className="text-sm text-dev-text font-mono">
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

// Helper function for colors
function getModuleColor(type: string): string {
  const colors: Record<string, string> = {
    entry: '#58a6ff',
    source: '#3fb950',
    vendor: '#f0883e',
    asset: '#a371f7',
    dynamic: '#d29922',
  };
  return colors[type] || '#8b949e';
}

// Graph controls panel
function GraphControls({
  filter,
  setFilter,
  options,
  setOptions,
  onSearch,
  stats,
}: {
  filter: GraphFilter;
  setFilter: (f: GraphFilter) => void;
  options: GraphOptions;
  setOptions: (o: GraphOptions) => void;
  onSearch: (query: string) => void;
  stats: ReturnType<typeof calculateGraphStats>;
}): React.ReactNode {
  const [searchQuery, setSearchQuery] = useState('');
  
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
  
  return (
    <div className="glass-panel rounded-xl p-4 space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dev-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-3 py-2 bg-dev-bg border border-dev-border rounded-lg
                       text-sm text-dev-text placeholder-dev-text-subtle
                       focus:outline-none focus:ring-2 focus:ring-dev-accent/50"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleSearch}>
          Find
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-dev-surface rounded p-2">
          <span className="text-dev-text-muted">Modules:</span>
          <span className="ml-1 text-dev-text font-semibold">{stats.totalModules}</span>
        </div>
        <div className="bg-dev-surface rounded p-2">
          <span className="text-dev-text-muted">Dependencies:</span>
          <span className="ml-1 text-dev-text font-semibold">{stats.totalDependencies}</span>
        </div>
        <div className="bg-dev-surface rounded p-2">
          <span className="text-dev-text-muted">Circular:</span>
          <span className={`ml-1 font-semibold ${stats.circularDependencyCount > 0 ? 'text-dev-danger' : 'text-dev-text'}`}>
            {stats.circularDependencyCount}
          </span>
        </div>
        <div className="bg-dev-surface rounded p-2">
          <span className="text-dev-text-muted">Duplicates:</span>
          <span className={`ml-1 font-semibold ${stats.duplicateModuleCount > 0 ? 'text-dev-warning' : 'text-dev-text'}`}>
            {stats.duplicateModuleCount}
          </span>
        </div>
      </div>
      
      {/* Type filters */}
      <div>
        <label className="text-xs text-dev-text-muted uppercase tracking-wide mb-2 block">
          Filter by Type
        </label>
        <div className="flex flex-wrap gap-2">
          {(['entry', 'source', 'vendor', 'dynamic'] as const).map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`
                px-2 py-1 rounded text-xs font-medium capitalize transition-colors
                ${filter.types.includes(type)
                  ? 'text-white'
                  : 'bg-dev-surface text-dev-text-muted hover:text-dev-text'
                }
              `}
              style={{
                backgroundColor: filter.types.includes(type) ? getModuleColor(type) : undefined,
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      {/* Layout options */}
      <div>
        <label className="text-xs text-dev-text-muted uppercase tracking-wide mb-2 block">
          Layout
        </label>
        <select
          value={options.layout}
          onChange={(e) => setOptions({ ...options, layout: e.target.value as LayoutAlgorithm })}
          className="w-full px-3 py-2 bg-dev-bg border border-dev-border rounded-lg
                     text-sm text-dev-text focus:outline-none focus:ring-2 focus:ring-dev-accent/50"
        >
          <option value="force">Force-Directed</option>
          <option value="hierarchical">Hierarchical</option>
          <option value="circular">Circular</option>
          <option value="grid">Grid</option>
        </select>
      </div>
      
      {/* Toggle options */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-dev-text">
          <input
            type="checkbox"
            checked={options.highlightCircular}
            onChange={(e) => setOptions({ ...options, highlightCircular: e.target.checked })}
            className="rounded border-dev-border bg-dev-bg text-dev-accent"
          />
          Highlight circular deps
        </label>
        <label className="flex items-center gap-2 text-sm text-dev-text">
          <input
            type="checkbox"
            checked={options.highlightDuplicates}
            onChange={(e) => setOptions({ ...options, highlightDuplicates: e.target.checked })}
            className="rounded border-dev-border bg-dev-bg text-dev-accent"
          />
          Highlight duplicates
        </label>
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
        <Layers className="w-16 h-16 mb-4 text-dev-text-subtle" />
        <h3 className="text-lg font-medium text-dev-text">No Report Available</h3>
        <p className="text-sm text-dev-text-muted mt-2">
          Upload and analyze files to view the dependency graph
        </p>
      </div>
    );
  }
  
  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Package className="w-16 h-16 mb-4 text-dev-text-subtle" />
        <h3 className="text-lg font-medium text-dev-text">No Dependencies Found</h3>
        <p className="text-sm text-dev-text-muted mt-2">
          No import relationships detected in the analyzed files
        </p>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full">
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
      >
        <Background color="#30363d" gap={20} size={1} />
        <Controls className="!bg-dev-surface !border-dev-border" />
        <MiniMap
          className="!bg-dev-surface !border-dev-border"
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          nodeColor={(node): string => getModuleColor((node.data.type as string) ?? 'source')}
          maskColor="rgba(13, 17, 23, 0.7)"
        />
        
        {/* Controls Panel */}
        <Panel position="top-left" className="m-4">
          <GraphControls
            filter={filter}
            setFilter={setFilter}
            options={options}
            setOptions={setOptions}
            onSearch={handleSearch}
            stats={stats}
          />
        </Panel>
        
        {/* Legend */}
        <Panel position="bottom-right" className="m-4">
          <div className="glass-panel rounded-lg p-3 space-y-2">
            <div className="text-xs text-dev-text-muted uppercase tracking-wide mb-2">
              Module Types
            </div>
            {(['entry', 'source', 'vendor', 'dynamic', 'asset'] as const).map(type => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getModuleColor(type) }}
                />
                <span className="text-xs text-dev-text capitalize">{type}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-dev-border space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-dev-danger flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">D</span>
                </div>
                <span className="text-xs text-dev-text">Duplicate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-dev-warning flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">U</span>
                </div>
                <span className="text-xs text-dev-text">Unused</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
      
      {/* Module Detail Panel */}
      <AnimatePresence>
        {selectedNode !== null && (
          <ModuleDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            graph={graph}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
