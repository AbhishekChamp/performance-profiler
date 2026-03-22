import { parse } from 'acorn';
import type { JSFileAnalysis, JSFunction, JSWarning } from '@/types';
import type { ArrowFunctionExpression, BlockStatement, CatchClause, ConditionalExpression, DoWhileStatement, ForInStatement, ForOfStatement, ForStatement, FunctionDeclaration, FunctionExpression, IfStatement, LogicalExpression, MethodDefinition, Node, SwitchCase, WhileStatement } from 'acorn';

function isLoopStatement(node: Node): node is ForStatement | WhileStatement | DoWhileStatement | ForInStatement | ForOfStatement {
  return node.type === 'ForStatement' || 
         node.type === 'WhileStatement' || 
         node.type === 'DoWhileStatement' ||
         node.type === 'ForInStatement' ||
         node.type === 'ForOfStatement';
}

function countNestedLoops(node: Node, depth = 0): number {
  let maxDepth = depth;
  
  if (isLoopStatement(node)) {
    maxDepth = Math.max(maxDepth, depth + 1);
  }
  
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'loc') continue;
    const value = node[key as keyof Node];
    if (value !== undefined && Array.isArray(value)) {
      for (const item of value) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (item !== null && item !== undefined && typeof item === 'object') {
          maxDepth = Math.max(maxDepth, countNestedLoops(item as unknown as Node, maxDepth));
        }
      }
    } else if (value !== undefined && value !== null && typeof value === 'object') {
      maxDepth = Math.max(maxDepth, countNestedLoops(value as unknown as Node, maxDepth));
    }
  }
  
  return maxDepth;
}

function isComplexityNode(node: Node): node is IfStatement | ConditionalExpression | SwitchCase | ForStatement | ForInStatement | ForOfStatement | WhileStatement | DoWhileStatement | LogicalExpression | CatchClause {
  return ['IfStatement', 'ConditionalExpression', 'SwitchCase', 'ForStatement', 
          'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement',
          'LogicalExpression', 'CatchClause'].includes(node.type);
}

function calculateCyclomaticComplexity(node: Node): number {
  let complexity = 1;
  
  if (isComplexityNode(node)) {
    complexity++;
  }
  
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'loc') continue;
    const value = node[key as keyof Node];
    if (value !== undefined && Array.isArray(value)) {
      for (const item of value) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (item !== null && item !== undefined && typeof item === 'object') {
          complexity += calculateCyclomaticComplexity(item as unknown as Node);
        }
      }
    } else if (value !== undefined && value !== null && typeof value === 'object') {
      complexity += calculateCyclomaticComplexity(value as unknown as Node);
    }
  }
  
  return complexity;
}

function extractFunctions(ast: Node): JSFunction[] {
  const functions: JSFunction[] = [];
  
  function traverse(node: Node): void {
    
    if (node.type === 'FunctionDeclaration' || 
        node.type === 'FunctionExpression' || 
        node.type === 'ArrowFunctionExpression') {
      
      const funcNode = node as FunctionDeclaration | FunctionExpression | ArrowFunctionExpression;
      const name = funcNode.id?.name ?? 
                   (node.type === 'ArrowFunctionExpression' ? 'arrow' : 'anonymous');
      
      const lines = funcNode.loc
        ? funcNode.loc.end.line - funcNode.loc.start.line + 1
        : 0;
      
      const body = funcNode.body as BlockStatement;
      
      functions.push({
        name,
        line: funcNode.loc?.start.line ?? 0,
        column: funcNode.loc?.start.column ?? 0,
        lines,
        nestedLoops: countNestedLoops(body, 0),
        cyclomaticComplexity: calculateCyclomaticComplexity(body),
        parameters: funcNode.params.length,
      });
      
      // Don't traverse into function bodies to avoid double-counting
      return;
    }
    
    // Handle method definitions in classes
    if (node.type === 'MethodDefinition') {
      const methodNode = node as MethodDefinition;
      const name = (methodNode.key as { name?: string }).name ?? 'method';
      const lines = methodNode.value.loc
        ? methodNode.value.loc.end.line - methodNode.value.loc.start.line + 1
        : 0;
      
      functions.push({
        name,
        line: methodNode.value.loc?.start.line ?? 0,
        column: methodNode.value.loc?.start.column ?? 0,
        lines,
        nestedLoops: countNestedLoops(methodNode.value.body, 0),
        cyclomaticComplexity: calculateCyclomaticComplexity(methodNode.value.body),
        parameters: methodNode.value.params.length,
      });
      
      // Don't traverse into method bodies to avoid double-counting
      return;
    }
    
    for (const key of Object.keys(node)) {
      if (key === 'type') continue;
      const value = node[key as keyof Node];
      if (value !== undefined && Array.isArray(value)) {
        for (const item of value) {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (item !== null && item !== undefined && typeof item === 'object') {
            traverse(item as unknown as Node);
          }
        }
      } else if (value !== undefined && value !== null && typeof value === 'object') {
        traverse(value as unknown as Node);
      }
    }
  }
  
  traverse(ast);
  return functions;
}

