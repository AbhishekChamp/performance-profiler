import type { MemoryAnalysis, MemoryLeakRisk } from '@/types';

export function analyzeMemory(jsFiles: { name: string; content: string }[]): MemoryAnalysis {
  const leakRisks: MemoryLeakRisk[] = [];
  let estimatedHeapSize = 0;
  
  for (const file of jsFiles) {
    const lines = file.content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Check for setInterval without clearInterval
      const intervalMatch = line.match(/setInterval\s*\(/);
      if (intervalMatch) {
        // Check if there's a clearInterval in the same file
        const hasClearInterval = file.content.includes('clearInterval');
        if (!hasClearInterval || line.includes('1000') || line.includes('5000')) {
          leakRisks.push({
            type: 'interval',
            file: file.name,
            line: lineNum,
            severity: 'medium',
            description: 'setInterval detected - ensure clearInterval is called on component unmount',
            fix: 'Store interval ID and call clearInterval in cleanup/useEffect cleanup',
          });
        }
      }
      
      // Check for addEventListener without removeEventListener
      const listenerMatch = line.match(/addEventListener\s*\(/);
      if (listenerMatch) {
        const eventType = line.match(/addEventListener\s*\(\s*["']([^"']+)["']/)?.[1];
        
        // Check for corresponding removeEventListener
        const basePattern = line.match(/(\w+)\.addEventListener/)?.[1];
        let hasRemoval = false;
        
        if (basePattern != null) {
          const removalPattern = new RegExp(`${basePattern}\\.removeEventListener`);
          hasRemoval = removalPattern.test(file.content);
        }
        
        if (!hasRemoval && eventType != null && !['DOMContentLoaded', 'load'].includes(eventType)) {
          leakRisks.push({
            type: 'event-listener',
            file: file.name,
            line: lineNum,
            severity: 'high',
            description: `addEventListener for '${eventType}' without corresponding removeEventListener`,
            fix: 'Add removeEventListener in cleanup function or use AbortController',
          });
        }
      }
      
      // Check for potential closure leaks
      const closurePattern = /function\s*\([^)]*\)\s*\{[^}]*(?:setTimeout|setInterval|addEventListener)/;
      if (closurePattern.test(line)) {
        // Check if closure captures large scope
        if (line.includes('this') || line.includes('self')) {
          leakRisks.push({
            type: 'closure',
            file: file.name,
            line: lineNum,
            severity: 'low',
            description: 'Potential closure scope leak - large objects may be retained',
            fix: 'Minimize scope captured by closures, use bind() or arrow functions',
          });
        }
      }
      
      // Check for global variable assignments
      const globalPattern = /^(window|global|globalThis)\.[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/;
      if (globalPattern.test(line.trim())) {
        const varName = line.match(/^(?:window|global|globalThis)\.([a-zA-Z_$][a-zA-Z0-9_$]*)/)?.[1];
        if (varName != null && !['location', 'document', 'console'].includes(varName)) {
          leakRisks.push({
            type: 'global-variable',
            file: file.name,
            line: lineNum,
            severity: 'medium',
            description: `Global variable '${varName}' assignment - may prevent garbage collection`,
            fix: 'Use module-level variables or state management instead of global scope',
          });
        }
      }
      
      // Check for DOM reference retention
      const domRefPattern = /(document\.(getElementById|querySelector)|refs?\[)/;
      if (domRefPattern.test(line)) {
        // Check if in React/Vue component without cleanup
        if (file.content.includes('useEffect') || file.content.includes('onMounted')) {
          const hasCleanup = file.content.includes('useEffect') && file.content.includes('return');
          if (!hasCleanup && line.includes('querySelector')) {
            leakRisks.push({
              type: 'dom-reference',
              file: file.name,
              line: lineNum,
              severity: 'low',
              description: 'DOM element reference without cleanup',
              fix: 'Set DOM references to null in cleanup/unmount lifecycle',
            });
          }
        }
      }
      
      // Estimate heap size from object/array literals
      const objectMatches = line.match(/\{[^{}]*\}/g);
      if (objectMatches) {
        estimatedHeapSize += objectMatches.length * 100; // Rough estimate
      }
      
      const arrayMatches = line.match(/\[[^\]]*\]/g);
      if (arrayMatches) {
        estimatedHeapSize += arrayMatches.length * 50;
      }
      
      // Large array allocations
      const largeArrayMatch = line.match(/new\s+Array\s*\(\s*(\d+)\s*\)/);
      if (largeArrayMatch) {
        const size = parseInt(largeArrayMatch[1], 10);
        if (size > 10000) {
          leakRisks.push({
            type: 'global-variable',
            file: file.name,
            line: lineNum,
            severity: 'high',
            description: `Large array allocation (${size} items) - consider pagination or virtualization`,
            fix: 'Use virtual scrolling or pagination for large datasets',
          });
        }
        estimatedHeapSize += size * 8;
      }
    }
  }
  
  const highRiskCount = leakRisks.filter(r => r.severity === 'high').length;
  const mediumRiskCount = leakRisks.filter(r => r.severity === 'medium').length;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (highRiskCount > 0) {
    recommendations.push(`Address ${highRiskCount} high-risk memory leak issues immediately`);
  }
  
  if (mediumRiskCount > 0) {
    recommendations.push(`Review ${mediumRiskCount} medium-risk potential memory leaks`);
  }
  
  if (estimatedHeapSize > 10 * 1024 * 1024) {
    recommendations.push('Large estimated heap size - consider implementing virtualization for large lists');
  }
  
  if (!recommendations.length) {
    recommendations.push('No significant memory leak risks detected');
  }
  
  return {
    estimatedHeapSize,
    leakRisks,
    highRiskCount,
    mediumRiskCount,
    recommendations,
  };
}
