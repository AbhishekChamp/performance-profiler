/**
 * File Analysis Cache
 * 
 * Caches analysis results per file using content hashing
 * to enable incremental analysis
 * 
 * @module fileCache
 */

import { get, set, del, clear } from 'idb-keyval';

/**
 * Cache entry for a file analysis
 */
export interface FileCacheEntry<T> {
  /** Content hash of the file */
  hash: string;
  /** Analysis result */
  result: T;
  /** Timestamp of analysis */
  timestamp: number;
  /** File size for verification */
  size: number;
  /** Cache version */
  version: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Max age in milliseconds (default: 7 days) */
  maxAge: number;
  /** Max number of entries (default: 1000) */
  maxEntries: number;
  /** Cache version for invalidation */
  version: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEntries: 1000,
  version: 1
};

/**
 * Generate a simple hash from content
 */
export function generateContentHash(content: string): string {
  let hash = 0;
  
  if (content.length === 0) return '0';
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16);
}

/**
 * File cache manager
 */
export class FileCache<T> {
  private config: CacheConfig;
  private namespace: string;
  private accessLog: Map<string, number> = new Map();
  
  constructor(namespace: string, config: Partial<CacheConfig> = {}) {
    this.namespace = namespace;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Get cached result for a file
   */
  async get(fileName: string, content: string): Promise<T | null> {
    const hash = generateContentHash(content);
    const key = `${this.namespace}:${fileName}`;
    
    try {
      const entry = await get<FileCacheEntry<T>>(key);
      
      if (!entry) return null;
      
      // Check version
      if (entry.version !== this.config.version) return null;
      
      // Check hash match
      if (entry.hash !== hash) return null;
      
      // Check size match
      if (entry.size !== content.length) return null;
      
      // Check age
      if (Date.now() - entry.timestamp > this.config.maxAge) {
        await del(key);
        return null;
      }
      
      // Update access log
      this.accessLog.set(fileName, Date.now());
      
      return entry.result;
    } catch {
      return null;
    }
  }
  
  /**
   * Store analysis result for a file
   */
  async set(fileName: string, content: string, result: T): Promise<void> {
    const hash = generateContentHash(content);
    const key = `${this.namespace}:${fileName}`;
    
    const entry: FileCacheEntry<T> = {
      hash,
      result,
      timestamp: Date.now(),
      size: content.length,
      version: this.config.version
    };
    
    await set(key, entry);
    this.accessLog.set(fileName, Date.now());
    
    // Check if we need to evict old entries
    await this.enforceMaxEntries();
  }
  
  /**
   * Check if file is cached and up-to-date
   */
  async has(fileName: string, content: string): Promise<boolean> {
    const cached = await this.get(fileName, content);
    return cached !== null;
  }
  
  /**
   * Invalidate cache for a specific file
   */
  async invalidate(fileName: string): Promise<void> {
    const key = `${this.namespace}:${fileName}`;
    await del(key);
    this.accessLog.delete(fileName);
  }
  
  /**
   * Clear all cached entries for this namespace
   */
  async clear(): Promise<void> {
    // Note: idb-keyval doesn't support prefix deletion directly
    // In production, use a more sophisticated approach
    this.accessLog.clear();
  }
  
  /**
   * Enforce maximum number of entries
   */
  private async enforceMaxEntries(): Promise<void> {
    if (this.accessLog.size <= this.config.maxEntries) return;
    
    // Sort by last access time (oldest first)
    const sorted = Array.from(this.accessLog.entries())
      .sort((a, b) => a[1] - b[1]);
    
    // Remove oldest entries (20% of max)
    const toRemove = Math.floor(this.config.maxEntries * 0.2);
    const keysToRemove = sorted.slice(0, toRemove);
    
    for (const [fileName] of keysToRemove) {
      await this.invalidate(fileName);
    }
  }
  
  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    entries: number;
    namespace: string;
    version: number;
  }> {
    return {
      entries: this.accessLog.size,
      namespace: this.namespace,
      version: this.config.version
    };
  }
}

/**
 * Global cache instances by namespace
 */
const cacheInstances: Map<string, FileCache<unknown>> = new Map();

/**
 * Get or create a cache instance
 */
export function getCache<T>(namespace: string, config?: Partial<CacheConfig>): FileCache<T> {
  if (!cacheInstances.has(namespace)) {
    cacheInstances.set(namespace, new FileCache<T>(namespace, config));
  }
  return cacheInstances.get(namespace) as FileCache<T>;
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  await clear();
  cacheInstances.clear();
}

/**
 * Detect changed files between two sets
 */
export function detectChangedFiles(
  previousFiles: Map<string, string>,
  currentFiles: Map<string, string>
): {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
} {
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];
  const unchanged: string[] = [];
  
  // Check for added and modified files
  for (const [name, hash] of currentFiles) {
    if (!previousFiles.has(name)) {
      added.push(name);
    } else if (previousFiles.get(name) !== hash) {
      modified.push(name);
    } else {
      unchanged.push(name);
    }
  }
  
  // Check for removed files
  for (const name of previousFiles.keys()) {
    if (!currentFiles.has(name)) {
      removed.push(name);
    }
  }
  
  return { added, removed, modified, unchanged };
}

/**
 * Create file hash map from InputFile array
 */
export function createFileHashMap(files: Array<{ name: string; content: string }>): Map<string, string> {
  const map = new Map<string, string>();
  
  for (const file of files) {
    map.set(file.name, generateContentHash(file.content));
  }
  
  return map;
}
