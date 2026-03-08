import { useCallback, useState } from 'react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { runAnalysis } from '@/workers';
import type { AnalysisOptions, UploadedFile, UploadedProject, AnalysisProgress } from '@/types';

interface UseAnalysisReturn {
  isAnalyzing: boolean;
  progress: AnalysisProgress | null;
  error: string | null;
  run: (files: UploadedFile[], options?: AnalysisOptions) => Promise<void>;
  cancel: () => void;
  clearError: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const store = useAnalysisStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const run = useCallback(async (
    files: UploadedFile[],
    options?: AnalysisOptions
  ) => {
    const analysisOptions = options || store.options;
    
    setIsAnalyzing(true);
    store.setStatus('uploading');
    store.setError(null);

    try {
      const report = await runAnalysis(
        files.map(f => ({ name: f.name, content: f.content, size: f.size })),
        analysisOptions,
        (progress: AnalysisProgress) => {
          store.setProgress(progress);
        }
      );

      store.setReport(report);
      store.addToHistory(report);
      
      // Create project record
      const project: UploadedProject = {
        id: report.id,
        name: files[0]?.name || 'Untitled Project',
        files,
        type: files.length === 1 && files[0].name.endsWith('.html') 
          ? 'html' 
          : files.some(f => /\.(jsx|tsx)$/.test(f.name))
            ? 'react-build'
            : 'mixed',
        timestamp: Date.now(),
      };
      store.setProject(project);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      store.setError(errorMessage);
      store.setStatus('error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [store]);

  const cancel = useCallback(() => {
    store.setStatus('idle');
    store.setProgress(undefined as unknown as AnalysisProgress);
    setIsAnalyzing(false);
  }, [store]);

  const clearError = useCallback(() => {
    store.setError(null);
  }, [store]);

  return {
    isAnalyzing,
    progress: store.progress,
    error: store.error,
    run,
    cancel,
    clearError,
  };
}
