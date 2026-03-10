import type { PlaygroundLanguage, OptimizationPreset, CodeTransformation } from '@/types/playground';

// Optimization presets
export const OPTIMIZATION_PRESETS: OptimizationPreset[] = [
  {
    id: 'lazy-load-images',
    name: 'Lazy Load Images',
    description: 'Add loading="lazy" to all images without it',
    icon: 'image',
    appliesTo: ['html'],
    transform: (code: string) => {
      return code.replace(/<img(?![^>]*loading=)[^>]*>/g, (match) => {
        if (match.endsWith('/>')) {
          return match.replace('/>', ' loading="lazy" />');
        }
        return match.replace('>', ' loading="lazy">');
      });
    },
  },
  {
    id: 'add-image-alts',
    name: 'Add Image Alt Text',
    description: 'Add alt attributes to images missing them',
    icon: 'accessibility',
    appliesTo: ['html'],
    transform: (code: string) => {
      return code.replace(/<img(?![^>]*alt=)[^>]*>/g, (match) => {
        if (match.endsWith('/>')) {
          return match.replace('/>', ' alt="Image description" />');
        }
        return match.replace('>', ' alt="Image description">');
      });
    },
  },
  {
    id: 'remove-console-logs',
    name: 'Remove Console Logs',
    description: 'Remove all console.log statements',
    icon: 'terminal',
    appliesTo: ['javascript', 'typescript', 'tsx'],
    transform: (code: string) => {
      return code
        .replace(/console\.(log|warn|error|info|debug)\([^)]*\);?\s*\n?/g, '')
        .replace(/\n\s*\n/g, '\n'); // Remove empty lines
    },
  },
  {
    id: 'optimize-imports',
    name: 'Optimize Lodash Imports',
    description: 'Convert full lodash import to specific modules',
    icon: 'package',
    appliesTo: ['javascript', 'typescript', 'tsx'],
    transform: (code: string) => {
      // Replace full lodash import with specific imports
      if (code.includes("import _ from 'lodash'") || code.includes('import _ from "lodash"')) {
        // Extract used lodash methods (simplified)
        const usedMethods = ['merge', 'clone', 'isEqual']; // Default for demo
        const imports = usedMethods.map(m => `import ${m} from 'lodash/${m}';`).join('\n');
        return code
          .replace(/import _ from ['"]lodash['"];?\n?/g, imports + '\n')
          .replace(/_\.(merge|clone|isEqual)/g, '$1');
      }
      return code;
    },
  },
  {
    id: 'add-font-display',
    name: 'Add Font Display',
    description: 'Add font-display: swap to @font-face rules',
    icon: 'type',
    appliesTo: ['css', 'scss'],
    transform: (code: string) => {
      return code.replace(
        /@font-face\s*{([^}]*)}/g,
        (match, content) => {
          if (!content.includes('font-display')) {
            return match.replace('}', '  font-display: swap;\n}');
          }
          return match;
        }
      );
    },
  },
  {
    id: 'minify-css',
    name: 'Remove Unused CSS',
    description: 'Remove comments and whitespace from CSS',
    icon: 'zap',
    appliesTo: ['css', 'scss'],
    transform: (code: string) => {
      return code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .replace(/;\s*\n?\s*}/g, ';}') // Remove space before closing brace
        .trim();
    },
  },
  {
    id: 'async-scripts',
    name: 'Async Scripts',
    description: 'Add async attribute to non-critical scripts',
    icon: 'code',
    appliesTo: ['html'],
    transform: (code: string) => {
      return code.replace(
        /<script(?![^>]*\b(async|defer|type="module"))([^>]*)>/g,
        '<script async$2>'
      );
    },
  },
  {
    id: 'modern-js',
    name: 'Modernize JavaScript',
    description: 'Convert var to const/let',
    icon: 'refresh-cw',
    appliesTo: ['javascript', 'typescript', 'tsx'],
    transform: (code: string) => {
      return code
        .replace(/\bvar\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, 'const $1 =')
        .replace(/function\s*\(([a-zA-Z_$][a-zA-Z0-9_$\s,]*)\)\s*{/g, '($1) => {');
    },
  },
];

