/**
 * Data Export Utilities
 * 
 * Provides full data export functionality for reports, settings, and history.
 * 
 * @module dataExport
 */

import type { AnalysisReport } from '@/types';

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'json-pretty' | 'compressed';

/**
 * Export scope options
 */
export type ExportScope = 'all' | 'reports' | 'settings' | 'date-range';

/**
 * Export configuration
 */
export interface ExportConfig {
  format: ExportFormat;
  scope: ExportScope;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeHistory?: boolean;
  includeSettings?: boolean;
  includeTemplates?: boolean;
  password?: string; // For encrypted exports
}

/**
 * Complete app data for export
 */
export interface AppDataExport {
  version: string;
  exportDate: string;
  schema: number;
  data: {
    reports: AnalysisReport[];
    settings?: Record<string, unknown>;
    templates?: unknown[];
    history?: unknown[];
  };
  metadata: {
    reportCount: number;
    totalSize: number;
    exportedBy: string;
  };
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: AppDataExport, pretty = false): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

/**
 * Compress data using CompressionStream API
 */
export async function compressData(data: string): Promise<Blob> {
  const stream = new Blob([data]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  return new Response(compressedStream).blob();
}

/**
 * Decompress data
 */
export async function decompressData(blob: Blob): Promise<string> {
  const stream = blob.stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
  const response = new Response(decompressedStream);
  return response.text();
}

/**
 * Download data as file
 */
export function downloadFile(data: Blob | string, filename: string, mimeType?: string): void {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType ?? 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Export reports to CSV format
 */
export function exportReportsToCSV(reports: AnalysisReport[]): string {
  const headers = [
    'ID',
    'Timestamp',
    'URL',
    'Overall Score',
    'Bundle Score',
    'DOM Score',
    'CSS Score',
    'JS Score',
    'Web Vitals Score',
    'Issues Count',
    'Total Size (KB)',
  ].join(',');
  
  const rows = reports.map(report => [
    report.id,
    new Date(report.timestamp).toISOString(),
    (report as unknown as { url?: string }).url ?? '',
    report.score.overall,
    report.score.bundle,
    report.score.dom,
    report.score.css,
    report.score.javascript,
    report.score.webVitals ?? 0,
    (report as unknown as { issues?: unknown[] }).issues?.length ?? 0,
    Math.round(((report as unknown as { totalSize?: number }).totalSize ?? 0) / 1024),
  ].join(','));
  
  return [headers, ...rows].join('\n');
}

/**
 * Calculate export size estimate
 */
export function estimateExportSize(
  reportCount: number,
  includeSettings: boolean,
  includeHistory: boolean
): string {
  // Rough estimates
  const reportSize = 50 * 1024; // ~50KB per report
  const settingsSize = 5 * 1024; // ~5KB
  const historySize = 10 * 1024; // ~10KB
  
  let total = reportCount * reportSize;
  if (includeSettings) total += settingsSize;
  if (includeHistory) total += historySize;
  
  if (total < 1024) return `${total} B`;
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Create selective export based on config
 */
export async function createExport(
  reports: AnalysisReport[],
  config: ExportConfig,
  settings?: Record<string, unknown>,
  templates?: unknown[],
  history?: unknown[]
): Promise<{ data: Blob | string; filename: string }> {
  // Filter reports by date range if specified
  let filteredReports = reports;
  if (config.scope === 'date-range' && config.dateRange) {
    filteredReports = reports.filter(r => {
      const date = new Date(r.timestamp);
      return date >= config.dateRange.start && date <= config.dateRange.end;
    });
  }
  
  // Build export data
  const exportData: AppDataExport = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    schema: 1,
    data: {
      reports: filteredReports,
    },
    metadata: {
      reportCount: filteredReports.length,
      totalSize: JSON.stringify(filteredReports).length,
      exportedBy: 'Frontend Performance Profiler',
    },
  };
  
  if (config.includeSettings === true && settings != null) {
    exportData.data.settings = settings;
  }
  
  if (config.includeTemplates === true && templates != null) {
    exportData.data.templates = templates;
  }
  
  if (config.includeHistory === true && history != null) {
    exportData.data.history = history;
  }
  
  // Format output
  const jsonData = exportToJSON(exportData, config.format === 'json-pretty');
  
  if (config.format === 'compressed') {
    const compressed = await compressData(jsonData);
    return {
      data: compressed,
      filename: `performance-profiler-export-${Date.now()}.json.gz`,
    };
  }
  
  return {
    data: jsonData,
    filename: `performance-profiler-export-${Date.now()}.json`,
  };
}
