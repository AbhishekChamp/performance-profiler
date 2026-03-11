import { useCallback, useState } from 'react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useTemplateStore } from '@/stores/templateStore';
import { useTrendStore } from '@/stores/trendStore';
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
  const templateStore = useTemplateStore();
  const trendStore = useTrendStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const run = useCallback(async (
    files: UploadedFile[],
    options?: AnalysisOptions
  ) => {
    // Merge template options with provided options or store options
    const templateOptions = templateStore.currentTemplate?.options || {};
    const baseOptions = options || store.options;
    const analysisOptions = { ...baseOptions, ...templateOptions };
    
    setIsAnalyzing(true);
    store.setStatus('uploading');
    store.setError(null);

    try {
      // Validate files before sending
      if (!files || files.length === 0) {
        throw new Error('No files provided for analysis');
      }

      // Map files and validate content
      const mappedFiles = files.map(f => ({
        name: f.name, 
        content: f.content || '', 
        size: f.size 
      }));
      
      const report = await runAnalysis(
        mappedFiles,
        analysisOptions,
        (progress: AnalysisProgress) => {
          store.setProgress(progress);
        }
      );

      store.setReport(report);
      store.addToHistory(report);
      
      // Add to trend data for historical analysis
      trendStore.addReport(report);
      
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
      throw err; // Re-throw so component can handle it
    } finally {
      setIsAnalyzing(false);
    }
  }, [store, templateStore.currentTemplate?.options, trendStore]);

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