// Get applicable presets for a language
export function getApplicablePresets(language: PlaygroundLanguage): OptimizationPreset[] {
  return OPTIMIZATION_PRESETS.filter(preset => 
    preset.appliesTo.includes(language)
  );
}

// Apply a preset transformation
export function applyPreset(code: string, presetId: string, language: PlaygroundLanguage): string {
  const preset = OPTIMIZATION_PRESETS.find(p => p.id === presetId);
  if (!preset || !preset.appliesTo.includes(language)) {
    return code;
  }
  return preset.transform(code);
}

// Apply multiple presets
export function applyPresets(code: string, presetIds: string[], language: PlaygroundLanguage): string {
  return presetIds.reduce((result, presetId) => {
    return applyPreset(result, presetId, language);
  }, code);
}

// Generate diff between two code strings
export function generateDiff(original: string, modified: string): CodeTransformation {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  // Simple diff logic - find first and last changed lines
  let firstDiff = 0;
  let lastDiff = Math.max(originalLines.length, modifiedLines.length) - 1;
  
  // Find first difference
  while (firstDiff < originalLines.length && 
         firstDiff < modifiedLines.length && 
         originalLines[firstDiff] === modifiedLines[firstDiff]) {
    firstDiff++;
  }
  
  // Find last difference
  while (lastDiff >= 0 && 
         lastDiff < originalLines.length && 
         lastDiff < modifiedLines.length && 
         originalLines[lastDiff] === modifiedLines[lastDiff]) {
    lastDiff--;
  }
  
  const before = originalLines.slice(Math.max(0, firstDiff - 2), Math.min(originalLines.length, lastDiff + 3)).join('\n');
  const after = modifiedLines.slice(Math.max(0, firstDiff - 2), Math.min(modifiedLines.length, lastDiff + 3)).join('\n');
  
  return {
    name: 'Code Changes',
    description: 'Changes applied to the code',
    before,
    after,
    language: 'javascript',
  };
}

// Create a patch/diff string
export function createPatch(filename: string, original: string, modified: string): string {
  const timestamp = new Date().toISOString();
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  let patch = `--- a/${filename}\t${timestamp}\n`;
  patch += `+++ b/${filename}\t${timestamp}\n`;
  patch += `@@ -1,${originalLines.length} +1,${modifiedLines.length} @@\n`;
  
  // Simple unified diff format
  const maxLines = Math.max(originalLines.length, modifiedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = originalLines[i];
    const newLine = modifiedLines[i];
    
    if (oldLine === undefined) {
      patch += `+${newLine}\n`;
    } else if (newLine === undefined) {
      patch += `-${oldLine}\n`;
    } else if (oldLine !== newLine) {
      patch += `-${oldLine}\n`;
      patch += `+${newLine}\n`;
    } else {
      patch += ` ${oldLine}\n`;
    }
  }
  
  return patch;
}

// Generate commit message
export function generateCommitMessage(appliedPresets: string[]): string {
  if (appliedPresets.length === 0) {
    return 'chore: update code formatting';
  }
  
  if (appliedPresets.length === 1) {
    const preset = OPTIMIZATION_PRESETS.find(p => p.id === appliedPresets[0]);
    return `perf: ${preset?.name.toLowerCase() || 'optimize code'}`;
  }
  
  return `perf: apply ${appliedPresets.length} optimizations`;
}

// Estimate bundle size change
export function estimateSizeChange(original: string, modified: string): { 
  before: number; 
  after: number; 
  change: number;
  changePercent: number;
} {
  const before = new Blob([original]).size;
  const after = new Blob([modified]).size;
  const change = after - before;
  const changePercent = before > 0 ? (change / before) * 100 : 0;
  
  return {
    before,
    after,
    change,
    changePercent: Math.round(changePercent * 100) / 100,
  };
}
