/**
 * Typed Worker Message Protocol
 * 
 * Defines all message types for worker communication with
 * discriminated unions for type safety.
 * 
 * @module workers/types
 */

import type { AnalysisReport, AnalysisOptions, InputFile } from '@/types';

// ============================================================================
// Worker Request Messages (Main → Worker)
// ============================================================================

/**
 * Start analysis request
 */
export interface AnalyzeRequest {
  type: 'analyze';
  taskId: string;
  files: InputFile[];
  options: AnalysisOptions;
  signal?: AbortSignal;
}

/**
 * Cancel ongoing analysis
 */
export interface CancelRequest {
  type: 'cancel';
  taskId: string;
}

/**
 * Health check request
 */
export interface HealthCheckRequest {
  type: 'health-check';
  taskId: string;
}

/**
 * All request message types
 */
export type WorkerRequest = AnalyzeRequest | CancelRequest | HealthCheckRequest;

// ============================================================================
// Worker Response Messages (Worker → Main)
// ============================================================================

/**
 * Analysis progress update
 */
export interface ProgressResponse {
  type: 'progress';
  taskId: string;
  stage: AnalysisStage;
  progress: number;
  currentAnalyzer?: string;
  message?: string;
}

/**
 * Analysis completed successfully
 */
export interface CompleteResponse {
  type: 'complete';
  taskId: string;
  report: AnalysisReport;
  duration: number;
}

/**
 * Analysis error
 */
export interface ErrorResponse {
  type: 'error';
  taskId: string;
  error: {
    message: string;
    code: ErrorCode;
    stack?: string;
  };
  recoverable: boolean;
}

/**
 * Analysis cancelled
 */
export interface CancelledResponse {
  type: 'cancelled';
  taskId: string;
  partialResults?: Partial<AnalysisReport>;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  type: 'health-check';
  taskId: string;
  healthy: boolean;
  uptime: number;
}

/**
 * All response message types
 */
export type WorkerResponse =
  | ProgressResponse
  | CompleteResponse
  | ErrorResponse
  | CancelledResponse
  | HealthCheckResponse;

// ============================================================================
// Analysis Stages
// ============================================================================

export type AnalysisStage =
  | 'preparing'
  | 'parsing'
  | 'bundle'
  | 'dom'
  | 'css'
  | 'assets'
  | 'javascript'
  | 'react'
  | 'web-vitals'
  | 'network'
  | 'images'
  | 'fonts'
  | 'accessibility'
  | 'seo'
  | 'typescript'
  | 'security'
  | 'third-party'
  | 'memory'
  | 'imports'
  | 'scoring'
  | 'complete';

// ============================================================================
// Error Codes
// ============================================================================

export type ErrorCode =
  | 'UNKNOWN_ERROR'
  | 'PARSE_ERROR'
  | 'ANALYSIS_ERROR'
  | 'TIMEOUT_ERROR'
  | 'CANCELLED'
  | 'MEMORY_ERROR'
  | 'VALIDATION_ERROR'
  | 'WORKER_ERROR';

// ============================================================================
// Type Guards
// ============================================================================

export function isAnalyzeRequest(message: unknown): message is AnalyzeRequest {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as Record<string, unknown>).type === 'analyze'
  );
}

export function isCancelRequest(message: unknown): message is CancelRequest {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as Record<string, unknown>).type === 'cancel'
  );
}

export function isProgressResponse(message: unknown): message is ProgressResponse {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as Record<string, unknown>).type === 'progress'
  );
}

export function isCompleteResponse(message: unknown): message is CompleteResponse {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as Record<string, unknown>).type === 'complete'
  );
}

export function isErrorResponse(message: unknown): message is ErrorResponse {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as Record<string, unknown>).type === 'error'
  );
}

export function isCancelledResponse(message: unknown): message is CancelledResponse {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as Record<string, unknown>).type === 'cancelled'
  );
}

// ============================================================================
// Analysis Progress
// ============================================================================

/**
 * Detailed progress information
 */
export interface AnalysisProgress {
  stage: AnalysisStage;
  progress: number;
  stageProgress: Record<AnalysisStage, number>;
  currentAnalyzer?: string;
  message?: string;
  estimatedTimeRemaining?: number;
  startTime: number;
}

/**
 * Create initial progress state
 */
export function createInitialProgress(): AnalysisProgress {
  return {
    stage: 'preparing',
    progress: 0,
    stageProgress: {
      preparing: 0,
      parsing: 0,
      bundle: 0,
      dom: 0,
      css: 0,
      assets: 0,
      javascript: 0,
      react: 0,
      'web-vitals': 0,
      network: 0,
      images: 0,
      fonts: 0,
      accessibility: 0,
      seo: 0,
      typescript: 0,
      security: 0,
      'third-party': 0,
      memory: 0,
      imports: 0,
      scoring: 0,
      complete: 0,
    },
    startTime: Date.now(),
  };
}

/**
 * Calculate overall progress from stage progress
 */
export function calculateOverallProgress(
  stageProgress: Record<AnalysisStage, number>,
  currentStage: AnalysisStage
): number {
  const stages = Object.keys(stageProgress) as AnalysisStage[];
  const stageIndex = stages.indexOf(currentStage);
  const completedStages = stageIndex;
  const totalStages = stages.length;
  
  const baseProgress = (completedStages / totalStages) * 100;
  const currentStageContribution =
    (stageProgress[currentStage] / 100) * (100 / totalStages);
  
  return Math.min(baseProgress + currentStageContribution, 100);
}

// ============================================================================
// Cancellation Token
// ============================================================================

/**
 * Cancellation token for analysis
 */
export class CancellationToken {
  private cancelled = false;
  private callbacks: Array<() => void> = [];
  
  cancel(): void {
    this.cancelled = true;
    this.callbacks.forEach(cb => cb());
    this.callbacks = [];
  }
  
  isCancelled(): boolean {
    return this.cancelled;
  }
  
  onCancel(callback: () => void): void {
    if (this.cancelled) {
      callback();
    } else {
      this.callbacks.push(callback);
    }
  }
  
  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new Error('Analysis cancelled');
    }
  }
}

// ============================================================================
// Message Validation
// ============================================================================

/**
 * Validate worker request message
 */
export function validateRequest(message: unknown): WorkerRequest | null {
  if (message === null || typeof message !== 'object') return null;
  
  const msg = message as Record<string, unknown>;
  
  if (msg.type === undefined || typeof msg.type !== 'string') return null;
  if (msg.taskId === undefined || typeof msg.taskId !== 'string') return null;
  
  switch (msg.type) {
    case 'analyze':
      if (!Array.isArray(msg.files)) return null;
      if (msg.options === undefined || typeof msg.options !== 'object') return null;
      return message as AnalyzeRequest;
      
    case 'cancel':
    case 'health-check':
      return message as WorkerRequest;
      
    default:
      return null;
  }
}

/**
 * Validate worker response message
 */
export function validateResponse(message: unknown): WorkerResponse | null {
  if (message === null || typeof message !== 'object') return null;
  
  const msg = message as Record<string, unknown>;
  
  if (msg.type === undefined || typeof msg.type !== 'string') return null;
  if (msg.taskId === undefined || typeof msg.taskId !== 'string') return null;
  
  switch (msg.type) {
    case 'progress':
      if (typeof msg.progress !== 'number') return null;
      return message as ProgressResponse;
      
    case 'complete':
    case 'error':
    case 'cancelled':
    case 'health-check':
      return message as WorkerResponse;
      
    default:
      return null;
  }
}
