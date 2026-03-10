import type { 
  DependencyGraph, 
  GraphNode, 
  GraphEdge, 
  ModuleType,
  GraphStats,
  GraphFilter,
  LayoutAlgorithm,
  GraphLayout 
} from '@/types/graph';

/**
 * Parse ES6 imports from JavaScript/TypeScript content
 */
export function parseImports(content: string): string[] {
  const imports: string[] = [];
  
  // ES6 import statements
  const es6Regex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"];?/g;
  let match;
  while ((match = es6Regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // CommonJS require
  const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = cjsRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Dynamic import
  const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return [...new Set(imports)];
}

/**
 * Determine module type based on import path
 */
export function getModuleType(importPath: string): ModuleType {
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return 'source';
  }
  if (importPath.startsWith('data:') || importPath.includes('?')) {
    return 'asset';
  }
  // Check for dynamic imports
  if (importPath.includes('import(')) {
    return 'dynamic';
  }
  return 'vendor';
}

/**
 * Generate a unique node ID from module path
 */
export function generateNodeId(path: string): string {
  // Normalize path and create ID
  return path.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Build dependency graph from analyzed files
 */
export function buildDependencyGraph(
  files: { name: string; content: string; size: number }[],
  entryFiles?: string[]
): DependencyGraph {
  const nodes: Map<string, GraphNode> = new Map();
  const edges: Map<string, GraphEdge> = new Map();
  const importsMap: Map<string, string[]> = new Map();
  
  // First pass: Create nodes for all files
  files.forEach(file => {
    const id = generateNodeId(file.name);
    const imports = parseImports(file.content);
    importsMap.set(id, imports);
    
    const node: GraphNode = {
      id,
      label: file.name.split('/').pop() || file.name,
      type: getModuleType(file.name),
      size: file.size,
      path: file.name,
      exports: parseExports(file.content),
      imports,
      dependencies: [],
      dependents: [],
      level: -1, // Will be calculated later
    };
    
    nodes.set(id, node);
  });
  
  // Second pass: Create edges and link dependencies
  importsMap.forEach((imports, sourceId) => {
    const sourceNode = nodes.get(sourceId);
    if (!sourceNode) return;
    
    imports.forEach(importPath => {
      // Try to resolve the import to a file
      const targetId = resolveImport(importPath, files);
      if (!targetId || targetId === sourceId) return;
      
      const targetNode = nodes.get(targetId);
      if (!targetNode) return;
      
      // Create edge
      const edgeId = `${sourceId}→${targetId}`;
      const existingEdge = edges.get(edgeId);
      
      if (existingEdge) {
        existingEdge.count++;
      } else {
        edges.set(edgeId, {
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: importPath.includes('import(') ? 'dynamic' : 'static',
          count: 1,
        });
      }
      
      // Update node relationships
      if (!sourceNode.dependencies.includes(targetId)) {
        sourceNode.dependencies.push(targetId);
      }
      if (!targetNode.dependents.includes(sourceId)) {
        targetNode.dependents.push(sourceId);
      }
    });
  });
  
  // Detect entry points (files with no dependents or explicitly marked)
  const entryPoints = entryFiles?.map(f => generateNodeId(f)) || 
    Array.from(nodes.values())
      .filter(n => n.dependents.length === 0 && n.dependencies.length > 0)
      .map(n => n.id);
  
  // Mark entry nodes
  entryPoints.forEach(id => {
    const node = nodes.get(id);
    if (node) node.type = 'entry';
  });
  
  // Calculate levels (depth in dependency tree)
  calculateLevels(nodes, entryPoints);
  
  // Detect circular dependencies
  const circularDeps = detectCircularDependencies(nodes);
  
  // Mark circular edges
  circularDeps.forEach(cycle => {
    for (let i = 0; i < cycle.length; i++) {
      const source = cycle[i];
      const target = cycle[(i + 1) % cycle.length];
      const edgeId = `${source}→${target}`;
      const edge = edges.get(edgeId);
      if (edge) {
        edge.type = 'circular';
      }
    }
  });
  
  // Detect duplicates (same label, different paths)
  const duplicates = detectDuplicates(Array.from(nodes.values()));
  duplicates.forEach(({ original, duplicates }) => {
    duplicates.forEach(dup => {
      const node = nodes.get(dup.id);
      if (node) node.isDuplicate = true;
    });
  });
  
  // Calculate total size
  const totalSize = Array.from(nodes.values()).reduce((sum, n) => sum + n.size, 0);
  
  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    entryPoints,
    circularDependencies: circularDeps,
    totalSize,
    moduleCount: nodes.size,
    vendorCount: Array.from(nodes.values()).filter(n => n.type === 'vendor').length,
  };
}

/**
 * Parse exports from JavaScript/TypeScript content
 */
function parseExports(content: string): string[] {
  const exports: string[] = [];
  
  // Named exports
  const namedRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
  let match;
  while ((match = namedRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // Export from
  const exportFromRegex = /export\s+(?:\{[^}]*\}|\*\s*(?:as\s+\w+)?)\s+from\s+['"][^'"]+['"];?/g;
  // These don't add named exports, just re-export
  
  return [...new Set(exports)];
}

/**
 * Resolve import path to actual file
 */
function resolveImport(
  importPath: string, 
  files: { name: string; content: string; size: number }[]
): string | null {
  // Direct match
  const directMatch = files.find(f => f.name === importPath || f.name === `${importPath}.js` || f.name === `${importPath}.ts`);
  if (directMatch) return generateNodeId(directMatch.name);
  
  // Try with extensions
  const withExt = files.find(f => 
    f.name === `${importPath}.js` ||
    f.name === `${importPath}.ts` ||
    f.name === `${importPath}.jsx` ||
    f.name === `${importPath}.tsx` ||
    f.name === `${importPath}/index.js` ||
    f.name === `${importPath}/index.ts`
  );
  if (withExt) return generateNodeId(withExt.name);
  
  // Try matching just the file name for vendor imports
  const fileName = importPath.split('/').pop();
  if (fileName) {
    const nameMatch = files.find(f => f.name.includes(fileName));
    if (nameMatch) return generateNodeId(nameMatch.name);
  }
  
  return null;
}

/**
 * Calculate depth levels for each node from entry points
 */
function calculateLevels(nodes: Map<string, GraphNode>, entryPoints: string[]): void {
  // Reset levels
  nodes.forEach(n => n.level = -1);
  
  // BFS from entry points
  const queue: string[] = [...entryPoints];
  queue.forEach(id => {
    const node = nodes.get(id);
    if (node) node.level = 0;
  });
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = nodes.get(currentId);
    if (!current) continue;
    
    current.dependencies.forEach(depId => {
      const dep = nodes.get(depId);
      if (!dep) return;
      
      if (dep.level === -1 || dep.level > current.level + 1) {
        dep.level = current.level + 1;
        queue.push(depId);
      }
    });
  }
  
  // Set remaining nodes to level 0 (unreachable from entry)
  nodes.forEach(node => {
    if (node.level === -1) node.level = 0;
  });
}

/**
 * Detect circular dependencies using DFS
 */
function detectCircularDependencies(nodes: Map<string, GraphNode>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];
  
  function dfs(nodeId: string): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    const node = nodes.get(nodeId);
    if (node) {
      for (const depId of node.dependencies) {
        if (!visited.has(depId)) {
          dfs(depId);
        } else if (recursionStack.has(depId)) {
          // Found a cycle
          const cycleStart = path.indexOf(depId);
          const cycle = path.slice(cycleStart);
          // Only add if not a duplicate cycle
          const cycleKey = [...cycle].sort().join(',');
          const isDuplicate = cycles.some(c => [...c].sort().join(',') === cycleKey);
          if (!isDuplicate && cycle.length > 1) {
            cycles.push([...cycle]);
          }
        }
      }
    }
    
    path.pop();
    recursionStack.delete(nodeId);
  }
  
  nodes.forEach((_, id) => {
    if (!visited.has(id)) {
      dfs(id);
    }
  });
  
  return cycles;
}

