import { describe, expect, it } from 'vitest';
import { analyzeWebVitals } from '../webVitals';
import type { AssetAnalysis, BundleAnalysis, DOMAnalysis } from '@/types';

describe('analyzeWebVitals', () => {
  it('should estimate LCP based on image sizes', () => {
    const files = [
      {
        name: 'index.html',
        content: `
          <html>
            <body>
              <img src="large.jpg" width="1200" height="800">
            </body>
          </html>
        `,
        size: 500,
      },
    ];

    const result = analyzeWebVitals(files);
    expect(result).toBeDefined();
    const lcp = result!.metrics.find(m => m.name === 'LCP');
    expect(lcp).toBeDefined();
  });

  it('should estimate CLS from images without dimensions', () => {
    const files = [
      {
        name: 'index.html',
        content: `
          <html>
            <body>
              <img src="image1.jpg">
              <img src="image2.jpg" width="100">
            </body>
          </html>
        `,
        size: 500,
      },
    ];

    const result = analyzeWebVitals(files);
    expect(result).toBeDefined();
    const cls = result!.metrics.find(m => m.name === 'CLS');
    expect(cls).toBeDefined();
  });

  it('should estimate FID from JS execution time', () => {
    const files = [
      {
        name: 'app.js',
        content: `
          // Large JavaScript file
          ${Array(1000).fill('console.log("test");').join('\n')}
        `,
        size: 50000,
      },
    ];

    const dom: DOMAnalysis = {
      totalNodes: 100,
      maxDepth: 10,
      nodesPerLevel: { 0: 1, 1: 10 },
      largestSubtree: { tag: 'div', nodeCount: 50 },
      leafNodes: 50,
      imagesWithoutLazy: 0,
      imagesWithoutDimensions: 0,
      largeImages: [],
      warnings: [],
    };

    const result = analyzeWebVitals(files, dom);
    expect(result).toBeDefined();
    const fid = result!.metrics.find(m => m.name === 'FID');
    expect(fid).toBeDefined();
  });

  it('should calculate overall score', () => {
    const files: { name: string; content: string; size: number }[] = [];
    const dom: DOMAnalysis = {
      totalNodes: 800,
      maxDepth: 10,
      nodesPerLevel: { 0: 1, 1: 10 },
      largestSubtree: { tag: 'div', nodeCount: 50 },
      leafNodes: 50,
      imagesWithoutLazy: 0,
      imagesWithoutDimensions: 0,
      largeImages: [],
      warnings: [],
    };

    const bundle: BundleAnalysis = {
      totalSize: 500 * 1024,
      gzippedSize: 200 * 1024,
      moduleCount: 10,
      largestModules: [],
      duplicateLibraries: [],
      vendorSize: 100 * 1024,
      vendorPercentage: 20,
      modules: [],
    };

    const assets: AssetAnalysis = {
      breakdown: { javascript: 500000, css: 100000, images: 200000, fonts: 50000, other: 50000, total: 900000 },
      percentages: { javascript: 55, css: 11, images: 22, fonts: 5, other: 5, total: 100 },
      largestAssets: [],
      byType: {},
    };

    const result = analyzeWebVitals(files, dom, bundle, assets);
    expect(result).toBeDefined();
    expect(result!.overallScore).toBeGreaterThan(0);
    expect(result!.overallScore).toBeLessThanOrEqual(100);
  });

  it('should generate recommendations', () => {
    const files = [
      {
        name: 'index.html',
        content: '<html><body><img src="test.jpg"></body></html>',
        size: 500,
      },
    ];

    const result = analyzeWebVitals(files);
    expect(result).toBeDefined();
    expect(result!.recommendations.length).toBeGreaterThan(0);
  });

  it('should identify critical issues', () => {
    const files = [
      {
        name: 'index.html',
        content: `
          <html>
            <body>
              ${Array(20).fill('<img src="image.jpg">').join('')}
            </body>
          </html>
        `,
        size: 1000,
      },
    ];

    const result = analyzeWebVitals(files);
    expect(result).toBeDefined();
  });
});
