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
    
    console.log('[useAnalysis] Starting analysis with files:', files.length);
    console.log('[useAnalysis] File names:', files.map(f => f.name));
    
    setIsAnalyzing(true);
    store.setStatus('uploading');
    store.setError(null);

    try {
      // Validate files before sending
      if (!files || files.length === 0) {
        throw new Error('No files provided for analysis');
      }

      // Map files and validate content
      const mappedFiles = files.map(f => {
        if (!f.content && f.size > 0) {
          console.warn(`[useAnalysis] File ${f.name} has size but no content`);
        }
        return { 
          name: f.name, 
          content: f.content || '', 
          size: f.size 
        };
      });

      console.log('[useAnalysis] Calling runAnalysis with', mappedFiles.length, 'files');
      
      const report = await runAnalysis(
        mappedFiles,
        analysisOptions,
        (progress: AnalysisProgress) => {
          console.log('[useAnalysis] Progress:', progress);
          store.setProgress(progress);
        }
      );

      console.log('[useAnalysis] Report received:', report.id);
      console.log('[useAnalysis] Report summary:', report.summary);

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
      console.error('[useAnalysis] Error during analysis:', err);
      // Log full error details
      if (err instanceof Error) {
        console.error('[useAnalysis] Error name:', err.name);
        console.error('[useAnalysis] Error message:', err.message);
        console.error('[useAnalysis] Error stack:', err.stack);
      }
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      store.setError(errorMessage);
      store.setStatus('error');
      throw err; // Re-throw so component can handle it
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
