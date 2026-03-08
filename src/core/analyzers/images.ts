import type { ImageAnalysis, ImageOptimization } from '@/types';

function getImageFormat(src: string): ImageOptimization['format'] {
  const ext = src.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'jpeg';
    case 'png':
      return 'png';
    case 'gif':
      return 'gif';
    case 'webp':
      return 'webp';
    case 'avif':
      return 'avif';
    case 'svg':
      return 'svg';
    default:
      return 'unknown';
  }
}

function isModernFormat(format: ImageOptimization['format']): boolean {
  return format === 'webp' || format === 'avif' || format === 'svg';
}

function estimateOptimizedSize(
  currentSize: number,
  format: ImageOptimization['format']
): { estimatedSize: number; savings: number } {
  // Rough compression estimates compared to original
  const compressionRatios: Record<ImageOptimization['format'], number> = {
    jpeg: 0.85,
    png: 0.9,
    gif: 0.9,
    webp: 0.7, // WebP is ~30% smaller
    avif: 0.5, // AVIF is ~50% smaller
    svg: 1,
    unknown: 1,
  };

  const ratio = compressionRatios[format];
  const estimatedSize = Math.round(currentSize * ratio);
  const savings = currentSize - estimatedSize;

  return { estimatedSize, savings };
}

export function analyzeImages(
  htmlContent: string,
  assetSizes?: Map<string, number>
): ImageAnalysis {
  const images: ImageOptimization[] = [];

  if (!htmlContent) {
    return {
      images: [],
      totalSize: 0,
      optimizableSize: 0,
      modernFormatPercentage: 0,
      lazyLoadingPercentage: 0,
      recommendations: [],
    };
  }

  // Parse img tags
  const imgRegex = /<img[^>]*>/gi;
  let match: RegExpExecArray | null;

  // Track for LCP detection (largest image above fold)
  let largestImage: ImageOptimization | undefined;
  let largestSize = 0;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const tag = match[0];

    // Extract attributes
    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
    const src = srcMatch?.[1] || '';

    if (!src || src.startsWith('data:')) continue; // Skip data URIs for now

    const widthMatch = tag.match(/width=["']?(\d+)["']?/i);
    const heightMatch = tag.match(/height=["']?(\d+)["']?/i);
    const loadingMatch = tag.match(/loading=["']([^"']+)["']/i);
    const srcsetMatch = tag.match(/srcset=["']([^"']+)["']/i);
    const sizesMatch = tag.match(/sizes=["']([^"']+)["']/i);

    const format = getImageFormat(src);
    const hasDimensions = !!(widthMatch && heightMatch);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : undefined;
    const height = heightMatch ? parseInt(heightMatch[1], 10) : undefined;

    // Estimate size (use provided asset sizes or estimate)
    let currentSize = assetSizes?.get(src) || 0;
    if (currentSize === 0) {
      // Rough estimate based on dimensions if available
      if (width && height) {
        // Assume ~3 bytes per pixel for uncompressed, adjust for format
        const pixelCount = width * height;
        const bytesPerPixel = format === 'jpeg' ? 0.15 : format === 'png' ? 0.3 : 0.2;
        currentSize = Math.round(pixelCount * bytesPerPixel);
      } else {
        // Default estimate for unknown size
        currentSize = 50000; // 50KB default
      }
    }

    const { estimatedSize, savings } = estimateOptimizedSize(currentSize, format);

    const imageOpt: ImageOptimization = {
      src,
      currentSize,
      estimatedOptimizedSize: estimatedSize,
      format,
      hasModernFormat: isModernFormat(format),
      hasSrcset: !!srcsetMatch,
      hasSizes: !!sizesMatch,
      hasLazyLoading: loadingMatch?.[1] === 'lazy',
      hasDimensions,
      isLCP: false, // Will be determined later
      savings,
      width,
      height,
    };

    images.push(imageOpt);

    // Track largest image (potential LCP candidate)
    if (currentSize > largestSize && !imageOpt.hasLazyLoading) {
      largestSize = currentSize;
      largestImage = imageOpt;
    }
  }

  // Mark LCP image
  if (largestImage) {
    const lcpIndex = images.findIndex(img => img.src === largestImage!.src);
    if (lcpIndex >= 0) {
      images[lcpIndex].isLCP = true;
    }
  }

  // Parse picture elements for modern format detection
  const pictureRegex = /<picture[^>]*>[\s\S]*?<\/picture>/gi;
  while ((match = pictureRegex.exec(htmlContent)) !== null) {
    const picture = match[0];
    const hasWebP = picture.includes('type="image/webp"');
    const hasAVIF = picture.includes('type="image/avif"');

    if (hasWebP || hasAVIF) {
      // Find the associated img and mark it as having modern format support
      const imgMatch = picture.match(/<img[^>]*src=["']([^"']+)["']/i);
      if (imgMatch) {
        const src = imgMatch[1];
        const imgIndex = images.findIndex(img => img.src === src);
        if (imgIndex >= 0) {
          images[imgIndex].hasModernFormat = true;
        }
      }
    }
  }

  // Calculate statistics
  const totalSize = images.reduce((sum, img) => sum + img.currentSize, 0);
  const optimizableSize = images.reduce((sum, img) => sum + img.savings, 0);

  const modernFormatCount = images.filter(img => img.hasModernFormat).length;
  const modernFormatPercentage = images.length > 0 ? (modernFormatCount / images.length) * 100 : 0;

  const lazyLoadedCount = images.filter(img => img.hasLazyLoading).length;
  const lazyLoadingPercentage = images.length > 0 ? (lazyLoadedCount / images.length) * 100 : 0;

  // Generate recommendations
  const recommendations: string[] = [];

  const nonModernImages = images.filter(img => !img.hasModernFormat && img.format !== 'svg');
  if (nonModernImages.length > 0) {
    const potentialSavings = nonModernImages.reduce((sum, img) => {
      // Estimate savings from WebP conversion
      return sum + Math.round(img.currentSize * 0.3);
    }, 0);
    recommendations.push(
      `Convert ${nonModernImages.length} images to WebP/AVIF format (potential savings: ${(potentialSavings / 1024 / 1024).toFixed(2)} MB)`
    );
  }

  const imagesWithoutLazy = images.filter(img => !img.hasLazyLoading && !img.isLCP);
  if (imagesWithoutLazy.length > 0) {
    recommendations.push(
      `Add loading="lazy" to ${imagesWithoutLazy.length} below-the-fold images`
    );
  }

  const imagesWithoutDimensions = images.filter(img => !img.hasDimensions);
  if (imagesWithoutDimensions.length > 0) {
    recommendations.push(
      `Add explicit width and height to ${imagesWithoutDimensions.length} images to prevent layout shift`
    );
  }

  const imagesWithoutSrcset = images.filter(img => !img.hasSrcset && img.format !== 'svg');
  if (imagesWithoutSrcset.length > 2) {
    recommendations.push(
      `Consider using srcset for responsive images (${imagesWithoutSrcset.length} images could benefit)`
    );
  }

  const largeImages = images.filter(img => img.currentSize > 200 * 1024);
  if (largeImages.length > 0) {
    recommendations.push(
      `Optimize ${largeImages.length} large images (>200KB each)`
    );
  }

  return {
    images,
    totalSize,
    optimizableSize,
    modernFormatPercentage,
    lazyLoadingPercentage,
    lcpImage: largestImage,
    recommendations,
  };
}