/**
 * Detect duplicate modules (same name, different paths)
 */
function detectDuplicates(nodes: GraphNode[]): { original: GraphNode; duplicates: GraphNode[] }[] {
  const byName = new Map<string, GraphNode[]>();
  
  nodes.forEach(node => {
    const existing = byName.get(node.label) || [];
    existing.push(node);
    byName.set(node.label, existing);
  });
  
  const duplicates: { original: GraphNode; duplicates: GraphNode[] }[] = [];
  
  byName.forEach((moduleNodes, name) => {
    if (moduleNodes.length > 1) {
      // Sort by size, largest is considered "original"
      moduleNodes.sort((a, b) => b.size - a.size);
      duplicates.push({
        original: moduleNodes[0],
        duplicates: moduleNodes.slice(1),
      });
    }
  });
  
  return duplicates;
}

/**
 * Calculate graph statistics
 */
export function calculateGraphStats(graph: DependencyGraph): GraphStats {
  const nodes = graph.nodes;
  const edges = graph.edges;
  
  const largestModule = nodes.length > 0 
    ? nodes.reduce((max, n) => n.size > max.size ? n : max)
    : null;
  
  const deepestLevel = nodes.length > 0
    ? Math.max(...nodes.map(n => n.level))
    : 0;
  
  const duplicateCount = nodes.filter(n => n.isDuplicate).length;
  
  return {
    totalModules: nodes.length,
    totalDependencies: edges.length,
    circularDependencyCount: graph.circularDependencies.length,
    duplicateModuleCount: duplicateCount,
    unusedExportCount: nodes.filter(n => n.isUnused).length,
    largestModule,
    deepestLevel,
  };
}

