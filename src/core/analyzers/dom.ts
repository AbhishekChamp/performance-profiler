import { Parser } from 'htmlparser2';
import type { DOMAnalysis, DOMNode, DOMWarning, ImageInfo } from '@/types';

interface ParseContext {
  currentDepth: number;
  nodeStack: DOMNode[];
  rootNodes: DOMNode[];
  allNodes: DOMNode[];
  images: ImageInfo[];
}

function createDOMNode(tag: string, attributes: Record<string, string>, depth: number): DOMNode {
  return {
    tag,
    id: attributes.id,
    className: attributes.class,
    depth,
    children: [],
    attributes,
    hasLazyLoading: attributes.loading === 'lazy',
  };
}

function analyzeSubtree(node: DOMNode): { nodeCount: number; largestTag: string } {
  let nodeCount = 1;
  let largestCount = 1;
  let largestTag = node.tag;

  for (const child of node.children) {
    const childResult = analyzeSubtree(child);
    nodeCount += childResult.nodeCount;
    if (childResult.nodeCount > largestCount) {
      largestCount = childResult.nodeCount;
      largestTag = childResult.largestTag;
    }
  }

  return { nodeCount, largestTag };
}

export function analyzeDOM(htmlContent: string): DOMAnalysis | undefined {
  if (!htmlContent.trim()) return undefined;

  const context: ParseContext = {
    currentDepth: 0,
    nodeStack: [],
    rootNodes: [],
    allNodes: [],
    images: [],
  };

  const parser = new Parser({
    onopentag(name, attributes) {
      const node = createDOMNode(name, attributes, context.currentDepth);
      
      if (context.nodeStack.length > 0) {
        const parent = context.nodeStack[context.nodeStack.length - 1];
        parent.children.push(node);
      } else {
        context.rootNodes.push(node);
      }

      context.nodeStack.push(node);
      context.allNodes.push(node);
      context.currentDepth++;

      // Track images
      if (name === 'img') {
        const src = attributes.src || '';
        // Estimate size based on src (in reality, would need to fetch)
        const estimatedSize = src.length > 100 ? 500000 : 50000;
        
        context.images.push({
          src,
          size: estimatedSize,
          hasWidth: !!attributes.width,
          hasHeight: !!attributes.height,
          hasLazyLoading: attributes.loading === 'lazy',
        });
      }
    },

    onclosetag() {
      context.nodeStack.pop();
      context.currentDepth--;
    },
  });

  try {
    parser.write(htmlContent);
    parser.end();
  } catch (error) {
    console.error('DOM parsing error:', error);
    return undefined;
  }

  // Calculate metrics
  const totalNodes = context.allNodes.length;
  const maxDepth = Math.max(...context.allNodes.map(n => n.depth), 0);
  
  // Nodes per level
  const nodesPerLevel: Record<number, number> = {};
  for (const node of context.allNodes) {
    nodesPerLevel[node.depth] = (nodesPerLevel[node.depth] || 0) + 1;
  }

  // Find largest subtree
  let largestSubtree = { tag: 'html', nodeCount: 0 };
  for (const root of context.rootNodes) {
    const result = analyzeSubtree(root);
    if (result.nodeCount > largestSubtree.nodeCount) {
      largestSubtree = { tag: result.largestTag, nodeCount: result.nodeCount };
    }
  }

  // Count leaf nodes
  const leafNodes = context.allNodes.filter(n => n.children.length === 0).length;

  // Image analysis
  const imagesWithoutLazy = context.images.filter(img => !img.hasLazyLoading).length;
  const imagesWithoutDimensions = context.images.filter(img => !img.hasWidth || !img.hasHeight).length;
  const largeImages = context.images.filter(img => img.size > 1024 * 1024);

  // Generate warnings
  const warnings: DOMWarning[] = [];

  if (totalNodes > 1500) {
    warnings.push({
      type: 'too-many-nodes',
      message: `High DOM node count (${totalNodes}) may reduce rendering performance`,
      severity: 'warning',
    });
  }

  if (maxDepth > 24) {
    warnings.push({
      type: 'deep-nesting',
      message: `Deep DOM nesting (depth: ${maxDepth}) can cause layout thrashing`,
      severity: 'warning',
    });
  }

  if (imagesWithoutLazy > 0) {
    warnings.push({
      type: 'missing-lazy',
      message: `${imagesWithoutLazy} images without lazy loading`,
      severity: 'info',
    });
  }

  if (imagesWithoutDimensions > 0) {
    warnings.push({
      type: 'missing-dimensions',
      message: `${imagesWithoutDimensions} images missing width/height attributes`,
      severity: 'info',
    });
  }

  if (largeImages.length > 0) {
    warnings.push({
      type: 'large-image',
      message: `${largeImages.length} images larger than 1MB`,
      severity: 'error',
    });
  }

  return {
    totalNodes,
    maxDepth,
    nodesPerLevel,
    largestSubtree,
    leafNodes,
    imagesWithoutLazy,
    imagesWithoutDimensions,
    largeImages,
    warnings,
  };
}
