import type { GraphNode, GraphEdge, GraphLayout } from '@/types/graph';

export type LayoutAlgorithm = 'force' | 'hierarchical' | 'circular' | 'grid';

/**
 * Calculate layout positions for nodes using various algorithms
 */
export function calculateLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  algorithm: LayoutAlgorithm,
  width: number = 1000,
  height: number = 800
): GraphLayout[] {
  switch (algorithm) {
    case 'force':
      return forceDirectedLayout(nodes, edges, width, height);
    case 'hierarchical':
      return hierarchicalLayout(nodes, width, height);
    case 'circular':
      return circularLayout(nodes, width, height);
    case 'grid':
      return gridLayout(nodes, width, height);
    default:
      return forceDirectedLayout(nodes, edges, width, height);
  }
}

/**
 * Force-directed layout using simple physics simulation
 */
function forceDirectedLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  iterations: number = 100
): GraphLayout[] {
  if (nodes.length === 0) return [];
  
  // Initialize positions randomly
  const positions: Map<string, { x: number; y: number; vx: number; vy: number }> = new Map();
  
  nodes.forEach((node) => {
    positions.set(node.id, {
      x: Math.random() * width * 0.8 + width * 0.1,
      y: Math.random() * height * 0.8 + height * 0.1,
      vx: 0,
      vy: 0,
    });
  });
  
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Physics constants
  const repulsionForce = 5000;
  const attractionForce = 0.01;
  const centerForce = 0.001;
  const damping = 0.8;
  const minDistance = 80;
  
  // Run simulation
  for (let i = 0; i < iterations; i++) {
    // Repulsion between all nodes
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const posA = positions.get(nodes[a].id)!;
        const posB = positions.get(nodes[b].id)!;
        
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDistance) dist = minDistance;
        
        const force = repulsionForce / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        posA.vx += fx;
        posA.vy += fy;
        posB.vx -= fx;
        posB.vy -= fy;
      }
    }
    
    // Attraction along edges
    edges.forEach(edge => {
      const posA = positions.get(edge.source);
      const posB = positions.get(edge.target);
      
      if (!posA || !posB) return;
      
      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const force = dist * attractionForce;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      posA.vx += fx;
      posA.vy += fy;
      posB.vx -= fx;
      posB.vy -= fy;
    });
    
    // Center gravity
    positions.forEach(pos => {
      pos.vx += (centerX - pos.x) * centerForce;
      pos.vy += (centerY - pos.y) * centerForce;
    });
    
    // Update positions with damping
    positions.forEach(pos => {
      pos.vx *= damping;
      pos.vy *= damping;
      pos.x += pos.vx;
      pos.y += pos.vy;
      
      // Keep within bounds
      pos.x = Math.max(50, Math.min(width - 50, pos.x));
      pos.y = Math.max(50, Math.min(height - 50, pos.y));
    });
  }
  
  return nodes.map(node => {
    const pos = positions.get(node.id)!;
    return { x: pos.x, y: pos.y };
  });
}

/**
 * Hierarchical layout based on dependency levels
 */
function hierarchicalLayout(
  nodes: GraphNode[],
  width: number,
  height: number
): GraphLayout[] {
  if (nodes.length === 0) return [];
  
  // Group nodes by level
  const levelGroups = new Map<number, GraphNode[]>();
  let maxLevel = 0;
  
  nodes.forEach(node => {
    const level = node.level;
    maxLevel = Math.max(maxLevel, level);
    
    const group = levelGroups.get(level) || [];
    group.push(node);
    levelGroups.set(level, group);
  });
  
  // Position nodes by level
  const positions = new Map<string, GraphLayout>();
  const levelHeight = height / (maxLevel + 2);
  
  levelGroups.forEach((levelNodes, level) => {
    const y = (level + 1) * levelHeight;
    const nodeWidth = width / (levelNodes.length + 1);
    
    levelNodes.forEach((node, index) => {
      positions.set(node.id, {
        x: (index + 1) * nodeWidth,
        y: y,
      });
    });
  });
  
  return nodes.map(node => positions.get(node.id) || { x: width / 2, y: height / 2 });
}