/**
 * Filter nodes based on filter criteria
 */
export function filterNodes(nodes: GraphNode[], filter: GraphFilter): GraphNode[] {
  return nodes.filter(node => {
    // Type filter
    if (filter.types.length > 0 && !filter.types.includes(node.type)) {
      return false;
    }
    
    // Search filter
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const matches = 
        node.label.toLowerCase().includes(query) ||
        node.path.toLowerCase().includes(query);
      if (!matches) return false;
    }
    
    // Duplicates only
    if (filter.showDuplicatesOnly && !node.isDuplicate) {
      return false;
    }
    
    // Unused only
    if (filter.showUnusedOnly && !node.isUnused) {
      return false;
    }
    
    // Size filter
    if (node.size < filter.minSize) {
      return false;
    }
    if (filter.maxSize !== null && node.size > filter.maxSize) {
      return false;
    }
    
    return true;
  });
}

/**
 * Generate React Flow compatible nodes and edges
 */
export function generateReactFlowElements(
  graph: DependencyGraph,
  layout: GraphLayout[]
) {
  const flowNodes = graph.nodes.map((node, index) => ({
    id: node.id,
    type: 'moduleNode',
    position: layout[index] || { x: 0, y: 0 },
    data: {
      ...node,
      label: node.label,
    },
  }));
  
  const flowEdges = graph.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type === 'circular' ? 'circularEdge' : 'default',
    animated: edge.type === 'dynamic',
    style: {
      stroke: edge.type === 'circular' ? '#f85149' : '#58a6ff',
      strokeWidth: Math.min(4, 1 + edge.count * 0.5),
    },
    data: edge,
  }));
  
  return { nodes: flowNodes, edges: flowEdges };
}

/**
 * Get nodes connected to a specific node (neighbors)
 */
export function getConnectedNodes(nodeId: string, graph: DependencyGraph): string[] {
  const node = graph.nodes.find(n => n.id === nodeId);
  if (!node) return [];
  
  return [...node.dependencies, ...node.dependents];
}

/**
 * Find path between two nodes
 */
export function findPath(
  sourceId: string, 
  targetId: string, 
  graph: DependencyGraph
): string[] | null {
  if (sourceId === targetId) return [sourceId];
  
  const visited = new Set<string>();
  const queue: { id: string; path: string[] }[] = [{ id: sourceId, path: [sourceId] }];
  
  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    
    const node = graph.nodes.find(n => n.id === id);
    if (!node) continue;
    
    for (const depId of node.dependencies) {
      if (depId === targetId) {
        return [...path, depId];
      }
      
      if (!visited.has(depId)) {
        visited.add(depId);
        queue.push({ id: depId, path: [...path, depId] });
      }
    }
  }
  
  return null;
}
