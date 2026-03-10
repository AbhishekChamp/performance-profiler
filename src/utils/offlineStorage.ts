import { get, set, del, keys, clear } from 'idb-keyval';
import type { AnalysisReport } from '@/types';

// Storage keys
const STORAGE_KEYS = {
  REPORTS: 'offline-reports',
  REPORT_METADATA: 'offline-report-metadata',
  LAST_SYNC: 'offline-last-sync',
  PENDING_ANALYSES: 'offline-pending-analyses',
} as const;

// Maximum number of reports to store
const MAX_REPORTS = 100;

interface ReportMetadata {
  id: string;
  timestamp: number;
  name: string;
  size: number;
  score: number;
  isPinned: boolean;
}

interface PendingAnalysis {
  id: string;
  timestamp: number;
  files: { name: string; content: string; size: number }[];
  options: Record<string, boolean>;
}

/**
 * Get all stored report metadata sorted by timestamp (newest first)
 */
export async function getStoredReportMetadata(): Promise<ReportMetadata[]> {
  const metadata = await get<ReportMetadata[]>(STORAGE_KEYS.REPORT_METADATA);
  return metadata || [];
}

/**
 * Get a specific report by ID
 */
export async function getStoredReport(id: string): Promise<AnalysisReport | null> {
  const report = await get<AnalysisReport>(`${STORAGE_KEYS.REPORTS}:${id}`);
  return report || null;
}

/**
 * Store a report for offline access
 * Implements LRU eviction policy when storage is full
 */
export async function storeReport(report: AnalysisReport): Promise<void> {
  const metadata = await getStoredReportMetadata();
  
  // Check if report already exists
  const existingIndex = metadata.findIndex(m => m.id === report.id);
  
  if (existingIndex >= 0) {
    // Update existing report
    metadata[existingIndex] = {
      ...metadata[existingIndex],
      timestamp: report.timestamp,
      score: report.score.overall,
    };
  } else {
    // Add new metadata
    const reportSize = new Blob([JSON.stringify(report)]).size;
    const newMetadata: ReportMetadata = {
      id: report.id,
      timestamp: report.timestamp,
      name: report.files[0]?.name || 'Untitled Report',
      size: reportSize,
      score: report.score.overall,
      isPinned: false,
    };
    
    // Check if we need to evict old reports
    const unpinnedMetadata = metadata.filter(m => !m.isPinned);
    
    if (metadata.length >= MAX_REPORTS && unpinnedMetadata.length > 0) {
      // Sort by timestamp (oldest first)
      unpinnedMetadata.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest unpinned report
      const toRemove = unpinnedMetadata[0];
      await del(`${STORAGE_KEYS.REPORTS}:${toRemove.id}`);
      
      const indexToRemove = metadata.findIndex(m => m.id === toRemove.id);
      metadata.splice(indexToRemove, 1);
    }
    
    metadata.push(newMetadata);
  }
  
  // Sort by timestamp (newest first), keeping pinned reports at the top
  metadata.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp - a.timestamp;
  });
  
  // Store report and metadata
  await set(`${STORAGE_KEYS.REPORTS}:${report.id}`, report);
  await set(STORAGE_KEYS.REPORT_METADATA, metadata);
  await set(STORAGE_KEYS.LAST_SYNC, Date.now());
}

/**
 * Delete a stored report
 */
export async function deleteStoredReport(id: string): Promise<void> {
  const metadata = await getStoredReportMetadata();
  const updatedMetadata = metadata.filter(m => m.id !== id);
  
  await del(`${STORAGE_KEYS.REPORTS}:${id}`);
  await set(STORAGE_KEYS.REPORT_METADATA, updatedMetadata);
}

/**
 * Pin or unpin a report (pinned reports won't be evicted)
 */
export async function togglePinReport(id: string): Promise<boolean> {
  const metadata = await getStoredReportMetadata();
  const reportMeta = metadata.find(m => m.id === id);
  
  if (reportMeta) {
    reportMeta.isPinned = !reportMeta.isPinned;
    
    // Re-sort metadata
    metadata.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });
    
    await set(STORAGE_KEYS.REPORT_METADATA, metadata);
    return reportMeta.isPinned;
  }
  
  return false;
}

/**
 * Clear all stored reports
 */
export async function clearStoredReports(): Promise<void> {
  const metadata = await getStoredReportMetadata();
  
  // Delete all report data
  for (const meta of metadata) {
    await del(`${STORAGE_KEYS.REPORTS}:${meta.id}`);
  }
  
  // Clear metadata
  await del(STORAGE_KEYS.REPORT_METADATA);
  await del(STORAGE_KEYS.LAST_SYNC);
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{
  totalReports: number;
  pinnedReports: number;
  totalSize: number;
  lastSync: number | null;
  isFull: boolean;
}> {
  const metadata = await getStoredReportMetadata();
  const totalSize = metadata.reduce((sum, m) => sum + m.size, 0);
  
  return {
    totalReports: metadata.length,
    pinnedReports: metadata.filter(m => m.isPinned).length,
    totalSize,
    lastSync: await get<number>(STORAGE_KEYS.LAST_SYNC) || null,
    isFull: metadata.length >= MAX_REPORTS && metadata.every(m => m.isPinned),
  };
}

/**
 * Queue an analysis for when back online
 */
export async function queuePendingAnalysis(
  files: { name: string; content: string; size: number }[],
  options: Record<string, boolean>
): Promise<string> {
  const pending = await get<PendingAnalysis[]>(STORAGE_KEYS.PENDING_ANALYSES) || [];
  
  const analysis: PendingAnalysis = {
    id: `pending-${Date.now()}`,
    timestamp: Date.now(),
    files,
    options,
  };
  
  pending.push(analysis);
  await set(STORAGE_KEYS.PENDING_ANALYSES, pending);
  
  return analysis.id;
}

/**
 * Get all pending analyses
 */
export async function getPendingAnalyses(): Promise<PendingAnalysis[]> {
  return await get<PendingAnalysis[]>(STORAGE_KEYS.PENDING_ANALYSES) || [];
}

/**
 * Remove a pending analysis from the queue
 */
export async function removePendingAnalysis(id: string): Promise<void> {
  const pending = await get<PendingAnalysis[]>(STORAGE_KEYS.PENDING_ANALYSES) || [];
  const updated = pending.filter(p => p.id !== id);
  await set(STORAGE_KEYS.PENDING_ANALYSES, updated);
}

/**
 * Clear all pending analyses
 */
export async function clearPendingAnalyses(): Promise<void> {
  await del(STORAGE_KEYS.PENDING_ANALYSES);
}

/**
 * Check if there's storage space available
 */
export async function hasStorageSpace(): Promise<boolean> {
  const metadata = await getStoredReportMetadata();
  const unpinnedCount = metadata.filter(m => !m.isPinned).length;
  return metadata.length < MAX_REPORTS || unpinnedCount > 0;
}

/**
 * Format bytes for display
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Get all stored reports
 */
export async function getAllReports(): Promise<AnalysisReport[]> {
  const metadata = await getStoredReportMetadata();
  const reports: AnalysisReport[] = [];
  
  for (const meta of metadata) {
    const report = await getStoredReport(meta.id);
    if (report) {
      reports.push(report);
    }
  }
  
  return reports;
}

/**
 * Get estimated storage quota (if available)
 */
export async function getStorageQuota(): Promise<{
  usage: number;
  quota: number;
} | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch (error) {
      console.error('[Storage] Error getting quota:', error);
    }
  }
  return null;
}
