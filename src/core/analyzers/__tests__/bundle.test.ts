import { describe, it, expect } from 'vitest';
import { analyzeBundle } from '../bundle';


describe('analyzeBundle', () => {
  it('should return undefined when no JS files provided', () => {
    const result = analyzeBundle([]);
    expect(result).toBeUndefined();
  });

  it('should calculate total size correctly', () => {
    const files = [
      { name: 'app.js', content: 'console.log("test");', size: 1000 },
      { name: 'vendor.js', content: 'module.exports = {};', size: 2000 },
    ];
    
    const result = analyzeBundle(files);
    expect(result).toBeDefined();
    expect(result!.totalSize).toBe(3000);
  });

  it('should identify vendor modules', () => {
    const files = [
      { name: 'node_modules/react/index.js', content: 'export default React;', size: 50000 },
      { name: 'node_modules/lodash/index.js', content: 'module.exports = _;', size: 100000 },
      { name: 'src/app.js', content: 'import React from "react";', size: 5000 },
    ];
    
    const result = analyzeBundle(files);
    expect(result).toBeDefined();
    expect(result!.vendorSize).toBe(150000);
    expect(result!.vendorPercentage).toBeGreaterThan(0);
  });

  it('should detect dependencies from import statements', () => {
    const files = [
      { 
        name: 'app.js', 
        content: 'import React from "react";\nimport { useState } from "react";\nimport axios from "axios";',
        size: 5000 
      },
    ];
    
    const result = analyzeBundle(files);
    expect(result).toBeDefined();
    expect(result!.modules[0].dependencies).toContain('react');
    expect(result!.modules[0].dependencies).toContain('axios');
  });

  it('should detect duplicate libraries', () => {
    const files = [
      { name: 'node_modules/lodash@4.17.0/index.js', content: '', size: 100000 },
      { name: 'node_modules/lodash@4.17.21/index.js', content: '', size: 100000 },
    ];
    
    const result = analyzeBundle(files);
    expect(result).toBeDefined();
    expect(result!.duplicateLibraries.length).toBeGreaterThan(0);
  });

  it('should find largest modules', () => {
    const files = [
      { name: 'small.js', content: '', size: 1000 },
      { name: 'large.js', content: '', size: 50000 },
      { name: 'medium.js', content: '', size: 10000 },
    ];
    
    const result = analyzeBundle(files);
    expect(result).toBeDefined();
    expect(result!.largestModules.length).toBeGreaterThan(0);
    expect(result!.largestModules[0].size).toBe(50000);
  });

  it('should calculate gzipped size estimate', () => {
    const files = [
      { name: 'app.js', content: 'x'.repeat(10000), size: 10000 },
    ];
    
    const result = analyzeBundle(files);
    expect(result).toBeDefined();
    expect(result!.gzippedSize).toBeLessThan(result!.totalSize);
  });
});
