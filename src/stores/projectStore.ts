import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { set, get as idbGet } from 'idb-keyval';
import type { Project, ProjectSummary, UploadedFile, AnalysisReport } from '@/types';
import { logError } from '@/utils/errorHandler';

interface ProjectState {
  // Projects
  projects: ProjectSummary[];
  currentProject: Project | null;
  
  // Actions
  createProject: (name: string, description?: string) => string;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>) => void;
  deleteProject: (id: string) => void;
  loadProject: (id: string) => Promise<Project | null>;
  setCurrentProject: (project: Project | null) => void;
  addFilesToProject: (projectId: string, files: UploadedFile[]) => void;
  removeFileFromProject: (projectId: string, fileId: string) => void;
  addReportToProject: (projectId: string, report: AnalysisReport) => void;
  getProjectSummaries: () => ProjectSummary[];
}

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

// Key for storing full project data
const PROJECT_DATA_KEY = 'ProjectData';

// Helper to get project data from IndexedDB
async function getProjectData(projectId: string): Promise<Project | null> {
  try {
    const allData = await idbGet<Record<string, Project>>(PROJECT_DATA_KEY) || {};
    return allData[projectId] || null;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to get project data'), {
      component: 'ProjectStore',
      action: 'getProjectData',
    });
    return null;
  }
}

// Helper to save project data to IndexedDB
async function saveProjectData(project: Project): Promise<void> {
  try {
    const allData = await idbGet<Record<string, Project>>(PROJECT_DATA_KEY) || {};
    allData[project.id] = project;
    await set(PROJECT_DATA_KEY, allData);
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to save project data'), {
      component: 'ProjectStore',
      action: 'saveProjectData',
    });
  }
}

// Helper to delete project data from IndexedDB
async function deleteProjectData(projectId: string): Promise<void> {
  try {
    const allData = await idbGet<Record<string, Project>>(PROJECT_DATA_KEY) || {};
    delete allData[projectId];
    await set(PROJECT_DATA_KEY, allData);
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to delete project data'), {
      component: 'ProjectStore',
      action: 'deleteProjectData',
    });
  }
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        projects: [],
        currentProject: null,

        // Actions
        createProject: (name, description) => {
          const id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const now = Date.now();
          
          const newProject: Project = {
            id,
            name: name.trim() || 'Untitled Project',
            description: description?.trim(),
            createdAt: now,
            updatedAt: now,
            files: [],
            reports: [],
          };
          
          // Save full project data
          saveProjectData(newProject);
          
          // Add to summaries
          const summary: ProjectSummary = {
            id,
            name: newProject.name,
            description: newProject.description,
            createdAt: now,
            updatedAt: now,
            fileCount: 0,
            reportCount: 0,
          };
          
          set((state) => ({
            projects: [summary, ...state.projects],
            currentProject: newProject,
          }));
          
          return id;
        },

        updateProject: (id, updates) => {
          const now = Date.now();
          
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === id
                ? { ...p, ...updates, updatedAt: now }
                : p
            ),
          }));
          
          // Update full project data if loaded
          const { currentProject } = get();
          if (currentProject?.id === id) {
            const updatedProject = { ...currentProject, ...updates, updatedAt: now };
            set({ currentProject: updatedProject });
            saveProjectData(updatedProject);
          }
        },

        deleteProject: async (id) => {
          await deleteProjectData(id);
          
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
          }));
        },

        loadProject: async (id) => {
          const project = await getProjectData(id);
          if (project) {
            set({ currentProject: project });
          }
          return project;
        },

        setCurrentProject: (project) => {
          set({ currentProject: project });
        },

        addFilesToProject: async (projectId, files) => {
          const now = Date.now();
          let project = get().currentProject;
          
          // If not currently loaded, load it
          if (!project || project.id !== projectId) {
            project = await getProjectData(projectId);
          }
          
          if (!project) return;
          
          // Merge files (avoid duplicates by path)
          const existingPaths = new Set(project.files.map((f) => f.path));
          const newFiles = files.filter((f) => !existingPaths.has(f.path));
          
          const updatedFiles = [...project.files, ...newFiles];
          
          const updatedProject: Project = {
            ...project,
            files: updatedFiles,
            updatedAt: now,
          };
          
          await saveProjectData(updatedProject);
          
          // Update summary
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? { ...p, fileCount: updatedFiles.length, updatedAt: now }
                : p
            ),
            currentProject: updatedProject,
          }));
        },

        removeFileFromProject: async (projectId, fileId) => {
          const now = Date.now();
          let project = get().currentProject;
          
          if (!project || project.id !== projectId) {
            project = await getProjectData(projectId);
          }
          
          if (!project) return;
          
          const updatedFiles = project.files.filter((f) => f.id !== fileId);
          
          const updatedProject: Project = {
            ...project,
            files: updatedFiles,
            updatedAt: now,
          };
          
          await saveProjectData(updatedProject);
          
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? { ...p, fileCount: updatedFiles.length, updatedAt: now }
                : p
            ),
            currentProject: updatedProject,
          }));
        },

        addReportToProject: async (projectId, report) => {
          const now = Date.now();
          let project = get().currentProject;
          
          if (!project || project.id !== projectId) {
            project = await getProjectData(projectId);
          }
          
          if (!project) return;
          
          const updatedReports = [report, ...project.reports];
          
          const updatedProject: Project = {
            ...project,
            reports: updatedReports,
            lastAnalysisAt: now,
            updatedAt: now,
          };
          
          await saveProjectData(updatedProject);
          
          // Update summary
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    reportCount: updatedReports.length,
                    lastScore: report.score.overall,
                    lastAnalysisAt: now,
                    updatedAt: now,
                  }
                : p
            ),
            currentProject: updatedProject,
          }));
        },

        getProjectSummaries: () => {
          return get().projects.sort((a, b) => b.updatedAt - a.updatedAt);
        },
      }),
      {
        name: 'ProjectStore',
        storage: idbStorage as never,
        partialize: (state) => ({ projects: state.projects }),
      }
    ),
    { name: 'ProjectStore' }
  )
);

// Selectors
export const selectProjects = (state: ProjectState) => state.projects;
export const selectCurrentProject = (state: ProjectState) => state.currentProject;
