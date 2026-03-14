import { describe, it, expect } from 'vitest';
import { analyzeCSS } from '../css';

describe('analyzeCSS', () => {
  it('should count total rules correctly', () => {
    const files = [
      {
        name: 'styles.css',
        content: `
          .class1 { color: red; }
          .class2 { color: blue; }
          #id1 { color: green; }
        `,
        size: 100,
      },
    ];

    const result = analyzeCSS(files);
    expect(result).toBeDefined();
    expect(result!.totalRules).toBe(3);
  });

  it('should detect unused selectors', () => {
    const files = [
      {
        name: 'styles.css',
        content: `
          .used { color: red; }
          .unused { color: blue; }
          #also-unused { color: green; }
        `,
        size: 100,
      },
    ];

    const result = analyzeCSS(files);
    expect(result).toBeDefined();
    expect(result!.unusedSelectors.length).toBeGreaterThan(0);
  });

  it('should count !important usage', () => {
    const files = [
      {
        name: 'styles.css',
        content: `
          .class1 { color: red !important; }
          .class2 { color: blue !important; }
        `,
        size: 100,
      },
    ];

    const result = analyzeCSS(files);
    expect(result).toBeDefined();
    expect(result!.importantCount).toBe(2);
  });

  it('should detect inline styles from HTML', () => {
    const htmlContent = `
      <div style="color: red;">Test</div>
      <p style="font-size: 14px;">Paragraph</p>
    `;

    const result = analyzeCSS([], htmlContent);
    expect(result).toBeDefined();
    expect(result!.inlineStyles).toBe(2);
  });

  it('should identify large CSS files', () => {
    const files = [
      {
        name: 'large.css',
        content: '.class { color: red; }',
        size: 150 * 1024, // 150KB
      },
    ];

    const result = analyzeCSS(files);
    expect(result).toBeDefined();
    expect(result!.largeFiles.length).toBe(1);
  });

  it('should handle SCSS/Sass files', () => {
    const files = [
      {
        name: 'styles.scss',
        content: `
          $primary: blue;
          .class {
            color: $primary;
            &.nested { color: red; }
          }
        `,
        size: 100,
      },
    ];

    const result = analyzeCSS(files);
    expect(result).toBeDefined();
  });

  it('should generate warnings for high unused percentage', () => {
    const files = [
      {
        name: 'styles.css',
        content: `
          .unused1 { color: red; }
          .unused2 { color: blue; }
          .unused3 { color: green; }
        `,
        size: 100,
      },
    ];

    const result = analyzeCSS(files);
    expect(result).toBeDefined();
    const unusedWarning = result!.warnings.find(
      (w) => w.type === 'unused-selector'
    );
    expect(unusedWarning).toBeDefined();
  });
});
