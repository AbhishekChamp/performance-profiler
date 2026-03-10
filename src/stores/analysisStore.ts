import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { set, get as idbGet } from 'idb-keyval';
import { storeReport, deleteStoredReport } from '@/utils/offlineStorage';
import type {
  AnalysisReport,
  AnalysisOptions,
  AnalysisStatus,
  AnalysisProgress,
  UploadedProject,
  HistoryFilters,
} from '@/types';

interface PinnedReport {
  id: string;
  timestamp: number;
}

interface AnalysisState {
  // Current analysis
  currentReport: AnalysisReport | null;
  status: AnalysisStatus;
  progress: AnalysisProgress | null;
  error: string | null;

  // History
  history: AnalysisReport[];
  pinnedReports: PinnedReport[];
  historyFilters: HistoryFilters;

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

  // Enhanced History Actions
  pinReport: (reportId: string) => void;
  unpinReport: (reportId: string) => void;
  isPinned: (reportId: string) => boolean;
  setHistoryFilters: (filters: Partial<HistoryFilters>) => void;
  clearHistoryFilters: () => void;
  getFilteredHistory: () => AnalysisReport[];
  deleteReportFromHistory: (reportId: string) => void;
  loadReportFromHistory: (reportId: string) => AnalysisReport | undefined;
}

const defaultOptions: AnalysisOptions = {
  includeBundle: true,
  includeDOM: true,
  includeCSS: true,
  includeAssets: true,
  includeJS: true,
  includeReact: true,
  includeWebVitals: true,
  includeNetwork: true,
  includeImages: true,
  includeFonts: true,
  includeAccessibility: true,
  includeSEO: true,
  includeTypeScript: true,
  includeSecurity: true,
  includeThirdParty: true,
  includeMemory: true,
  includeBundleDiff: true,
  includeImports: true,
};

const defaultFilters: HistoryFilters = {
  search: '',
  dateRange: 'all',
  minScore: 0,
};

// Custom storage using idb-keyval for IndexedDB
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await idbGet(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await set(name, undefined);
  },
};

export const useAnalysisStore = create<AnalysisState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentReport: null,
        status: 'idle',
        progress: null,
        error: null,
        history: [],
        pinnedReports: [],
        historyFilters: defaultFilters,
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
          const { history, pinnedReports } = get();
          
          // Check if report already exists
          const exists = history.some((r) => r.id === report.id);
          if (exists) return;

          const newHistory = [report, ...history];
          
          // Keep all pinned reports + last 50 unpinned
          const pinnedIds = new Set(pinnedReports.map((p) => p.id));
          const pinned = newHistory.filter((r) => pinnedIds.has(r.id));
          const unpinned = newHistory.filter((r) => !pinnedIds.has(r.id)).slice(0, 50);
          
          set({
            history: [...pinned, ...unpinned],
          });
          
          // Also store for offline access
          storeReport(report).catch((error) => {
            console.error('[AnalysisStore] Failed to store report for offline access:', error);
          });
        },

        clearHistory: () => {
          const { pinnedReports } = get();
          // Only keep pinned reports
          set({ 
            history: get().history.filter((r) => pinnedReports.some((p) => p.id === r.id)),
          });
        },

        updateOptions: (options) => set((state) => ({
          options: { ...state.options, ...options }
        })),

        reset: () => set({
          currentReport: null,
          status: 'idle',
          progress: null,
          error: null,
        }),

        // Enhanced History Actions
        pinReport: (reportId) => {
          const { pinnedReports } = get();
          if (pinnedReports.some((p) => p.id === reportId)) return;
          
          set({
            pinnedReports: [...pinnedReports, { id: reportId, timestamp: Date.now() }],
          });
        },

        unpinReport: (reportId) => {
          const { pinnedReports } = get();
          set({
            pinnedReports: pinnedReports.filter((p) => p.id !== reportId),
          });
        },

        isPinned: (reportId) => {
          return get().pinnedReports.some((p) => p.id === reportId);
        },

        setHistoryFilters: (filters) => {
          set((state) => ({
            historyFilters: { ...state.historyFilters, ...filters },
          }));
        },

        clearHistoryFilters: () => {
          set({ historyFilters: defaultFilters });
        },

        getFilteredHistory: () => {
          const { history, pinnedReports, historyFilters } = get();
          const pinnedIds = new Set(pinnedReports.map((p) => p.id));

          let filtered = history;

          // Search filter
          if (historyFilters.search) {
            const search = historyFilters.search.toLowerCase();
            filtered = filtered.filter((r) => {
              const files = r.files.map((f) => f.name).join(' ').toLowerCase();
              const score = r.score.overall.toString();
              return files.includes(search) || score.includes(search);
            });
          }

          // Date range filter
          if (historyFilters.dateRange !== 'all') {
            const now = Date.now();
            const ranges: Record<string, number> = {
              today: 24 * 60 * 60 * 1000,
              week: 7 * 24 * 60 * 60 * 1000,
              month: 30 * 24 * 60 * 60 * 1000,
            };
            const cutoff = now - (ranges[historyFilters.dateRange] || 0);
            filtered = filtered.filter((r) => r.timestamp >= cutoff);
          }

          // Min score filter
          if (historyFilters.minScore > 0) {
            filtered = filtered.filter((r) => r.score.overall >= historyFilters.minScore);
          }

          // Sort: pinned first, then by date
          return filtered.sort((a, b) => {
            const aPinned = pinnedIds.has(a.id) ? 1 : 0;
            const bPinned = pinnedIds.has(b.id) ? 1 : 0;
            if (aPinned !== bPinned) return bPinned - aPinned;
            return b.timestamp - a.timestamp;
          });
        },

        deleteReportFromHistory: (reportId) => {
          const { history, pinnedReports } = get();
          
          // If pinned, unpin first
          if (pinnedReports.some((p) => p.id === reportId)) {
            get().unpinReport(reportId);
          }
          
          set({
            history: history.filter((r) => r.id !== reportId),
          });
          
          // Also delete from offline storage
          deleteStoredReport(reportId).catch((error) => {
            console.error('[AnalysisStore] Failed to delete stored report:', error);
          });
        },

        loadReportFromHistory: (reportId) => {
          return get().history.find((r) => r.id === reportId);
        },
      }),
      {
        name: 'AnalysisStore',
        storage: idbStorage as never,
        partialize: (state) => ({
          history: state.history,
          pinnedReports: state.pinnedReports,
          options: state.options,
        }),
      }
    ),
    { name: 'AnalysisStore' }
  )
);

// Selectors
export const selectCurrentReport = (state: AnalysisState) => state.currentReport;
export const selectAnalysisStatus = (state: AnalysisState) => state.status;
export const selectAnalysisProgress = (state: AnalysisState) => state.progress;
export const selectAnalysisError = (state: AnalysisState) => state.error;
export const selectHistory = (state: AnalysisState) => state.history;
export const selectPinnedReports = (state: AnalysisState) => state.pinnedReports;
export const selectHistoryFilters = (state: AnalysisState) => state.historyFilters;
export const selectCurrentProject = (state: AnalysisState) => state.currentProject;
export const selectOptions = (state: AnalysisState) => state.options;
