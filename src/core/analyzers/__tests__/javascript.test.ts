import { describe, expect, it } from 'vitest';
import { analyzeJavaScript } from '../javascript';


describe('analyzeJavaScript', () => {
  it('should return empty array for no JS files', () => {
    const result = analyzeJavaScript([]);
    expect(result).toEqual([]);
  });

  it('should skip non-JS files', () => {
    const files = [
      { name: 'styles.css', content: 'body {}', size: 100 },
      { name: 'index.html', content: '<html></html>', size: 100 },
    ];
    
    const result = analyzeJavaScript(files);
    expect(result).toEqual([]);
  });

  it('should parse functions correctly', () => {
    const files = [
      {
        name: 'app.js',
        content: `
          function greet(name) {
            return 'Hello, ' + name;
          }
          
          const add = (a, b) => a + b;
          
          class Calculator {
            multiply(a, b) {
              return a * b;
            }
          }
        `,
        size: 500,
      },
    ];
    
    const result = analyzeJavaScript(files);
    expect(result).toHaveLength(1);
    expect(result[0].functions).toHaveLength(3);
  });

  it('should detect nested loops', () => {
    const files = [
      {
        name: 'nested.js',
        content: `
          function process(data) {
            for (let i = 0; i < data.length; i++) {
              for (let j = 0; j < data[i].length; j++) {
                console.log(data[i][j]);
              }
            }
          }
        `,
        size: 500,
      },
    ];
    
    const result = analyzeJavaScript(files);
    expect(result[0].functions[0].nestedLoops).toBe(2);
  });

  it('should calculate cyclomatic complexity', () => {
    const files = [
      {
        name: 'complex.js',
        content: `
          function complex(a, b, c) {
            if (a > 0) {
              if (b > 0) {
                return c > 0 ? a + b + c : 0;
              }
            }
            return -1;
          }
        `,
        size: 500,
      },
    ];
    
    const result = analyzeJavaScript(files);
    const func = result[0].functions[0];
    expect(func.cyclomaticComplexity).toBeGreaterThan(2);
  });

  it('should detect large functions', () => {
    const files = [
      {
        name: 'large.js',
        content: `
          function largeFunction() {
            ${Array(50).fill(0).map((_, i) => `const x${i} = ${i};`).join('\n')}
            return x49;
          }
        `,
        size: 2000,
      },
    ];
    
    const result = analyzeJavaScript(files);
    const largeFunctionWarning = result[0].warnings.find(w => w.type === 'large-function');
    expect(largeFunctionWarning).toBeDefined();
  });

  it('should handle syntax errors gracefully', () => {
    const files = [
      {
        name: 'broken.js',
        content: 'function { broken syntax',
        size: 100,
      },
    ];
    
    const result = analyzeJavaScript(files);
    expect(result).toHaveLength(1);
    expect(result[0].warnings).toHaveLength(1);
    expect(result[0].warnings[0].severity).toBe('error');
  });

  it('should identify most complex function', () => {
    const files = [
      {
        name: 'mixed.js',
        content: `
          function simple() {
            return 1;
          }
          
          function complex(x) {
            if (x > 0) {
              if (x < 10) {
                if (x % 2 === 0) {
                  return 'even';
                }
              }
            }
            return 'other';
          }
        `,
        size: 500,
      },
    ];
    
    const result = analyzeJavaScript(files);
    expect(result[0].mostComplexFunction).toBeDefined();
    expect(result[0].mostComplexFunction!.name).toBe('complex');
  });
});
