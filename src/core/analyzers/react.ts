import { parse } from 'acorn';
import type { ReactAnalysis, ReactComponent, ReactWarning, JSFileAnalysis } from '@/types';
import type { Node, FunctionDeclaration, FunctionExpression, ArrowFunctionExpression, ClassDeclaration, ClassExpression, MethodDefinition } from 'acorn';

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

interface FunctionNode extends Node {
  body?: Node;
  id?: { name?: string };
  params: unknown[];
  loc?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

function isReactComponent(node: FunctionNode): boolean {
  if (node.body) {
    if (node.body.type === 'JSXElement' || node.body.type === 'JSXFragment') {
      return true;
    }
    if (node.body.type === 'BlockStatement') {
      const blockBody = (node.body as unknown as { body?: Node[] }).body;
      if (blockBody) {
        for (const statement of blockBody) {
          if (statement.type === 'ReturnStatement') {
            const returnStmt = statement as unknown as { argument?: Node };
            if (returnStmt.argument?.type === 'JSXElement' || 
                returnStmt.argument?.type === 'JSXFragment') {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

function extractInlineFunctions(node: Node): number {
  let count = 0;
  
  function traverse(n: Node) {
    if (!n || typeof n !== 'object') return;
    
    if (n.type === 'JSXAttribute') {
      const attr = n as unknown as { value?: { type: string; expression?: { type: string } } };
      if (attr.value && attr.value.type === 'JSXExpressionContainer') {
        const expr = attr.value.expression;
        if (expr && (expr.type === 'ArrowFunctionExpression' || 
                     expr.type === 'FunctionExpression')) {
          count++;
        }
      }
    }
    
    for (const key of Object.keys(n)) {
      if (key === 'type') continue;
      const value = n[key as keyof Node];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item && typeof item === 'object') {
            traverse(item as unknown as Node);
          }
        });
      } else if (value && typeof value === 'object') {
        traverse(value as unknown as Node);
      }
    }
  }
  
  traverse(node);
  return count;
}

function extractChildComponents(node: Node): string[] {
  const children: string[] = [];
  
  function traverse(n: Node) {
    if (!n || typeof n !== 'object') return;
    
    if (n.type === 'JSXElement') {
      const jsxEl = n as unknown as { openingElement?: { name?: { name?: string } } };
      const tagName = jsxEl.openingElement?.name?.name;
      if (tagName && /^[A-Z]/.test(tagName)) {
        children.push(tagName);
      }
    }
    
    for (const key of Object.keys(n)) {
      if (key === 'type') continue;
      const value = n[key as keyof Node];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item && typeof item === 'object') {
            traverse(item as unknown as Node);
          }
        });
      } else if (value && typeof value === 'object') {
        traverse(value as unknown as Node);
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
      }) as unknown as Node;
      
      function traverse(node: Node) {
        if (!node || typeof node !== 'object') return;
        
        if ((node.type === 'FunctionDeclaration' || 
             node.type === 'FunctionExpression' || 
             node.type === 'ArrowFunctionExpression') &&
            isReactComponent(node as FunctionNode)) {
          
          const funcNode = node as FunctionDeclaration | FunctionExpression | ArrowFunctionExpression;
          const name = funcNode.id?.name || 
                       (node.type === 'ArrowFunctionExpression' ? 'Anonymous' : 'Anonymous');
          
          const lines = funcNode.loc 
            ? funcNode.loc.end.line - funcNode.loc.start.line + 1
            : 0;
          
          const props = new Set<string>();
          const inlineFunctions = extractInlineFunctions(node);
          const children = new Set(extractChildComponents(node));
          
          if (funcNode.params && funcNode.params[0] && 
              funcNode.params[0].type === 'ObjectPattern') {
            const objPattern = funcNode.params[0] as unknown as { properties?: Array<{ key?: { name?: string } }> };
            for (const prop of objPattern.properties || []) {
              if (prop.key?.name) {
                props.add(prop.key.name);
              }
            }
          }
          
          components.push({
            name,
            file: file.path,
            line: funcNode.loc?.start.line || 0,
            lines,
            props,
            inlineFunctions,
            children,
            depth: 0,
          });
        }
        
        if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
          const classNode = node as ClassDeclaration | ClassExpression;
          const superClassName = classNode.superClass && 'name' in classNode.superClass 
            ? classNode.superClass.name 
            : undefined;
          const superClassProperty = classNode.superClass && 'property' in classNode.superClass 
            ? (classNode.superClass.property as { name?: string })?.name 
            : undefined;
          
          if (superClassName === 'Component' || superClassName === 'PureComponent' ||
              superClassProperty === 'Component') {
            
            const name = classNode.id?.name || 'Anonymous';
            const lines = classNode.loc 
              ? classNode.loc.end.line - classNode.loc.start.line + 1
              : 0;
            
            let renderMethod: MethodDefinition | null = null;
            const classBody = (classNode.body as unknown as { body?: MethodDefinition[] }).body;
            if (classBody) {
              for (const member of classBody) {
                if (member.type === 'MethodDefinition' && 
                    (member.key as { name?: string })?.name === 'render') {
                  renderMethod = member;
                  break;
                }
              }
            }
            
            const inlineFunctions = renderMethod ? extractInlineFunctions(renderMethod) : 0;
            const children = renderMethod ? new Set(extractChildComponents(renderMethod)) : new Set<string>();
            
            components.push({
              name,
              file: file.path,
              line: classNode.loc?.start.line || 0,
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
          const value = node[key as keyof Node];
          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (item && typeof item === 'object') {
                traverse(item as unknown as Node);
              }
            });
          } else if (value && typeof value === 'object') {
            traverse(value as unknown as Node);
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
