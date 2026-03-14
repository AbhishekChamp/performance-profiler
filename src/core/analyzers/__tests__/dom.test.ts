import { describe, it, expect } from 'vitest';
import { analyzeDOM } from '../dom';


describe('analyzeDOM', () => {
  it('should count total nodes', () => {
    const html = `
      <html>
        <body>
          <div>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </div>
        </body>
      </html>
    `;
    
    const result = analyzeDOM(html);
    expect(result).toBeDefined();
    expect(result!.totalNodes).toBeGreaterThan(0);
  });

  it('should calculate max depth', () => {
    const html = `
      <html>
        <body>
          <div>
            <div>
              <div>
                <div>
                  <span>Deep</span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const result = analyzeDOM(html);
    expect(result!.maxDepth).toBeGreaterThan(4);
  });

  it('should detect images without lazy loading', () => {
    const html = `
      <div>
        <img src="image1.jpg" alt="Image 1">
        <img src="image2.jpg" alt="Image 2" loading="lazy">
      </div>
    `;
    
    const result = analyzeDOM(html);
    expect(result!.imagesWithoutLazy).toBe(1);
  });

  it('should detect images without dimensions', () => {
    const html = `
      <div>
        <img src="image1.jpg" width="800" height="600">
        <img src="image2.jpg">
      </div>
    `;
    
    const result = analyzeDOM(html);
    expect(result!.imagesWithoutDimensions).toBe(1);
  });

  it('should count leaf nodes', () => {
    const html = `
      <div>
        <span>Leaf 1</span>
        <span>Leaf 2</span>
        <p>Leaf 3</p>
      </div>
    `;
    
    const result = analyzeDOM(html);
    expect(result!.leafNodes).toBe(3);
  });

  it('should warn on deep nesting', () => {
    const html = `
      <div>
        ${Array(30).fill('<div>').join('')}
          <span>Deep content</span>
        ${Array(30).fill('</div>').join('')}
      </div>
    `;
    
    const result = analyzeDOM(html);
    const deepNestingWarning = result!.warnings.find(
      (w) => w.type === 'deep-nesting'
    );
    expect(deepNestingWarning).toBeDefined();
  });

  it('should warn on too many nodes', () => {
    const html = `
      <div>
        ${Array(2000).fill('<span>x</span>').join('')}
      </div>
    `;
    
    const result = analyzeDOM(html);
    const tooManyNodesWarning = result!.warnings.find(
      (w) => w.type === 'too-many-nodes'
    );
    expect(tooManyNodesWarning).toBeDefined();
  });
});
