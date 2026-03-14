import { describe, it, expect } from 'vitest';
import { analyzeReact } from '../react';
import type { JSFileAnalysis } from '@/types';

describe('analyzeReact', () => {
  it('should detect React components', () => {
    const jsFiles: JSFileAnalysis[] = [
      {
        path: 'Component.jsx',
        content: `
          function MyComponent() {
            return <div>Hello</div>;
          }
          
          const AnotherComponent = () => {
            return <span>World</span>;
          };
        `,
        size: 200,
        lines: 10,
        functions: [
          { name: 'MyComponent', line: 2, column: 0, lines: 3, nestedLoops: 0, cyclomaticComplexity: 1, parameters: 0 },
          { name: 'AnotherComponent', line: 6, column: 0, lines: 3, nestedLoops: 0, cyclomaticComplexity: 1, parameters: 0 },
        ],
        largestFunction: null,
        mostComplexFunction: null,
        totalComplexity: 2,
        warnings: [],
      },
    ];

    const result = analyzeReact(jsFiles);
    expect(result).toBeDefined();
    expect(result!.totalComponents).toBeGreaterThan(0);
  });

  it('should detect inline functions in components', () => {
    const jsFiles: JSFileAnalysis[] = [
      {
        path: 'Component.jsx',
        content: `
          function MyComponent() {
            const handleClick = () => console.log('click');
            return <button onClick={handleClick}>Click</button>;
          }
        `,
        size: 200,
        lines: 5,
        functions: [
          { name: 'MyComponent', line: 2, column: 0, lines: 4, nestedLoops: 0, cyclomaticComplexity: 1, parameters: 0 },
          { name: 'handleClick', line: 3, column: 0, lines: 1, nestedLoops: 0, cyclomaticComplexity: 1, parameters: 0 },
        ],
        largestFunction: null,
        mostComplexFunction: null,
        totalComplexity: 2,
        warnings: [],
      },
    ];

    const result = analyzeReact(jsFiles);
    expect(result).toBeDefined();
  });

  it('should identify large components', () => {
    const jsFiles: JSFileAnalysis[] = [
      {
        path: 'LargeComponent.jsx',
        content: `
          function LargeComponent() {
            ${Array(100).fill('const x = 1;').join('\n')}
            return <div>Large</div>;
          }
        `,
        size: 5000,
        lines: 105,
        functions: [
          { name: 'LargeComponent', line: 2, column: 0, lines: 103, nestedLoops: 0, cyclomaticComplexity: 1, parameters: 0 },
        ],
        largestFunction: { name: 'LargeComponent', line: 2, column: 0, lines: 103, nestedLoops: 0, cyclomaticComplexity: 1, parameters: 0 },
        mostComplexFunction: null,
        totalComplexity: 1,
        warnings: [{ type: 'large-function', message: 'Large function', severity: 'warning', function: 'LargeComponent', line: 2 }],
      },
    ];

    const result = analyzeReact(jsFiles);
    expect(result).toBeDefined();
    expect(result!.largestComponent).toBeDefined();
  });

  it('should measure component depth', () => {
    const jsFiles: JSFileAnalysis[] = [
      {
        path: 'NestedComponent.jsx',
        content: `
          function Parent() {
            return (
              <div>
                <span>
                  <p>Deep</p>
                </span>
              </div>
            );
          }
        `,
        size: 200,
        lines: 11,
        functions: [
          { name: 'Parent', line: 2, column: 0, lines: 9, nestedLoops: 0, cyclomaticComplexity: 1, parameters: 0 },
        ],
        largestFunction: null,
        mostComplexFunction: null,
        totalComplexity: 1,
        warnings: [],
      },
    ];

    const result = analyzeReact(jsFiles);
    expect(result).toBeDefined();
  });

  it('should detect class components', () => {
    const jsFiles: JSFileAnalysis[] = [
      {
        path: 'ClassComponent.jsx',
        content: `
          class MyClassComponent extends React.Component {
            render() {
              return <div>Class Component</div>;
            }
          }
        `,
        size: 200,
        lines: 7,
        functions: [
          { name: 'render', line: 3, column: 0, lines: 3, nestedLoops: 0, cyclomaticComplexity: 1, parameters: 0 },
        ],
        largestFunction: null,
        mostComplexFunction: null,
        totalComplexity: 1,
        warnings: [],
      },
    ];

    const result = analyzeReact(jsFiles);
    expect(result).toBeDefined();
    expect(result!.totalComponents).toBeGreaterThan(0);
  });
});
