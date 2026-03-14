/**
 * Stream Processing Utilities
 * 
 * Provides chunked processing for large files to prevent memory issues
 * 
 * @module streamProcessor
 */

/**
 * Process large text data in chunks
 */
export async function* chunkProcessor(
  content: string,
  chunkSize: number = 1024 * 1024 // 1MB chunks
): AsyncGenerator<string, void, unknown> {
  let offset = 0;
  
  while (offset < content.length) {
    const chunk = content.slice(offset, offset + chunkSize);
    yield chunk;
    offset += chunkSize;
    
    // Allow event loop to process other tasks
    if (offset < content.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

/**
 * Process array items in batches with progress callback
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R> | R,
  batchSize: number = 10,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
    
    // Yield to event loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}

/**
 * Memory-conscious line processor for large text files
 */
export async function* lineProcessor(content: string): AsyncGenerator<string, void, unknown> {
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    yield lines[i];
    
    // Yield every 1000 lines to prevent blocking
    if (i % 1000 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

/**
 * Generator-based JSON parser for large JSON files
 */
export async function* jsonStreamParser<T>(
  jsonString: string
): AsyncGenerator<T, void, unknown> {
  // Simple approach: parse and yield array items one by one
  try {
    const data = JSON.parse(jsonString);
    
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        yield data[i];
        
        if (i % 100 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } else {
      yield data;
    }
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }
}

/**
 * Memory usage monitor
 */
export interface MemorySnapshot {
  used: number;
  total: number;
  limit: number;
  percentUsed: number;
}

/**
 * Get current memory usage (works in both browser and Node.js)
 */
export function getMemoryUsage(): MemorySnapshot | null {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as unknown as Record<string, unknown>)) {
    const memory = (window.performance as unknown as { memory: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    }}).memory;
    
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentUsed: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
  
  return null;
}

/**
 * Check if memory usage is approaching limit
 */
export function isMemoryConstrained(threshold: number = 0.8): boolean {
  const memory = getMemoryUsage();
  if (!memory) return false;
  
  return memory.percentUsed > threshold * 100;
}

/**
 * Automatic cleanup trigger
 */
export function requestMemoryCleanup(): void {
  if (typeof window !== 'undefined' && 'gc' in window) {
    // Try to trigger garbage collection if available
    try {
      (window as unknown as { gc: () => void }).gc();
    } catch {
      // Ignore if not available
    }
  }
}

/**
 * Process large DOM content in chunks
 */
export async function* domChunkProcessor(html: string): AsyncGenerator<string, void, unknown> {
  // Split by common block-level elements to process in logical chunks
  const blockElements = /(<(?:div|section|article|main|header|footer|nav|aside)[^>]*>)/gi;
  const chunks = html.split(blockElements);
  
  for (let i = 0; i < chunks.length; i++) {
    yield chunks[i];
    
    if (i % 50 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

/**
 * Throttled processor that respects frame budget
 */
export async function processWithFrameBudget<T, R>(
  items: T[],
  processor: (item: T) => R,
  frameBudget: number = 16 // 16ms = 60fps
): Promise<R[]> {
  const results: R[] = [];
  let startTime = performance.now();
  
  for (const item of items) {
    const now = performance.now();
    
    // If we're approaching the frame budget, yield
    if (now - startTime > frameBudget) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      startTime = performance.now();
    }
    
    results.push(processor(item));
  }
  
  return results;
}

/**
 * Lazy evaluation wrapper for expensive computations
 */
export class Lazy<T> {
  private value: T | undefined;
  private computed = false;
  
  constructor(private factory: () => T) {}
  
  get(): T {
    if (!this.computed) {
      this.value = this.factory();
      this.computed = true;
    }
    return this.value as T;
  }
  
  reset(): void {
    this.computed = false;
    this.value = undefined;
  }
  
  isComputed(): boolean {
    return this.computed;
  }
}

/**
 * Create a lazy-evaluated value
 */
export function lazy<T>(factory: () => T): Lazy<T> {
  return new Lazy(factory);
}