export function analyzeJavaScript(
  files: { name: string; content: string; size: number }[]
): JSFileAnalysis[] {
  const results: JSFileAnalysis[] = [];
  
  for (const file of files) {
    // Only analyze JS/TS files
    if (!/\.(js|jsx|ts|tsx|mjs)$/.test(file.name)) {
      continue;
    }
    
    try {
      const ast = parse(file.content, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        locations: true,
      }) as unknown as Node;
      
      const functions = extractFunctions(ast);
      const lines = file.content.split('\n').length;
      
      const largestFunction = functions.length > 0
        ? functions.reduce((max, f) => f.lines > max.lines ? f : max)
        : null;
      
      const mostComplexFunction = functions.length > 0
        ? functions.reduce((max, f) => f.cyclomaticComplexity > max.cyclomaticComplexity ? f : max)
        : null;
      
      const totalComplexity = functions.reduce((sum, f) => sum + f.cyclomaticComplexity, 0);
      
      const warnings: JSWarning[] = [];
      
      // Large file warning
      if (lines > 500) {
        warnings.push({
          type: 'large-file',
          message: `Large file: ${lines} lines`,
          severity: 'info',
        });
      }
      
      // Function warnings
      for (const func of functions) {
        if (func.lines > 50) {
          warnings.push({
            type: 'large-function',
            message: `Large function "${func.name}" (${func.lines} lines)`,
            severity: 'warning',
            function: func.name,
            line: func.line,
          });
        }
        
        if (func.cyclomaticComplexity > 10) {
          warnings.push({
            type: 'high-complexity',
            message: `High complexity in "${func.name}" (complexity: ${func.cyclomaticComplexity})`,
            severity: 'warning',
            function: func.name,
            line: func.line,
          });
        }
        
        if (func.nestedLoops > 0) {
          warnings.push({
            type: 'nested-loop',
            message: `Nested loops in "${func.name}" (depth: ${func.nestedLoops})`,
            severity: 'info',
            function: func.name,
            line: func.line,
          });
        }
      }
      
      results.push({
        path: file.name,
        content: file.content,
        size: file.size,
        lines,
        functions,
        largestFunction,
        mostComplexFunction,
        totalComplexity,
        warnings,
      });
      
    } catch (error) {
      console.error(`Error parsing ${file.name}:`, error);
      // Still include file with empty analysis
      results.push({
        path: file.name,
        content: file.content,
        size: file.size,
        lines: file.content.split('\n').length,
        functions: [],
        largestFunction: null,
        mostComplexFunction: null,
        totalComplexity: 0,
        warnings: [{
          type: 'large-file',
          message: 'Could not parse file',
          severity: 'error',
        }],
      });
    }
  }
  
  return results;
}
