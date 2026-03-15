/**
 * Analysis Worker
 * 
 * Web Worker for running analysis pipeline with proper typed messaging,
 * cancellation support, and progress reporting.
 * 
 * @module workers/analysis.worker
 */

import { runAnalysisPipeline } from '@/core/pipeline';
import type { AnalysisOptions, AnalysisReport, InputFile } from '@/types';
import type { 
  AnalysisProgress, 
  AnalysisStage, 
  WorkerRequest,
  WorkerResponse 
} from './types';
import { 
  CancellationToken, 
  calculateOverallProgress, 
  createInitialProgress,
  validateRequest 
} from './types';

// Track active analysis for cancellation
const activeTokens = new Map<string, CancellationToken>();
const progressState = new Map<string, AnalysisProgress>();

/**
 * Send progress update to main thread
 */
function sendProgress(
  taskId: string, 
  stage: AnalysisStage, 
  stageProgress: number,
  message?: string
): void {
  const currentProgress = progressState.get(taskId) ?? createInitialProgress();
  
  currentProgress.stage = stage;
  currentProgress.stageProgress[stage] = stageProgress;
  currentProgress.progress = calculateOverallProgress(currentProgress.stageProgress, stage);
  currentProgress.message = message;
  currentProgress.currentAnalyzer = stage;
  
  progressState.set(taskId, currentProgress);
  
  const response: WorkerResponse = {
    type: 'progress',
    taskId,
    stage,
    progress: Math.round(currentProgress.progress),
    currentAnalyzer: stage,
    message,
  };
  
  self.postMessage(response);
}

/**
 * Send error response
 */
function sendError(
  taskId: string, 
  error: Error, 
  recoverable = false
): void {
  const response: WorkerResponse = {
    type: 'error',
    taskId,
    error: {
      message: error.message,
      code: error.name === 'AbortError' ? 'CANCELLED' : 'ANALYSIS_ERROR',
      stack: error.stack,
    },
    recoverable,
  };
  
  self.postMessage(response);
  cleanup(taskId);
}

/**
 * Send completion response
 */
function sendComplete(taskId: string, report: AnalysisReport): void {
  const startTime = progressState.get(taskId)?.startTime ?? Date.now();
  const duration = Date.now() - startTime;
  
  const response: WorkerResponse = {
    type: 'complete',
    taskId,
    report,
    duration,
  };
  
  self.postMessage(response);
  cleanup(taskId);
}

/**
 * Send cancellation response
 */
function sendCancelled(taskId: string, partialResults?: Partial<AnalysisReport>): void {
  const response: WorkerResponse = {
    type: 'cancelled',
    taskId,
    partialResults,
  };
  
  self.postMessage(response);
  cleanup(taskId);
}

/**
 * Cleanup resources for a task
 */
function cleanup(taskId: string): void {
  activeTokens.delete(taskId);
  progressState.delete(taskId);
}

/**
 * Run analysis with progress tracking and cancellation support
 */
async function runAnalysis(
  taskId: string,
  files: InputFile[],
  options: AnalysisOptions,
  token: CancellationToken
): Promise<void> {
  try {
    // Initialize progress
    progressState.set(taskId, createInitialProgress());
    
    // Preparing stage
    sendProgress(taskId, 'preparing', 0, 'Initializing analysis...');
    await yieldToMain();
    token.throwIfCancelled();
    sendProgress(taskId, 'preparing', 100);
    
    // Parsing stage
    sendProgress(taskId, 'parsing', 0, 'Parsing files...');
    await yieldToMain();
    token.throwIfCancelled();
    sendProgress(taskId, 'parsing', 100);
    
    // Run the actual analysis
    sendProgress(taskId, 'bundle', 0, 'Analyzing bundle...');
    
    const report = await runAnalysisPipeline(
      files, 
      options,
      {
        onProgress: (stage: AnalysisStage, progress: number) => {
          token.throwIfCancelled();
          sendProgress(
            taskId, 
            stage, 
            progress,
            `Analyzing ${stage}...`
          );
        },
      }
    );
    
    token.throwIfCancelled();
    
    // Scoring stage
    sendProgress(taskId, 'scoring', 0, 'Calculating scores...');
    await yieldToMain();
    sendProgress(taskId, 'scoring', 100);
    
    // Complete
    sendProgress(taskId, 'complete', 100, 'Analysis complete');
    sendComplete(taskId, report);
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Analysis cancelled' || error.name === 'AbortError') {
        sendCancelled(taskId);
        return;
      }
      sendError(taskId, error);
    } else {
      sendError(taskId, new Error('Unknown error during analysis'));
    }
  }
}

/**
 * Yield control to main thread to prevent blocking
 */
function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Handle analyze request
 */
async function handleAnalyze(request: WorkerRequest & { type: 'analyze' }): Promise<void> {
  const { taskId, files, options } = request;
  
  // Check if already running
  if (activeTokens.has(taskId)) {
    sendError(taskId, new Error('Analysis already in progress for this task'), true);
    return;
  }
  
  // Create cancellation token
  const token = new CancellationToken();
  activeTokens.set(taskId, token);
  
  // Start analysis
  await runAnalysis(taskId, files, options, token);
}

/**
 * Handle cancel request
 */
function handleCancel(request: WorkerRequest & { type: 'cancel' }): void {
  const { taskId } = request;
  const token = activeTokens.get(taskId);
  
  if (token) {
    token.cancel();
    sendCancelled(taskId);
  }
}

/**
 * Handle health check request
 */
function handleHealthCheck(request: WorkerRequest & { type: 'health-check' }): void {
  const response: WorkerResponse = {
    type: 'health-check',
    taskId: request.taskId,
    healthy: true,
    uptime: performance.now(),
  };
  
  self.postMessage(response);
}

// Main message handler
self.addEventListener('message', (event: MessageEvent<unknown>) => {
  // Filter out messages from browser extensions
  if (isExtensionMessage(event.data)) {
    return;
  }
  
  const request = validateRequest(event.data);
  
  if (!request) {
    // Silently ignore non-worker messages (external scripts, extensions, etc.)
    return;
  }
  
  switch (request.type) {
    case 'analyze':
      handleAnalyze(request);
      break;
    case 'cancel':
      handleCancel(request);
      break;
    case 'health-check':
      handleHealthCheck(request);
      break;
    default:
      console.error('Unknown message type:', (request as Record<string, unknown>).type);
  }
});

/**
 * Check if message is from a browser extension
 */
function isExtensionMessage(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  
  const d = data as Record<string, unknown>;
  
  // React DevTools messages
  if (d.source === 'react-devtools-content-script' || d.source === 'react-devtools-bridge') {
    return true;
  }
  
  // Wappalyzer messages
  if ('wappalyzer' in d) {
    return true;
  }
  
  return false;
}

// Handle errors
self.addEventListener('error', (event: ErrorEvent) => {
  console.error('Worker error:', event.error);
});

// Handle unhandled rejections
self.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('Worker unhandled rejection:', event.reason);
});

// Export for testing and external usage
export { runAnalysis, sendProgress, sendComplete, sendError, sendCancelled };

// Re-export pipeline functions for external use
export { runAnalysisPipeline } from '@/core/pipeline';
