import type { BundleAnalysis, BundleModule, DuplicateLibrary } from '@/types';

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const VENDOR_PATTERNS = [
  /^react/,
  /^react-dom/,
  /^vue/,
  /^@angular/,
  /^next/,
  /^lodash/,
  /^axios/,
  /^moment/,
  /^dayjs/,
  /^date-fns/,
  /^chart\.js/,
  /^d3/,
  /^three/,
  /^gsap/,
  /^@mui/,
  /^@material-ui/,
  /^antd/,
  /^bootstrap/,
  /^tailwind/,
  /^@radix-ui/,
  /^@headlessui/,
  /^framer-motion/,
  /^styled-components/,
  /^emotion/,
  /^zustand/,
  /^redux/,
  /^mobx/,
  /^@tanstack/,
  /^swr/,
  /^uuid/,
  /^classnames/,
  /^clsx/,
  /^zod/,
  /^yup/,
  /^joi/,
  /^@types\//,
];

function isVendorModule(name: string): boolean {
  return VENDOR_PATTERNS.some(pattern => pattern.test(name));
}

function getModuleName(path: string): string {
  // Extract package name from path
  const match = path.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
  return match ? match[1] : path.split('/').pop() || path;
}

export function analyzeBundle(
  files: { name: string; content: string; size: number }[]
): BundleAnalysis | undefined {
  const jsFiles = files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.mjs'));
  
  if (jsFiles.length === 0) return undefined;

  const modules: BundleModule[] = [];
  const packageJson = files.find(f => f.name === 'package.json');
  let dependencies: Record<string, string> = {};

  if (packageJson) {
    try {
      const pkg: PackageJson = JSON.parse(packageJson.content);
      dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
    } catch {
      // Ignore parse errors
    }
  }

  // Parse each JS file as a module
  for (const file of jsFiles) {
    const name = getModuleName(file.name);
    const isVendor = isVendorModule(name);
    
    // Estimate gzipped size (rough approximation)
    const gzippedSize = Math.round(file.size * 0.3);

    // Detect dependencies from import/require statements
    const deps: string[] = [];
    const importRegex = /(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const esmRegex = /import\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"];?/g;
    
    let match;
    while ((match = importRegex.exec(file.content)) !== null) {
      deps.push(match[1]);
    }
    while ((match = esmRegex.exec(file.content)) !== null) {
      deps.push(match[1]);
    }

    modules.push({
      id: file.name,
      name,
      size: file.size,
      gzippedSize,
      type: isVendor ? 'vendor' : 'chunk',
      dependencies: [...new Set(deps)],
      dependents: [],
      path: file.name,
    });
  }

  // Build dependents graph
  for (const module of modules) {
    for (const dep of module.dependencies) {
      const depModule = modules.find(m => m.name === dep || m.id.includes(dep));
      if (depModule) {
        depModule.dependents.push(module.id);
      }
    }
  }

  // Calculate totals
  const totalSize = modules.reduce((sum, m) => sum + m.size, 0);
  const gzippedSize = modules.reduce((sum, m) => sum + (m.gzippedSize || 0), 0);
  
  // Calculate vendor size
  const vendorModules = modules.filter(m => m.type === 'vendor');
  const vendorSize = vendorModules.reduce((sum, m) => sum + m.size, 0);
  const vendorPercentage = totalSize > 0 ? (vendorSize / totalSize) * 100 : 0;

  // Find largest modules
  const largestModules = [...modules]
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  // Detect duplicate libraries
  const libraryVersions = new Map<string, Set<string>>();
  const librarySizes = new Map<string, number>();

  for (const module of modules) {
    const baseName = module.name.replace(/@[\d.]+$/, '').replace(/\/.*$/, '');
    if (!libraryVersions.has(baseName)) {
      libraryVersions.set(baseName, new Set());
      librarySizes.set(baseName, 0);
    }
    
    const version = dependencies[baseName] || 'unknown';
    libraryVersions.get(baseName)!.add(version);
    librarySizes.set(baseName, librarySizes.get(baseName)! + module.size);
  }

  const duplicateLibraries: DuplicateLibrary[] = [];
  for (const [name, versions] of libraryVersions) {
    if (versions.size > 1) {
      duplicateLibraries.push({
        name,
        versions: [...versions],
        instances: versions.size,
        totalSize: librarySizes.get(name) || 0,
      });
    }
  }

  return {
    totalSize,
    gzippedSize,
    moduleCount: modules.length,
    largestModules,
    duplicateLibraries,
    vendorSize,
    vendorPercentage,
    modules,
  };
}
