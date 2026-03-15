import type { ImportAnalysis, ImportCost } from '@/types';

// Known package sizes (approximate minified + gzipped sizes in bytes)
const PACKAGE_SIZES: Record<string, number> = {
  'lodash': 70000,
  'lodash-es': 70000,
  'moment': 290000,
  'dayjs': 10000,
  'date-fns': 30000,
  'axios': 13000,
  'jquery': 30000,
  'react': 13000,
  'react-dom': 130000,
  'vue': 34000,
  '@angular/core': 110000,
  'rxjs': 45000,
  'redux': 7000,
  'zustand': 1200,
  'mobx': 50000,
  'chart.js': 60000,
  'd3': 80000,
  'three': 140000,
  'gsap': 60000,
  '@mui/material': 120000,
  'antd': 300000,
  'bootstrap': 60000,
  'tailwindcss': 0, // Build-time only
  'framer-motion': 35000,
  'styled-components': 12000,
  '@emotion/react': 10000,
  'lucide-react': 25000,
  '@radix-ui': 15000,
  'zod': 15000,
  'yup': 25000,
  'joi': 40000,
  'uuid': 3000,
  'nanoid': 2000,
  'classnames': 1000,
  'clsx': 500,
  'prop-types': 4000,
  'core-js': 20000,
  'regenerator-runtime': 7000,
  'whatwg-fetch': 8000,
  '@sentry/browser': 20000,
  'logrocket': 30000,
  'mixpanel-browser': 25000,
  'amplitude-js': 35000,
  'firebase': 80000,
  '@supabase/supabase-js': 45000,
  'prismjs': 15000,
  'highlight.js': 25000,
  'marked': 15000,
  'dompurify': 8000,
  'he': 10000,
  'qs': 5000,
  'query-string': 5000,
  'path-to-regexp': 3000,
  'history': 8000,
  '@tanstack/react-query': 15000,
  'swr': 6000,
  'recharts': 50000,
  'react-chartjs-2': 2000,
  'react-select': 45000,
  'react-datepicker': 35000,
  'react-modal': 12000,
  'react-tooltip': 8000,
  'react-virtualized': 35000,
  'react-window': 10000,
  '@react-pdf/renderer': 80000,
  'jspdf': 120000,
  'html2canvas': 50000,
  'file-saver': 3000,
  'jszip': 40000,
  'xlsx': 150000,
  'papaparse': 15000,
  'csv-parse': 10000,
};

// Tree-shakable packages
const TREE_SHAKABLE_PACKAGES = [
  'lodash-es',
  'date-fns',
  'rxjs',
  '@mui/material',
  '@radix-ui',
  '@tanstack/react-query',
  'zod',
  'react-window',
  'recharts',
];

// Known barrel files
const BARREL_FILE_PATTERNS = [
  /^lodash$/,
  /^@mui\/material$/,
  /^@radix-ui\/react-icons$/,
  /^@heroicons\/react$/,
];

function getPackageSize(packageName: string): number {
  // Check exact match
  if (PACKAGE_SIZES[packageName]) {
    return PACKAGE_SIZES[packageName];
  }
  
  // Check without scope
  const parts = packageName.split('/');
  if (parts.length > 1) {
    const basePackage = parts[0];
    if (PACKAGE_SIZES[basePackage]) {
      return PACKAGE_SIZES[basePackage] * 0.3; // Assume 30% if importing submodule
    }
  }
  
  // Default estimate
  return 15000; // 15KB default
}

function isTreeShakable(packageName: string): boolean {
  // Check if package or its base is tree-shakable
  if (TREE_SHAKABLE_PACKAGES.some(p => packageName === p || packageName.startsWith(`${p  }/`))) {
    return true;
  }
  
  // ES modules hint
  return packageName.includes('-es') || packageName.startsWith('@');
}

