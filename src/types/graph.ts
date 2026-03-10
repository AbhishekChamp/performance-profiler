/**
 * Types for Interactive Dependency Graph Visualization (Feature 6)
 */

export type ModuleType = 'entry' | 'source' | 'vendor' | 'asset' | 'dynamic';

export interface GraphNode {
  id: string;
  label: string;
  type: ModuleType;
  size: number;
  path: string;
  exports: string[];
  imports: string[];
  isDuplicate?: boolean;
  isUnused?: boolean;
  isTreeShakable?: boolean;
  dependencies: string[]; // IDs of modules this module imports
  dependents: string[]; // IDs of modules that import this module
  level: number; // Depth in dependency tree
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'static' | 'dynamic' | 'circular';
  count: number; // Import frequency
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  entryPoints: string[];
  circularDependencies: string[][]; // Arrays of node IDs forming cycles
  totalSize: number;
  moduleCount: number;
  vendorCount: number;
}

export interface GraphLayout {
  x: number;
  y: number;
}

export interface GraphFilter {
  types: ModuleType[];
  searchQuery: string;
  showDuplicatesOnly: boolean;
  showUnusedOnly: boolean;
  minSize: number;
  maxSize: number | null;
}

export interface GraphStats {
  totalModules: number;
  totalDependencies: number;
  circularDependencyCount: number;
  duplicateModuleCount: number;
  unusedExportCount: number;
  largestModule: GraphNode | null;
  deepestLevel: number;
}

export type LayoutAlgorithm = 'force' | 'hierarchical' | 'circular' | 'grid';

export interface GraphOptions {
  layout: LayoutAlgorithm;
  nodeSize: 'uniform' | 'bySize' | 'byDependencies';
  showLabels: boolean;
  showEdges: boolean;
  highlightCircular: boolean;
  highlightDuplicates: boolean;
}
