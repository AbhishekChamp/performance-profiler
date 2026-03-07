import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  AnalysisReport,
  AnalysisOptions,
  AnalysisStatus,
  AnalysisProgress,
  UploadedProject,
} from '@/types';

interface AnalysisState {
  // Current analysis
  currentReport: AnalysisReport | null;
  status: AnalysisStatus;
  progress: AnalysisProgress | null;
  error: string | null;
  
  // History
  history: AnalysisReport[];
  
  // Current project
  currentProject: UploadedProject | null;
  
  // Options
  options: AnalysisOptions;
  
  // Actions
  setStatus: (status: AnalysisStatus) => void;
  setProgress: (progress: AnalysisProgress | null) => void;
  setError: (error: string | null) => void;
  setReport: (report: AnalysisReport) => void;
  setProject: (project: UploadedProject | null) => void;
  addToHistory: (report: AnalysisReport) => void;
  clearHistory: () => void;
  updateOptions: (options: Partial<AnalysisOptions>) => void;
  reset: () => void;
}

const defaultOptions: AnalysisOptions = {
  includeBundle: true,
  includeDOM: true,
  includeCSS: true,
  includeAssets: true,
  includeJS: true,
  includeReact: true,
};

export const useAnalysisStore = create<AnalysisState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentReport: null,
      status: 'idle',
      progress: null,
      error: null,
      history: [],
      currentProject: null,
      options: defaultOptions,

      // Actions
      setStatus: (status) => set({ status }),
      
      setProgress: (progress) => set({ progress }),
      
      setError: (error) => set({ error }),
      
      setReport: (report) => set({ 
        currentReport: report,
        status: 'complete',
        progress: null,
      }),
      
      setProject: (project) => set({ currentProject: project }),
      
      addToHistory: (report) => {
        const { history } = get();
        set({ 
          history: [report, ...history].slice(0, 10) // Keep last 10
        });
      },
      
      clearHistory: () => set({ history: [] }),
      
      updateOptions: (options) => set((state) => ({
        options: { ...state.options, ...options }
      })),
      
      reset: () => set({
        currentReport: null,
        status: 'idle',
        progress: null,
        error: null,
      }),
    }),
    { name: 'AnalysisStore' }
  )
);

// Selectors
export const selectCurrentReport = (state: AnalysisState) => state.currentReport;
export const selectAnalysisStatus = (state: AnalysisState) => state.status;
export const selectAnalysisProgress = (state: AnalysisState) => state.progress;
export const selectAnalysisError = (state: AnalysisState) => state.error;
export const selectHistory = (state: AnalysisState) => state.history;
export const selectCurrentProject = (state: AnalysisState) => state.currentProject;
export const selectOptions = (state: AnalysisState) => state.options;
