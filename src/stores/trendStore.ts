import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { type StorageValue, persist } from 'zustand/middleware';
import { del, get, set } from 'idb-keyval';
import type { 
  AnalysisReport, 
  ProjectTrend, 
  RegressionPoint,
  TrendDataPoint,
  TrendFilters 
} from '@/types';
import { 
  calculateTrendSummary, 
  detectRegressions,
  filterTrendData,
  reportToTrendData,
} from '@/core/trends';
import { getAllReports } from '@/utils/offlineStorage';
import { logError } from '@/utils/errorHandler';

// Custom IndexedDB storage for zustand persistence
const idbStorage = {
  getItem: async (name: string): Promise<StorageValue<TrendState> | null> => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: StorageValue<TrendState>): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface TrendState {
  // Data
  trendData: TrendDataPoint[];
  projects: ProjectTrend[];
  selectedProject: string | 'all';
  selectedMetrics: string[];
  
  // Filters
  filters: TrendFilters;
  
  // Computed
  filteredData: TrendDataPoint[];
  regressions: RegressionPoint[];
  
  // Actions
  addReport: (report: AnalysisReport) => void;
  removeReport: (reportId: string) => void;
  loadFromHistory: (history: AnalysisReport[]) => void;
  setSelectedProject: (project: string | 'all') => void;
  setSelectedMetrics: (metrics: string[]) => void;
  setFilters: (filters: Partial<TrendFilters>) => void;
  clearTrendData: () => void;
  refreshFromStorage: () => Promise<void>;
}

// Recompute derived state
function recomputeState(
  state: TrendState,
  newTrendData?: TrendDataPoint[]
): Partial<TrendState> {
  const data = newTrendData ?? state.trendData;
  
  // Apply filters
  const filtered = filterTrendData(data, state.filters);
  
  // Group by project and create ProjectTrend objects
  const projectMap = new Map<string, TrendDataPoint[]>();
  filtered.forEach(point => {
    const existing = projectMap.get(point.projectName);
    if (existing) {
      existing.push(point);
    } else {
      projectMap.set(point.projectName, [point]);
    }
  });
  
  const projects: ProjectTrend[] = Array.from(projectMap.entries()).map(
    ([name, points]) => ({
      projectName: name,
      reports: points.sort((a, b) => a.timestamp - b.timestamp),
      summary: calculateTrendSummary(points),
    })
  );
  
  // Detect regressions
  const regressions = detectRegressions(filtered);
  
  return {
    trendData: data,
    projects,
    filteredData: filtered,
    regressions,
  };
}

export const useTrendStore = create<TrendState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        trendData: [],
        projects: [],
        selectedProject: 'all',
        selectedMetrics: ['overallScore', 'bundleScore', 'domScore'],
        filters: {
          dateRange: '30d',
          metrics: ['overallScore'],
        },
        filteredData: [],
        regressions: [],

        // Add a report to trend data
        addReport: (report) => {
          const newPoint = reportToTrendData(report);
          const currentData = get().trendData;
          
          // Check if report already exists
          const exists = currentData.some(d => d.reportId === newPoint.reportId);
          if (exists) return;
          
          const newData = [...currentData, newPoint];
          
          // Sort by timestamp
          newData.sort((a, b) => a.timestamp - b.timestamp);
          
          const updates = recomputeState(get(), newData);
          set(updates);
        },

        // Remove a report from trend data
        removeReport: (reportId) => {
          const currentData = get().trendData;
          const newData = currentData.filter(d => d.reportId !== reportId);
          
          const updates = recomputeState(get(), newData);
          set(updates);
        },

        // Load trend data from history
        loadFromHistory: (history) => {
          const newPoints = history.map(reportToTrendData);
          
          // Merge with existing and remove duplicates
          const currentData = get().trendData;
          const reportIds = new Set(currentData.map(d => d.reportId));
          
          const merged = [
            ...currentData,
            ...newPoints.filter(p => !reportIds.has(p.reportId)),
          ];
          
          merged.sort((a, b) => a.timestamp - b.timestamp);
          
          const updates = recomputeState(get(), merged);
          set(updates);
        },

        // Set selected project
        setSelectedProject: (project) => {
          // Update state and recompute in single batch
          const currentState = get();
          const newState: Partial<TrendState> = { selectedProject: project };
          // Apply filter change and recompute
          const filtered = filterTrendData(currentState.trendData, { ...currentState.filters });
          newState.filteredData = filtered;
          set(newState);
        },

        // Set selected metrics
        setSelectedMetrics: (metrics) => {
          set({ selectedMetrics: metrics });
        },

        // Set filters
        setFilters: (filters) => {
          const currentState = get();
          const currentFilters = currentState.filters;
          const newFilters: TrendFilters = { ...currentFilters, ...filters };
          
          // Recompute with new filters in single batch
          const filtered = filterTrendData(currentState.trendData, newFilters);
          
          set({ 
            filters: newFilters,
            filteredData: filtered
          });
        },

        // Clear all trend data
        clearTrendData: () => {
          set({
            trendData: [],
            projects: [],
            filteredData: [],
            regressions: [],
          });
        },

        // Refresh from offline storage
        refreshFromStorage: async () => {
          try {
            const reports = await getAllReports();
            const newPoints = reports.map(reportToTrendData);
            
            const currentData = get().trendData;
            const reportIds = new Set(currentData.map(d => d.reportId));
            
            const merged = [
              ...currentData,
              ...newPoints.filter(p => !reportIds.has(p.reportId)),
            ];
            
            merged.sort((a, b) => a.timestamp - b.timestamp);
            
            const updates = recomputeState(get(), merged);
            set(updates);
          } catch (error) {
            logError(error instanceof Error ? error : new Error('Failed to refresh trend data'), {
              component: 'TrendStore',
              action: 'refreshFromStorage',
            });
          }
        },
      }),
      {
        name: 'TrendStore',
        storage: idbStorage as never,
        partialize: (state: TrendState) => ({
          trendData: state.trendData.slice(-500), // Keep last 500 reports
          selectedProject: state.selectedProject,
          selectedMetrics: state.selectedMetrics,
          filters: state.filters,
        }),
      } as never
    ),
    { name: 'TrendStore' }
  )
);

// Selectors - use memoized results to prevent unnecessary re-renders
export const selectTrendData = (state: TrendState): TrendDataPoint[] => 
  state.selectedProject === 'all' 
    ? state.filteredData 
    : state.filteredData.filter(d => d.projectName === state.selectedProject);

export const selectCurrentProject = (state: TrendState): ProjectTrend | null =>
  state.selectedProject === 'all'
    ? null
    : state.projects.find(p => p.projectName === state.selectedProject) ?? null;

// Memoized selector to prevent array reference changes
let cachedProjects: string[] = [];
let cachedResult: string[] = [];
export const selectAvailableProjects = (state: TrendState): string[] => {
  const projectNames = state.projects.map(p => p.projectName);
  // Only create new array if projects changed
  if (
    cachedProjects.length !== projectNames.length ||
    !cachedProjects.every((p, i) => p === projectNames[i])
  ) {
    cachedProjects = projectNames;
    cachedResult = ['all', ...projectNames];
  }
  return cachedResult;
};
