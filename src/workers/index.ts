import type { AnalysisReport, AnalysisOptions, AnalysisProgress } from '@/types';

// Worker instance
let worker: Worker | null = null;

// Pending requests
const pendingRequests = new Map<string, {
  resolve: (value: AnalysisReport) => void;
  reject: (reason: Error) => void;
  onProgress?: (progress: AnalysisProgress) => void;
}>();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function initWorker(): Worker {
  console.log('[Worker] Initializing worker...');
  
  if (!worker) {
    try {
      const workerUrl = new URL('./analysis.worker.ts', import.meta.url);
      console.log('[Worker] Worker URL:', workerUrl.href);
      
      worker = new Worker(workerUrl, {
        type: 'module',
      });
      
      worker.onerror = (error) => {
        console.error('[Worker] Worker error:', error);
      };
      
      // Handle messages from worker
      worker.addEventListener('message', (event) => {
        console.log('[Worker] Received message from worker:', event.data);
        
        const { type, progress, report, error, id } = event.data;
        
        const request = pendingRequests.get(id);
        if (!request) {
          console.warn('[Worker] No pending request found for ID');
          return;
        }
        
        if (type === 'progress' && request.onProgress) {
          request.onProgress(progress);
        } else if (type === 'complete') {
          pendingRequests.delete(id);
          request.resolve(report);
        } else if (type === 'error') {
          pendingRequests.delete(id);
          request.reject(new Error(error));
        }
      });
      
      console.log('[Worker] Worker initialized successfully');
    } catch (error) {
      console.error('[Worker] Failed to initialize worker:', error);
      throw error;
    }
  }
  return worker;
}

export function terminateWorker() {
  console.log('[Worker] Terminating worker...');
  if (worker) {
    worker.terminate();
    worker = null;
    // Reject all pending requests
    for (const request of pendingRequests.values()) {
      request.reject(new Error('Worker terminated'));
    }
    pendingRequests.clear();
  }
}

export async function runAnalysis(
  files: { name: string; content: string; size: number }[],
  options: AnalysisOptions,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<AnalysisReport> {
  console.log('[Worker] runAnalysis called with', files.length, 'files');
  
  const w = initWorker();
  const id = generateId();
  
  return new Promise((resolve, reject) => {
    // Store the request
    pendingRequests.set(id, { resolve, reject, onProgress });
    
    // Send message to worker
    console.log('[Worker] Sending analyze message to worker');
    w.postMessage({
      type: 'analyze',
      files,
      options,
      id
    });
  });
}
