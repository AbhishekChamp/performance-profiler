import * as Comlink from 'comlink';
import { runAnalysisPipeline } from '@/core/pipeline';
import type { AnalysisReport, AnalysisOptions, AnalysisProgress } from '@/types';

interface WorkerInput {
  files: { name: string; content: string; size: number }[];
  options: AnalysisOptions;
}

class AnalysisWorker {
  private onProgress?: (progress: AnalysisProgress) => void;

  setProgressCallback(callback: (progress: AnalysisProgress) => void) {
    this.onProgress = callback;
  }

  async analyze(input: WorkerInput): Promise<AnalysisReport> {
    const { files, options } = input;

    this.reportProgress('uploading', 10, 'Reading files...');
    await this.delay(100);

    this.reportProgress('parsing', 30, 'Parsing source files...');
    await this.delay(200);

    this.reportProgress('analyzing', 60, 'Running analysis...');
    
    const report = await runAnalysisPipeline(files, options);
    
    await this.delay(100);
    this.reportProgress('scoring', 90, 'Calculating performance scores...');
    await this.delay(100);

    this.reportProgress('complete', 100, 'Analysis complete');
    
    return report;
  }

  private reportProgress(stage: AnalysisProgress['stage'], progress: number, message: string) {
    if (this.onProgress) {
      this.onProgress({ stage, progress, message });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

Comlink.expose(AnalysisWorker);