/**
 * Circular layout with entry points in center
 */
function circularLayout(
  nodes: GraphNode[],
  width: number,
  height: number
): GraphLayout[] {
  if (nodes.length === 0) return [];
  
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.4;
  
  // Sort nodes by type and level
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === 'entry') return -1;
    if (b.type === 'entry') return 1;
    return a.level - b.level;
  });
  
  const positions = new Map<string, GraphLayout>();
  
  sortedNodes.forEach((node, index) => {
    if (node.type === 'entry') {
      // Entry points in center
      positions.set(node.id, {
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 100,
      });
    } else {
      // Others in concentric circles based on level
      const level = node.level || 1;
      const radius = (level / (Math.max(...nodes.map(n => n.level)) || 1)) * maxRadius;
      const angle = (index / nodes.length) * 2 * Math.PI;
      
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
  });
  
  return nodes.map(node => positions.get(node.id) || { x: centerX, y: centerY });
}

/**
 * Grid layout for simple visualization
 */
function gridLayout(
  nodes: GraphNode[],
  width: number,
  height: number
): GraphLayout[] {
  if (nodes.length === 0) return [];
  
  const cols = Math.ceil(Math.sqrt(nodes.length * (width / height)));
  const cellWidth = width / cols;
  const cellHeight = height / Math.ceil(nodes.length / cols);
  
  return nodes.map((node, index) => ({
    x: (index % cols) * cellWidth + cellWidth / 2,
    y: Math.floor(index / cols) * cellHeight + cellHeight / 2,
  }));
}

/**
 * Calculate optimal layout based on graph characteristics
 */
export function suggestLayout(
  nodeCount: number,
  edgeCount: number,
  circularDepCount: number
): LayoutAlgorithm {
  if (nodeCount < 30) {
    return 'force';
  } else if (circularDepCount > 0) {
    return 'hierarchical';
  } else if (nodeCount > 100) {
    return 'grid';
  } else {
    return 'force';
  }
}

/**
 * Calculate node size based on different criteria
 */
export function calculateNodeSize(
  node: GraphNode,
  mode: 'uniform' | 'bySize' | 'byDependencies',
  minSize: number = 40,
  maxSize: number = 120
): number {
  switch (mode) {
    case 'uniform':
      return minSize;
    
    case 'bySize': {
      // Size proportional to file size
      const sizeLog = Math.log10(node.size + 1);
      return Math.min(maxSize, minSize + sizeLog * 10);
    }
    
    case 'byDependencies': {
      // Size based on number of connections
      const connectionCount = node.dependencies.length + node.dependents.length;
      return Math.min(maxSize, minSize + connectionCount * 5);
    }
    
    default:
      return minSize;
  }
}

/**
 * Get color for module type
 */
export function getModuleColor(type: string): string {
  const colors: Record<string, string> = {
    entry: '#58a6ff',    // Blue
    source: '#3fb950',   // Green
    vendor: '#f0883e',   // Orange
    asset: '#a371f7',    // Purple
    dynamic: '#d29922',  // Yellow
  };
  
  return colors[type] || '#8b949e';
}

/**
 * Calculate bounding box of layout
 */
export function calculateBoundingBox(layouts: GraphLayout[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (layouts.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }
  
  const xs = layouts.map(l => l.x);
  const ys = layouts.map(l => l.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Fit layout to viewport with padding
 */
export function fitToViewport(
  layouts: GraphLayout[],
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): GraphLayout[] {
  const bbox = calculateBoundingBox(layouts);
  
  if (bbox.width === 0 || bbox.height === 0) {
    return layouts;
  }
  
  const availableWidth = viewportWidth - padding * 2;
  const availableHeight = viewportHeight - padding * 2;
  
  const scaleX = availableWidth / bbox.width;
  const scaleY = availableHeight / bbox.height;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
  
  const offsetX = (viewportWidth - bbox.width * scale) / 2 - bbox.minX * scale;
  const offsetY = (viewportHeight - bbox.height * scale) / 2 - bbox.minY * scale;
  
  return layouts.map(l => ({
    x: l.x * scale + offsetX,
    y: l.y * scale + offsetY,
  }));
}
