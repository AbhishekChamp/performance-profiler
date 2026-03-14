/**
 * Web Workers Module
 * 
 * Exports worker-related utilities and types for parallel analysis.
 * 
 * @module workers
 */

export { initializeWorkerPool, getWorkerPool, terminateWorkerPool } from './workerPool';
export type { 
  WorkerPool, 
  WorkerPoolConfig, 
  TaskPriority,
  WorkerTask,
} from './workerPool';

export type {
  WorkerRequest,
  WorkerResponse,
  AnalyzeRequest,
  CancelRequest,
  ProgressResponse,
  CompleteResponse,
  ErrorResponse,
  CancelledResponse,
  AnalysisStage,
  AnalysisProgress,
} from './types';

export {
  isAnalyzeRequest,
  isCancelRequest,
  isProgressResponse,
  isCompleteResponse,
  isErrorResponse,
  isCancelledResponse,
  createInitialProgress,
  calculateOverallProgress,
  CancellationToken,
  validateRequest,
  validateResponse,
} from './types';

// Re-export analysis worker functionality
export { runAnalysisPipeline } from './analysis.worker';

// Alias for backward compatibility
export { runAnalysisPipeline as runAnalysis } from './analysis.worker';
