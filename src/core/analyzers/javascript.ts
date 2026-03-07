import { parse } from 'acorn';
import type { JSFileAnalysis, JSFunction, JSWarning } from '@/types';

interface FunctionNode {
  name: string;
  start: number;
  end: number;
  loc?: { start: { line: number; column: number }; end: { line: number; column: number } };
  body: any;
  params: any[];
}

function countNestedLoops(node: any, depth = 0): number {
  if (!node || typeof node !== 'object') return 0;
  
  let maxDepth = depth;
  
  if (node.type === 'ForStatement' || 
      node.type === 'WhileStatement' || 
      node.type === 'DoWhileStatement' ||
      node.type === 'ForInStatement' ||
      node.type === 'ForOfStatement') {
    maxDepth = Math.max(maxDepth, depth + 1);
  }
  
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'loc') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        maxDepth = Math.max(maxDepth, countNestedLoops(item, maxDepth));
      }
    } else {
      maxDepth = Math.max(maxDepth, countNestedLoops(value, maxDepth));
    }
  }
  
  return maxDepth;
}

function calculateCyclomaticComplexity(node: any): number {
  if (!node || typeof node !== 'object') return 0;
  
  let complexity = 1;
  
  const complexityNodes = [
    'IfStatement',
    'ConditionalExpression',
    'SwitchCase',
    'ForStatement',
    'ForInStatement',
    'ForOfStatement',
    'WhileStatement',
    'DoWhileStatement',
    'LogicalExpression',
    'CatchClause',
  ];
  
  if (complexityNodes.includes(node.type)) {
    complexity++;
  }
  
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'loc') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        complexity += calculateCyclomaticComplexity(item);
      }
    } else {
      complexity += calculateCyclomaticComplexity(value);
    }
  }
  
  return complexity;
}

function extractFunctions(ast: any, content: string): JSFunction[] {
  const functions: JSFunction[] = [];
  
  function traverse(node: any) {
    if (!node || typeof node !== 'object') return;
    
    if (node.type === 'FunctionDeclaration' || 
        node.type === 'FunctionExpression' || 
        node.type === 'ArrowFunctionExpression') {
      
      const name = node.id?.name || 
                   (node.type === 'ArrowFunctionExpression' ? 'arrow' : 'anonymous');
      
      const lines = node.loc 
        ? node.loc.end.line - node.loc.start.line + 1
        : 0;
      
      functions.push({
        name,
        line: node.loc?.start.line || 0,
        column: node.loc?.start.column || 0,
        lines,
        nestedLoops: countNestedLoops(node.body, 0),
        cyclomaticComplexity: calculateCyclomaticComplexity(node.body),
        parameters: node.params.length,
      });
    }
    
    // Handle method definitions in classes
    if (node.type === 'MethodDefinition' && node.value) {
      const name = node.key?.name || 'method';
      const lines = node.value.loc 
        ? node.value.loc.end.line - node.value.loc.start.line + 1
        : 0;
      
      functions.push({
        name,
        line: node.value.loc?.start.line || 0,
        column: node.value.loc?.start.column || 0,
        lines,
        nestedLoops: countNestedLoops(node.value.body, 0),
        cyclomaticComplexity: calculateCyclomaticComplexity(node.value.body),
        parameters: node.value.params.length,
      });
    }
    
    for (const key of Object.keys(node)) {
      if (key === 'type') continue;
      const value = node[key];
      if (Array.isArray(value)) {
        value.forEach(traverse);
      } else {
        traverse(value);
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
      });
      
      const functions = extractFunctions(ast, file.content);
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
        if (func.lines > 100) {
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