function isBarrelFileImport(packageName: string, importPath: string): boolean {
  const fullPath = importPath.replace(packageName, '').replace(/^\//, '');
  
  // If importing from root and it's a known barrel file
  if (!fullPath || fullPath === 'index') {
    return BARREL_FILE_PATTERNS.some(pattern => pattern.test(packageName));
  }
  
  return false;
}

export function analyzeImports(jsFiles: { name: string; content: string }[]): ImportAnalysis {
  const imports: ImportCost[] = [];
  const importMap = new Map<string, ImportCost>();
  
  for (const file of jsFiles) {
    // Match ES6 imports
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s*)?["']([^"']+)["'];?/g;
    let match: RegExpExecArray | null;
    
    while ((match = importRegex.exec(file.content)) !== null) {
      const importPath = match[1];
      
      // Skip relative imports
      if (importPath.startsWith('.') || importPath.startsWith('/')) {
        continue;
      }
      
      // Get package name (first part of path)
      const packageName = importPath.split('/')[0].replace(/^@/, '');
      const fullPackage = importPath.startsWith('@') 
        ? `@${packageName}/${importPath.split('/')[1] || ''}`
        : packageName;
      
      const size = getPackageSize(fullPackage);
      const treeShakable = isTreeShakable(fullPackage);
      const isBarrel = isBarrelFileImport(fullPackage, importPath);
      
      // Check if this is a duplicate
      const isDuplicate = importMap.has(importPath);
      
      if (!isDuplicate) {
        const importCost: ImportCost = {
          path: importPath,
          source: file.name,
          size,
          isTreeShakable: treeShakable,
          isDuplicate: false,
          suggestions: [],
        };
        
        // Generate suggestions
        if (isBarrel) {
          importCost.suggestions.push(`Import specific modules instead of the full package: import { feature } from '${fullPackage}/feature'`);
        }
        
        if (!treeShakable && size > 50000) {
          importCost.suggestions.push('This package may not be tree-shakable - ensure you\'re using the minimal imports');
        }
        
        // Specific package suggestions
        if (importPath === 'lodash') {
          importCost.suggestions.push('Replace with lodash-es for better tree-shaking, or import specific methods: import debounce from "lodash/debounce"');
        }
        
        if (importPath === 'moment') {
          importCost.suggestions.push('Consider replacing moment with dayjs (~10KB) or date-fns (~30KB)');
        }
        
        if (importPath === 'axios' && file.content.includes('fetch')) {
          importCost.suggestions.push('You\'re already using fetch - consider using native fetch instead of axios');
        }
        
        imports.push(importCost);
        importMap.set(importPath, importCost);
      } else {
        // Mark as duplicate in the original
        const original = importMap.get(importPath);
        if (original) {
          original.isDuplicate = true;
        }
      }
    }
    
    // Match require() statements
    const requireRegex = /require\s*\(\s*["']([^"']+)["']\s*\)/g;
    while ((match = requireRegex.exec(file.content)) !== null) {
      const importPath = match[1];
      
      if (importPath.startsWith('.') || importPath.startsWith('/')) {
        continue;
      }
      
      const packageName = importPath.split('/')[0];
      
      if (!importMap.has(importPath)) {
        const size = getPackageSize(packageName);
        
        imports.push({
          path: importPath,
          source: file.name,
          size,
          isTreeShakable: false, // require() is not tree-shakable
          isDuplicate: false,
          suggestions: ['Consider using ES6 imports for better tree-shaking'],
        });
        
        importMap.set(importPath, imports[imports.length - 1]);
      }
    }
  }
  
  // Calculate totals
  const totalImportSize = imports.reduce((sum, i) => sum + i.size, 0);
  const duplicateImports = imports.filter(i => i.isDuplicate);
  const nonTreeShakableImports = imports.filter(i => !i.isTreeShakable && i.size > 20000);
  const barrelFileImports = imports.filter(i => 
    BARREL_FILE_PATTERNS.some(pattern => pattern.test(i.path.split('/')[0]))
  );
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (duplicateImports.length > 0) {
    recommendations.push(`${duplicateImports.length} duplicate imports detected - consolidate imports`);
  }
  
  if (barrelFileImports.length > 0) {
    recommendations.push('Import from barrel files detected - import specific modules for better tree-shaking');
  }
  
  if (nonTreeShakableImports.length > 0) {
    recommendations.push(`${nonTreeShakableImports.length} large non-tree-shakable imports - review if all exports are needed`);
  }
  
  // Check for heavy packages
  const heavyPackages = imports.filter(i => i.size > 100000);
  if (heavyPackages.length > 0) {
    recommendations.push(`Heavy packages detected: ${heavyPackages.map(p => p.path).join(', ')} - consider lazy loading`);
  }
  
  // Check for moment.js specifically
  if (imports.some(i => i.path === 'moment')) {
    recommendations.push('moment.js is a large legacy library - migrate to dayjs or date-fns');
  }
  
  return {
    imports,
    totalImportSize,
    duplicateImports,
    nonTreeShakableImports,
    barrelFileImports,
    recommendations: [...new Set(recommendations)],
  };
}
