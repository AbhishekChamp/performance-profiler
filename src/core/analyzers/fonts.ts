import type { FontAnalysis, FontFace } from '@/types';

function extractFontFormat(url: string): FontFace['format'] {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
  switch (ext) {
    case 'woff2':
      return 'woff2';
    case 'woff':
      return 'woff';
    case 'ttf':
      return 'ttf';
    case 'otf':
      return 'otf';
    case 'eot':
      return 'eot';
    default:
      return 'woff2'; // Assume modern if unknown
  }
}

function estimateFontSize(format: FontFace['format']): number {
  // Rough estimates based on average font file sizes
  const sizes: Record<FontFace['format'], number> = {
    woff2: 25000, // ~25KB
    woff: 35000,  // ~35KB
    ttf: 50000,   // ~50KB
    otf: 55000,   // ~55KB
    eot: 45000,   // ~45KB
  };
  return sizes[format];
}

export function analyzeFonts(cssFiles: { name: string; content: string }[]): FontAnalysis {
  const fonts: FontFace[] = [];
  const missingPreloads: string[] = [];
  const variableFontOpportunities: string[] = [];

  // Track font families to detect duplicates
  const fontFamilySizes: Map<string, number> = new Map();
  const fontFamilyVariations: Map<string, Set<string>> = new Map();

  for (const file of cssFiles) {
    const content = file.content;

    // Match @font-face rules
    const fontFaceRegex = /@font-face\s*\{([^}]+)\}/gi;
    let match: RegExpExecArray | null;

    while ((match = fontFaceRegex.exec(content)) !== null) {
      const declaration = match[1];

      // Extract font-family
      const familyMatch = declaration.match(/font-family:\s*["']?([^;"']+)["']?/i);
      const family = familyMatch?.[1].trim() ?? 'Unknown';

      // Extract src URLs
      const srcMatch = declaration.match(/src:\s*([^;]+)/i);
      if (!srcMatch) continue;

      const src = srcMatch[1];

      // Extract all URLs from src
      const urlRegex = /url\(["']?([^"')]+)["']?\)/gi;
      let urlMatch: RegExpExecArray | null;

      while ((urlMatch = urlRegex.exec(src)) !== null) {
        const url = urlMatch[1];
        const format = extractFontFormat(url);

        // Extract font-display
        const displayMatch = declaration.match(/font-display:\s*([^;]+)/i);
        const displayValue = displayMatch?.[1].trim();
        const display: FontFace['display'] = (displayValue ?? 'auto') as FontFace['display'];

        // Extract unicode-range
        const unicodeRangeMatch = declaration.match(/unicode-range:\s*([^;]+)/i);
        const unicodeRange = unicodeRangeMatch?.[1].trim();

        // Check if preloaded (we can't know from CSS alone, so assume false)
        const isPreloaded = false;

        const estimatedSize = estimateFontSize(format);

        const font: FontFace = {
          family,
          source: url,
          format,
          display,
          unicodeRange,
          isPreloaded,
          estimatedSize,
        };

        fonts.push(font);

        // Track family stats
        fontFamilySizes.set(family, (fontFamilySizes.get(family) ?? 0) + estimatedSize);

        let variations = fontFamilyVariations.get(family);
        if (!variations) {
          variations = new Set();
          fontFamilyVariations.set(family, variations);
        }
        variations.add(declaration);
      }
    }
  }

  // Identify missing preloads for critical fonts (first few unique families)
  const uniqueFamilies = [...new Set(fonts.map(f => f.family))].slice(0, 3);
  for (const family of uniqueFamilies) {
    const familyFonts = fonts.filter(f => f.family === family);
    const hasPreload = familyFonts.some(f => f.isPreloaded);

    if (!hasPreload) {
      const woff2Font = familyFonts.find(f => f.format === 'woff2');
      if (woff2Font) {
        missingPreloads.push(woff2Font.source);
      }
    }
  }

  // Detect variable font opportunities
  for (const [family, variations] of fontFamilyVariations) {
    if (variations.size >= 4) {
      // Many variations suggest this could be a variable font candidate
      const totalSize = fontFamilySizes.get(family) ?? 0;
      if (totalSize > 100000) { // >100KB in variations
        variableFontOpportunities.push(
          `${family} (${variations.size} variations, ~${(totalSize / 1024).toFixed(0)}KB)`
        );
      }
    }
  }

  // Calculate statistics
  const totalFontSize = fonts.reduce((sum, f) => sum + f.estimatedSize, 0);
  const fontsWithoutDisplay = fonts.filter(f => f.display === 'auto' || f.display === 'block').length;

  // Check for system font fallbacks by looking at font-family declarations
  const fontFamilyRegex = /font-family:\s*([^;]+)/gi;
  const systemFallbacks = new Set<string>();

  for (const file of cssFiles) {
    let match: RegExpExecArray | null;
    while ((match = fontFamilyRegex.exec(file.content)) !== null) {
      const families = match[1];
      // Check if system fonts are included as fallbacks
      if (families.includes('system-ui') ||
          families.includes('-apple-system') ||
          families.includes('BlinkMacSystemFont') ||
          families.includes('Segoe UI') ||
          families.includes('Roboto')) {
        systemFallbacks.add(match[0]);
      }
    }
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (fontsWithoutDisplay > 0) {
    recommendations.push(
      `Add font-display: swap to ${fontsWithoutDisplay} font faces to prevent invisible text during loading`
    );
  }

  if (missingPreloads.length > 0) {
    recommendations.push(
      `Preload critical fonts: ${missingPreloads.slice(0, 2).join(', ')}${missingPreloads.length > 2 ? '...' : ''}`
    );
  }

  const nonWoff2Fonts = fonts.filter(f => f.format !== 'woff2');
  if (nonWoff2Fonts.length > 0) {
    recommendations.push(
      `Convert ${nonWoff2Fonts.length} fonts to WOFF2 format for better compression`
    );
  }

  if (variableFontOpportunities.length > 0) {
    recommendations.push(
      `Consider using variable fonts for: ${variableFontOpportunities.slice(0, 2).join(', ')}`
    );
  }

  if (systemFallbacks.size === 0 && fonts.length > 0) {
    recommendations.push(
      'Add system font fallbacks to font-family declarations for faster initial render'
    );
  }

  // Calculate score
  let score = 100;

  // Deduct for fonts without font-display
  score -= fontsWithoutDisplay * 5;

  // Deduct for missing preloads
  score -= missingPreloads.length * 10;

  // Deduct for non-WOFF2 formats
  score -= nonWoff2Fonts.length * 3;

  // Deduct for large total font size
  if (totalFontSize > 500000) { // >500KB
    score -= 15;
  } else if (totalFontSize > 200000) { // >200KB
    score -= 5;
  }

  return {
    fonts,
    totalFontSize,
    fontsWithoutDisplay,
    missingPreloads,
    systemFontFallbacks: systemFallbacks.size > 0,
    variableFontOpportunities,
    recommendations,
    score: Math.max(0, Math.min(100, score)),
  };
}
