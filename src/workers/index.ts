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
  if (!worker) {
    const workerUrl = new URL('./analysis.worker.ts', import.meta.url);
    
    worker = new Worker(workerUrl, {
      type: 'module',
    });
    
    worker.onerror = () => {
      // Worker error handled silently
    };
    
    // Handle messages from worker
    worker.addEventListener('message', (event) => {
      const { type, progress, report, error, id } = event.data;
      
      const request = pendingRequests.get(id);
      if (!request) {
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
  }
  return worker;
}

export function terminateWorker() {
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
  const w = initWorker();
  const id = generateId();
  
  return new Promise((resolve, reject) => {
    // Store the request
    pendingRequests.set(id, { resolve, reject, onProgress });
    
    // Send message to worker
    w.postMessage({
      type: 'analyze',
      files,
      options,
      id
    });
  });
}
