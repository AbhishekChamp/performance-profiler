import { useState, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Folder, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  FileCode, 
  Clock,
  TrendingUp,
  ChevronRight,
  Search,
  BarChart3,
  Database
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { clearAllStorage, getStorageStats } from '@/utils/offlineStorage';
import type { ProjectSummary } from '@/types';
import { formatDate } from '@/utils/formatDate';
import toast from 'react-hot-toast';

interface ProjectsListProps {
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
}

export function ProjectsList({ onCreateProject, onOpenProject }: ProjectsListProps) {
  const { projects, deleteProject } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      deleteProject(id);
    }
    setMenuOpen(null);
  };

  const handleEditStart = (project: ProjectSummary) => {
    setEditingProject(project.id);
    setEditName(project.name);
    setMenuOpen(null);
  };

  const handleEditSave = () => {
    if (editingProject && editName.trim()) {
      useProjectStore.getState().updateProject(editingProject, { name: editName.trim() });
    }
    setEditingProject(null);
    setEditName('');
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return 'text-dev-text-muted';
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-dev-bg/95 backdrop-blur z-10 border-b border-dev-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-dev-text">Your Projects</h1>
              <p className="text-sm text-dev-text-muted mt-1">
                {projects.length === 0 
                  ? 'Create your first project to start analyzing'
                  : `${projects.length} project${projects.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            
            <button
              onClick={onCreateProject}
              className="dev-button flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
          
          {/* Search */}
          {projects.length > 0 && (
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dev-text-muted" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dev-surface border border-dev-border rounded-lg
                           text-sm text-dev-text placeholder-dev-text-subtle
                           focus:outline-none focus:ring-2 focus:ring-dev-accent/50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-dev-surface flex items-center justify-center mx-auto mb-4">
              <Folder className="w-10 h-10 text-dev-text-muted" />
            </div>
            <h3 className="text-lg font-medium text-dev-text mb-2">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-sm text-dev-text-muted max-w-sm mx-auto mb-6">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Create a new project to start analyzing your frontend performance'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateProject}
                className="dev-button flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isEditing={editingProject === project.id}
                editName={editName}
                onEditChange={setEditName}
                onEditSave={handleEditSave}
                onEditCancel={() => setEditingProject(null)}
                onOpen={() => onOpenProject(project.id)}
                onEditStart={() => handleEditStart(project)}
                onDelete={() => handleDelete(project.id)}
                isMenuOpen={menuOpen === project.id}
                onMenuToggle={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                getScoreColor={getScoreColor}
              />
            ))}
          </div>
        )}
        
        {/* Danger Zone - Clear All Storage */}
        <ClearStorageSection />
      </div>
    </div>
  );
}

// Clear Storage Section Component
function ClearStorageSection() {
  const [storageInfo, setStorageInfo] = useState<{ totalReports: number; totalSize: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStorageInfo = useCallback(async () => {
    const stats = await getStorageStats();
    setStorageInfo(stats);
  }, []);

  // Load storage info on mount
  useState(() => {
    loadStorageInfo();
  });

  const handleClearAll = async () => {
    const confirmed = confirm(
      'WARNING: This will permanently delete ALL your data including:\n\n' +
      '• All projects\n' +
      '• All files and reports\n' +
      '• All analysis history\n' +
      '• All settings and preferences\n\n' +
      'This action cannot be undone. Are you sure?'
    );
    
    if (!confirmed) return;

    const doubleConfirmed = confirm(
      'Last chance! All your data will be gone forever.\n\n' +
      'Click OK to permanently delete everything.'
    );
    
    if (!doubleConfirmed) return;

    setIsLoading(true);
    try {
      await clearAllStorage();
      
      // Reset all stores
      useProjectStore.setState({ projects: [], currentProject: null });
      
      toast.success('All data has been cleared successfully');
      
      // Reload page to ensure clean state
      window.location.reload();
    } catch (error) {
      toast.error('Failed to clear storage. Please try again.');
      console.error('Error clearing storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = storageInfo && (storageInfo.totalReports > 0 || storageInfo.totalSize > 0);

  if (!hasData) return null;

  return (
    <div className="mt-12 pt-8 border-t border-dev-border">
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-red-500" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-red-400 mb-1">Danger Zone</h3>
            <p className="text-sm text-dev-text-muted mb-4">
              Permanently delete all your data. This includes all projects, files, reports, and settings. 
              This action cannot be undone.
            </p>
            
            {storageInfo && (
              <div className="flex items-center gap-4 text-sm text-dev-text-muted mb-4">
                <span>{storageInfo.totalReports} reports stored</span>
                <span>•</span>
                <span>Storage used</span>
              </div>
            )}
            
            <button
              onClick={handleClearAll}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 
                         text-red-400 hover:text-red-300
                         border border-red-500/30 hover:border-red-500/50
                         rounded-lg transition-colors text-sm font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Clearing...' : 'Delete All Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: ProjectSummary;
  isEditing: boolean;
  editName: string;
  onEditChange: (name: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onOpen: () => void;
  onEditStart: () => void;
  onDelete: () => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  getScoreColor: (score?: number) => string;
}

function ProjectCard({
  project,
  isEditing,
  editName,
  onEditChange,
  onEditSave,
  onEditCancel,
  onOpen,
  onEditStart,
  onDelete,
  isMenuOpen,
  onMenuToggle,
  getScoreColor,
}: ProjectCardProps) {
  return (
    <div className="group relative bg-dev-surface border border-dev-border rounded-xl p-5
                    hover:border-dev-accent/50 hover:shadow-lg hover:shadow-dev-accent/5
                    transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-dev-accent/10 flex items-center justify-center shrink-0">
            <Folder className="w-5 h-5 text-dev-accent" />
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => onEditChange(e.target.value)}
                onBlur={onEditSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEditSave();
                  if (e.key === 'Escape') onEditCancel();
                }}
                autoFocus
                className="w-full px-2 py-1 text-sm font-semibold text-dev-text 
                           bg-dev-bg border border-dev-accent rounded
                           focus:outline-none focus:ring-2 focus:ring-dev-accent/50"
              />
            ) : (
              <h3 className="font-semibold text-dev-text truncate">{project.name}</h3>
            )}
            <p className="text-xs text-dev-text-muted">
              {formatDate(project.updatedAt)}
            </p>
          </div>
        </div>
        
        {/* Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="p-1.5 text-dev-text-muted hover:text-dev-text 
                       hover:bg-dev-surface-hover rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={onMenuToggle}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-dev-surface border border-dev-border 
                            rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditStart();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-dev-text
                           hover:bg-dev-surface-hover flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400
                           hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Description */}
      {project.description && (
        <p className="text-sm text-dev-text-muted mb-4 line-clamp-2">
          {project.description}
        </p>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-dev-bg rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-dev-text-muted mb-1">
            <FileCode className="w-3.5 h-3.5" />
            <span className="text-xs">Files</span>
          </div>
          <p className="text-lg font-semibold text-dev-text">{project.fileCount}</p>
        </div>
        
        <div className="bg-dev-bg rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-dev-text-muted mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-xs">Reports</span>
          </div>
          <p className="text-lg font-semibold text-dev-text">{project.reportCount}</p>
        </div>
        
        <div className="bg-dev-bg rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-dev-text-muted mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xs">Score</span>
          </div>
          <p className={`text-lg font-semibold ${getScoreColor(project.lastScore)}`}>
            {project.lastScore ?? '-'}
          </p>
        </div>
      </div>
      
      {/* Last Analysis */}
      {project.lastAnalysisAt && (
        <div className="flex items-center gap-1.5 text-xs text-dev-text-muted mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>Analyzed {formatDate(project.lastAnalysisAt)}</span>
        </div>
      )}
      
      {/* Action */}
      <button
        onClick={onOpen}
        className="w-full flex items-center justify-center gap-2 py-2.5
                   bg-dev-bg hover:bg-dev-accent/10 
                   text-dev-text hover:text-dev-accent
                   border border-dev-border hover:border-dev-accent/50
                   rounded-lg transition-colors text-sm font-medium"
      >
        Open Project
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
