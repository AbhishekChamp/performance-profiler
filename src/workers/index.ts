import * as Comlink from 'comlink';
import type { AnalysisReport, AnalysisOptions, AnalysisProgress } from '@/types';

// Worker instance
let worker: Worker | null = null;
let workerApi: Comlink.Remote<{
  setProgressCallback(callback: (progress: AnalysisProgress) => void): Promise<void>;
  analyze(input: { files: { name: string; content: string; size: number }[]; options: AnalysisOptions }): Promise<AnalysisReport>;
}> | null = null;

export function initWorker(): Comlink.Remote<{
  setProgressCallback(callback: (progress: AnalysisProgress) => void): Promise<void>;
  analyze(input: { files: { name: string; content: string; size: number }[]; options: AnalysisOptions }): Promise<AnalysisReport>;
}> {
  if (!worker) {
    worker = new Worker(new URL('./analysis.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerApi = Comlink.wrap(worker);
  }
  return workerApi!;
}

export function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
    workerApi = null;
  }
}

export async function runAnalysis(
  files: { name: string; content: string; size: number }[],
  options: AnalysisOptions,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<AnalysisReport> {
  const api = initWorker();
  
  if (onProgress) {
    await api.setProgressCallback(Comlink.proxy(onProgress));
  }
  
  return api.analyze({ files, options });
}
