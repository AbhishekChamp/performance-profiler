import type { Asset, AssetAnalysis, AssetBreakdown } from '@/types';

const TYPE_MAP: Record<string, string> = {
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.ts': 'javascript',
  '.tsx': 'javascript',
  '.jsx': 'javascript',
  '.css': 'css',
  '.scss': 'css',
  '.sass': 'css',
  '.less': 'css',
  '.png': 'images',
  '.jpg': 'images',
  '.jpeg': 'images',
  '.gif': 'images',
  '.svg': 'images',
  '.webp': 'images',
  '.ico': 'images',
  '.woff': 'fonts',
  '.woff2': 'fonts',
  '.ttf': 'fonts',
  '.otf': 'fonts',
  '.eot': 'fonts',
};

function getAssetType(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return TYPE_MAP[ext] || 'other';
}

export function analyzeAssets(
  files: { name: string; size: number }[]
): AssetAnalysis | undefined {
  if (files.length === 0) return undefined;

  const assets: Asset[] = files.map(file => ({
    path: file.name,
    type: getAssetType(file.name),
    size: file.size,
  }));

  // Calculate breakdown
  const breakdown: AssetBreakdown = {
    javascript: 0,
    css: 0,
    images: 0,
    fonts: 0,
    other: 0,
    total: 0,
  };

  for (const asset of assets) {
    breakdown[asset.type as keyof Omit<AssetBreakdown, 'total'>] += asset.size;
    breakdown.total += asset.size;
  }

  // Calculate percentages
  const total = breakdown.total || 1;
  const percentages = {
    javascript: (breakdown.javascript / total) * 100,
    css: (breakdown.css / total) * 100,
    images: (breakdown.images / total) * 100,
    fonts: (breakdown.fonts / total) * 100,
    other: (breakdown.other / total) * 100,
    total: 100,
  };

  // Find largest assets
  const largestAssets = [...assets]
    .sort((a, b) => b.size - a.size)
    .slice(0, 20);

  // Group by type
  const byType: Record<string, Asset[]> = {};
  for (const asset of assets) {
    byType[asset.type] ??= [];
    byType[asset.type].push(asset);
  }

  // Sort each type by size
  Object.values(byType).forEach(typeAssets => {
    typeAssets.sort((a, b) => b.size - a.size);
  });

  return {
    breakdown,
    percentages,
    largestAssets,
    byType,
  };
}
