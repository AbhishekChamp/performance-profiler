import { parse } from 'acorn';
import type { ReactAnalysis, ReactComponent, ReactWarning, JSFileAnalysis } from '@/types';

interface ComponentInfo {
  name: string;
  file: string;
  line: number;
  lines: number;
  props: Set<string>;
  inlineFunctions: number;
  children: Set<string>;
  depth: number;
}

function isReactComponent(node: any): boolean {
  if (node.body) {
    if (node.body.type === 'JSXElement' || node.body.type === 'JSXFragment') {
      return true;
    }
    if (node.body.type === 'BlockStatement' && node.body.body) {
      for (const statement of node.body.body) {
        if (statement.type === 'ReturnStatement') {
          if (statement.argument?.type === 'JSXElement' || 
              statement.argument?.type === 'JSXFragment') {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function extractInlineFunctions(node: any): number {
  let count = 0;
  
  function traverse(n: any) {
    if (!n || typeof n !== 'object') return;
    
    if (n.type === 'JSXAttribute' && n.value) {
      if (n.value.type === 'JSXExpressionContainer') {
        const expr = n.value.expression;
        if (expr && (expr.type === 'ArrowFunctionExpression' || 
                     expr.type === 'FunctionExpression')) {
          count++;
        }
      }
    }
    
    for (const key of Object.keys(n)) {
      if (key === 'type') continue;
      const value = n[key];
      if (Array.isArray(value)) {
        value.forEach(traverse);
      } else {
        traverse(value);
      }
    }
  }
  
  traverse(node);
  return count;
}

function extractChildComponents(node: any): string[] {
  const children: string[] = [];
  
  function traverse(n: any) {
    if (!n || typeof n !== 'object') return;
    
    if (n.type === 'JSXElement' && n.openingElement?.name) {
      const tagName = n.openingElement.name.name;
      if (tagName && /^[A-Z]/.test(tagName)) {
        children.push(tagName);
      }
    }
    
    for (const key of Object.keys(n)) {
      if (key === 'type') continue;
      const value = n[key];
      if (Array.isArray(value)) {
        value.forEach(traverse);
      } else {
        traverse(value);
      }
    }
  }
  
  traverse(node);
  return children;
}

function calculateComponentDepth(componentName: string, componentMap: Map<string, ComponentInfo>, visited = new Set<string>()): number {
  if (visited.has(componentName)) return 0;
  
  const component = componentMap.get(componentName);
  if (!component || component.children.size === 0) return 1;
  
  visited.add(componentName);
  let maxChildDepth = 0;
  
  for (const child of component.children) {
    const childDepth = calculateComponentDepth(child, componentMap, new Set(visited));
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }
  
  return 1 + maxChildDepth;
}

export function analyzeReact(jsAnalysis: JSFileAnalysis[]): ReactAnalysis | undefined {
  const components: ComponentInfo[] = [];
  
  for (const file of jsAnalysis) {
    if (!file.path.match(/\.(jsx|tsx)$/)) {
      continue;
    }
    
    try {
      const ast = parse(file.content || '', {
        ecmaVersion: 'latest',
        sourceType: 'module',
        locations: true,
      });
      
      function traverse(node: any) {
        if (!node || typeof node !== 'object') return;
        
        if ((node.type === 'FunctionDeclaration' || 
             node.type === 'FunctionExpression' || 
             node.type === 'ArrowFunctionExpression') &&
            isReactComponent(node)) {
          
          const name = node.id?.name || 
                       (node.type === 'ArrowFunctionExpression' ? 'Anonymous' : 'Anonymous');
          
          const lines = node.loc 
            ? node.loc.end.line - node.loc.start.line + 1
            : 0;
          
          const props = new Set<string>();
          const inlineFunctions = extractInlineFunctions(node);
          const children = new Set(extractChildComponents(node));
          
          if (node.params && node.params[0]?.type === 'ObjectPattern') {
            for (const prop of node.params[0].properties || []) {
              if (prop.key?.name) {
                props.add(prop.key.name);
              }
            }
          }
          
          components.push({
            name,
            file: file.path,
            line: node.loc?.start.line || 0,
            lines,
            props,
            inlineFunctions,
            children,
            depth: 0,
          });
        }
        
        if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
          const superClass = node.superClass?.name;
          if (superClass === 'Component' || superClass === 'PureComponent' ||
              node.superClass?.property?.name === 'Component') {
            
            const name = node.id?.name || 'Anonymous';
            const lines = node.loc 
              ? node.loc.end.line - node.loc.start.line + 1
              : 0;
            
            let renderMethod: any = null;
            for (const member of node.body?.body || []) {
              if (member.type === 'MethodDefinition' && member.key?.name === 'render') {
                renderMethod = member;
                break;
              }
            }
            
            const inlineFunctions = renderMethod ? extractInlineFunctions(renderMethod) : 0;
            const children = renderMethod ? new Set(extractChildComponents(renderMethod)) : new Set<string>();
            
            components.push({
              name,
              file: file.path,
              line: node.loc?.start.line || 0,
              lines,
              props: new Set(),
              inlineFunctions,
              children,
              depth: 0,
            });
          }
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
      
    } catch (error) {
      console.error(`Error analyzing React in ${file.path}:`, error);
    }
  }
  
  if (components.length === 0) {
    return undefined;
  }
  
  const componentMap = new Map(components.map(c => [c.name, c]));
  
  for (const component of components) {
    component.depth = calculateComponentDepth(component.name, componentMap);
  }
  
  const largestCompInfo = components.reduce((max, c) => c.lines > max.lines ? c : max);
  const deepestCompInfo = components.reduce((max, c) => c.depth > max.depth ? c : max);
  
  const largestComponent: ReactComponent = {
    name: largestCompInfo.name,
    file: largestCompInfo.file,
    line: largestCompInfo.line,
    lines: largestCompInfo.lines,
    props: [...largestCompInfo.props],
    propCount: largestCompInfo.props.size,
    hasInlineFunctions: largestCompInfo.inlineFunctions > 0,
    inlineFunctionCount: largestCompInfo.inlineFunctions,
    children: [...largestCompInfo.children],
    depth: largestCompInfo.depth,
  };
  
  const deepestComponent: ReactComponent = {
    name: deepestCompInfo.name,
    file: deepestCompInfo.file,
    line: deepestCompInfo.line,
    lines: deepestCompInfo.lines,
    props: [...deepestCompInfo.props],
    propCount: deepestCompInfo.props.size,
    hasInlineFunctions: deepestCompInfo.inlineFunctions > 0,
    inlineFunctionCount: deepestCompInfo.inlineFunctions,
    children: [...deepestCompInfo.children],
    depth: deepestCompInfo.depth,
  };
  
  const reactComponents: ReactComponent[] = components.map(c => ({
    name: c.name,
    file: c.file,
    line: c.line,
    lines: c.lines,
    props: [...c.props],
    propCount: c.props.size,
    hasInlineFunctions: c.inlineFunctions > 0,
    inlineFunctionCount: c.inlineFunctions,
    children: [...c.children],
    depth: c.depth,
  }));
  
  const warnings: ReactWarning[] = [];
  
  for (const comp of reactComponents) {
    if (comp.lines > 200) {
      warnings.push({
        type: 'large-component',
        message: `Large component "${comp.name}" (${comp.lines} lines)`,
        severity: 'warning',
        component: comp.name,
      });
    }
    
    if (comp.inlineFunctionCount > 3) {
      warnings.push({
        type: 'inline-function',
        message: `${comp.inlineFunctionCount} inline functions in "${comp.name}"`,
        severity: 'warning',
        component: comp.name,
      });
    }
    
    if (comp.propCount > 10) {
      warnings.push({
        type: 'excessive-props',
        message: `Excessive props in "${comp.name}" (${comp.propCount} props)`,
        severity: 'info',
        component: comp.name,
      });
    }
    
    if (comp.depth > 10) {
      warnings.push({
        type: 'deep-tree',
        message: `Deep component tree in "${comp.name}" (depth: ${comp.depth})`,
        severity: 'info',
        component: comp.name,
      });
    }
  }
  
  const componentsWithInlineFunctions = reactComponents.filter(c => c.hasInlineFunctions).length;
  const excessiveProps = reactComponents.filter(c => c.propCount > 8);
  
  return {
    components: reactComponents,
    largestComponent,
    deepestComponent,
    totalComponents: reactComponents.length,
    componentsWithInlineFunctions,
    excessiveProps,
    warnings,
  };
}
