/**
 * Data Import Utilities
 * 
 * Handles importing data with validation and conflict resolution.
 * 
 * @module dataImport
 */

import type { AnalysisReport } from '@/types';
import type { AppDataExport } from './dataExport';
import { decompressData } from './dataExport';

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  reportsImported: number;
  reportsSkipped: number;
  conflicts: ImportConflict[];
  errors: ImportError[];
}

/**
 * Import conflict
 */
export interface ImportConflict {
  type: 'duplicate' | 'newer-exists';
  report: AnalysisReport;
  existingReport?: AnalysisReport;
}

/**
 * Import error
 */
export interface ImportError {
  message: string;
  code: 'parse-error' | 'validation-error' | 'version-mismatch' | 'unknown';
}

/**
 * Import options
 */
export interface ImportOptions {
  onConflict: 'skip' | 'replace' | 'keep-both' | 'ask';
  validateData?: boolean;
  dryRun?: boolean;
}

/**
 * Parse import file
 */
export async function parseImportFile(file: File): Promise<AppDataExport | null> {
  try {
    let content: string;
    
    // Check if compressed
    if (file.name.endsWith('.gz')) {
      const blob = await file.arrayBuffer();
      content = await decompressData(new Blob([blob]));
    } else {
      content = await file.text();
    }
    
    const data = JSON.parse(content) as AppDataExport;
    
    // Basic validation - runtime checks needed for imported data
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (data.version == null || data.schema == null || data.data == null) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

/**
 * Validate imported data
 */
export function validateImportData(data: AppDataExport): ImportError[] {
  const errors: ImportError[] = [];
  
  // Check version compatibility
  if (data.schema > 1) {
    errors.push({
      message: `Unsupported schema version: ${data.schema}`,
      code: 'version-mismatch',
    });
  }
  
  // Validate reports - runtime checks needed for imported data
  for (const report of data.data.reports) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (report.id == null || report.timestamp == null || report.score == null) {
      errors.push({
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        message: `Invalid report structure: ${report.id ?? 'unknown'}`,
        code: 'validation-error',
      });
    }
  }

  return errors;
}

/**
 * Check for conflicts with existing reports
 */
export function detectConflicts(
  importedReports: AnalysisReport[],
  existingReports: AnalysisReport[]
): ImportConflict[] {
  const conflicts: ImportConflict[] = [];
  const existingMap = new Map(existingReports.map(r => [r.id, r]));
  
  for (const report of importedReports) {
    const existing = existingMap.get(report.id);
    
    if (existing) {
      const existingDate = new Date(existing.timestamp);
      const importedDate = new Date(report.timestamp);
      
      if (importedDate < existingDate) {
        conflicts.push({
          type: 'newer-exists',
          report,
          existingReport: existing,
        });
      } else if (importedDate.getTime() === existingDate.getTime()) {
        conflicts.push({
          type: 'duplicate',
          report,
          existingReport: existing,
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Import data with conflict resolution
 */
export async function importData(
  data: AppDataExport,
  existingReports: AnalysisReport[],
  options: ImportOptions,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    reportsImported: 0,
    reportsSkipped: 0,
    conflicts: [],
    errors: [],
  };
  
  // Validate first
  if (options.validateData !== false) {
    const validationErrors = validateImportData(data);
    if (validationErrors.length > 0) {
      result.errors.push(...validationErrors);
      result.success = false;
      return result;
    }
  }
  
  // Detect conflicts
  const conflicts = detectConflicts(data.data.reports, existingReports);
  result.conflicts = conflicts;
  
  // Build import list based on conflict resolution
  const reportsToImport: AnalysisReport[] = [];
  
  for (const report of data.data.reports) {
    const conflict = conflicts.find(c => c.report.id === report.id);
    
    if (!conflict) {
      // No conflict, import
      reportsToImport.push(report);
    } else {
      switch (options.onConflict) {
        case 'skip':
          result.reportsSkipped++;
          break;
        case 'replace':
          reportsToImport.push(report);
          break;
        case 'keep-both':
          // Generate new ID for duplicate
          reportsToImport.push({
            ...report,
            id: `${report.id}-imported-${Date.now()}`,
          });
          break;
        case 'ask':
          // Should be handled by UI
          result.reportsSkipped++;
          break;
      }
    }
  }
  
  // Dry run - don't actually import
  if (options.dryRun === true) {
    result.reportsImported = reportsToImport.length;
    return result;
  }
  
  // Import reports with progress
  for (let i = 0; i < reportsToImport.length; i++) {
    // In real implementation, this would save to storage
    // For now, just track progress
    result.reportsImported++;
    onProgress?.(i + 1, reportsToImport.length);
  }
  
  return result;
}

/**
 * Preview import data without importing
 */
export function previewImport(data: AppDataExport, existingReports: AnalysisReport[]): {
  totalReports: number;
  newReports: number;
  conflicts: number;
  newerVersions: number;
  duplicates: number;
} {
  const conflicts = detectConflicts(data.data.reports, existingReports);
  
  const newerVersions = conflicts.filter(c => c.type === 'newer-exists').length;
  const duplicates = conflicts.filter(c => c.type === 'duplicate').length;
  const newReports = data.data.reports.length - conflicts.length;
  
  return {
    totalReports: data.data.reports.length,
    newReports,
    conflicts: conflicts.length,
    newerVersions,
    duplicates,
  };
}
