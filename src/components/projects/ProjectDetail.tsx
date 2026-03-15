import { useCallback, useEffect, useState } from 'react';
import { 
  AlertCircle, 
  ArrowLeft, 
  BarChart3, 
  CheckCircle2, 
  Clock,
  FileCode,
  Folder,
  MoreVertical,
  Play,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useAnalysisStore } from '@/stores/analysisStore';
import { ProjectFileUpload } from './ProjectFileUpload';
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary';
import type { UploadedFile } from '@/types';
import { formatDate, formatFileSize } from '@/utils/formatDate';
import toast from 'react-hot-toast';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onViewReport: (reportId: string) => void;
}

export function ProjectDetail({ projectId, onBack, onViewReport }: ProjectDetailProps): React.ReactNode {
  const { 
    currentProject, 
    loadProject, 
    setCurrentProject,
    removeFileFromProject,
    addFilesToProject
  } = useProjectStore();
  const { run, isAnalyzing, error } = useAnalysis();
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Load project on mount
  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      await loadProject(projectId);
      setIsLoading(false);
    };
    load();
    
    return () => {
      setCurrentProject(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleFilesUploaded = useCallback(async (files: UploadedFile[]): Promise<void> => {
    await addFilesToProject(projectId, files);
    setShowUpload(false);
  }, [projectId, addFilesToProject]);

  const handleDeleteFile = async (fileId: string): Promise<void> => {
    await removeFileFromProject(projectId, fileId);
    setMenuOpen(null);
  };

  const handleRunAnalysis = async (): Promise<void> => {
    if (!currentProject || currentProject.files.length === 0) return;
    
    try {
      // Run analysis - this will set currentReport in analysisStore
      await run(currentProject.files);
      
      // Get the report from the store after analysis completes
      const report = useAnalysisStore.getState().currentReport;
      
      // After successful analysis, add report to project
      if (report) {
        await useProjectStore.getState().addReportToProject(projectId, report);
        toast.success('Analysis complete! Report saved to project.', { duration: 3000 });
      }
    } catch {
      // Error is handled by useAnalysis hook
    }
  };

  const toggleFileSelection = (fileId: string): void => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const selectAll = (): void => {
    if (currentProject) {
      setSelectedFiles(new Set(currentProject.files.map(f => f.id)));
    }
  };

  const deselectAll = (): void => {
    setSelectedFiles(new Set());
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-dev-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-dev-danger mb-4" />
        <h3 className="text-lg font-medium text-dev-text">Project not found</h3>
        <button onClick={onBack} className="dev-button mt-4">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-dev-border bg-dev-surface">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-dev-bg rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dev-text" />
          </button>
          
          <div>
            <h1 className="text-xl font-bold text-dev-text flex items-center gap-2">
              <Folder className="w-5 h-5 text-dev-accent" />
              {currentProject.name}
            </h1>
            {currentProject.description !== undefined && currentProject.description !== '' && (
              <p className="text-sm text-dev-text-muted mt-0.5">
                {currentProject.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right text-sm text-dev-text-muted">
            <p>Created {formatDate(currentProject.createdAt)}</p>
            <p>{currentProject.files.length} files • {currentProject.reports.length} reports</p>
          </div>
          
          <button
            onClick={handleRunAnalysis}
            disabled={currentProject.files.length === 0 || isAnalyzing}
            className="dev-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error !== null && error !== '' && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-400">Analysis Failed</h4>
              <p className="text-sm text-dev-text-muted mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Files Section */}
        <div className="flex-1 flex flex-col border-r border-dev-border">
          {/* Files Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-dev-border bg-dev-bg">
            <div className="flex items-center gap-4">
              <h2 className="font-medium text-dev-text flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Files
                <span className="text-dev-text-muted text-sm">({currentProject.files.length})</span>
              </h2>
              
              {currentProject.files.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <button 
                    onClick={selectAll}
                    className="text-dev-accent hover:underline"
                  >
                    Select all
                  </button>
                  {selectedFiles.size > 0 && (
                    <>
                      <span className="text-dev-text-subtle">|</span>
                      <button 
                        onClick={deselectAll}
                        className="text-dev-text-muted hover:text-dev-text"
                      >
                        Deselect ({selectedFiles.size})
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="dev-button-secondary flex items-center gap-2 text-sm"
            >
              {showUpload ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {showUpload ? 'Cancel' : 'Upload Files'}
            </button>
          </div>

          {/* Upload Area */}
          {showUpload && (
            <div className="px-6 py-4 border-b border-dev-border bg-dev-surface">
              <SectionErrorBoundary sectionName="File Upload">
                <ProjectFileUpload onFilesUploaded={handleFilesUploaded} />
              </SectionErrorBoundary>
            </div>
          )}

          {/* Files List */}
          <div className="flex-1 overflow-auto px-6 py-4">
            {currentProject.files.length === 0 ? (
              <div className="text-center py-12">
                <FileCode className="w-12 h-12 text-dev-text-subtle mx-auto mb-3" />
                <h3 className="text-dev-text font-medium mb-1">No files yet</h3>
                <p className="text-sm text-dev-text-muted mb-4">
                  Upload your frontend files to start analyzing
                </p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="dev-button flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  Upload Files
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {currentProject.files.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors
                               ${selectedFiles.has(file.id) 
                                 ? 'bg-dev-accent/10 border-dev-accent/30' 
                                 : 'bg-dev-surface border-dev-border hover:border-dev-accent/30'
                               }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="rounded border-dev-border bg-dev-bg text-dev-accent"
                    />
                    
                    <FileCode className="w-4 h-4 text-dev-text-muted" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dev-text truncate">{file.name}</p>
                      <p className="text-xs text-dev-text-muted">{formatFileSize(file.size)}</p>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === file.id ? null : file.id)}
                        className="p-1.5 text-dev-text-muted hover:text-dev-text rounded"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {menuOpen === file.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-32 bg-dev-surface 
                                        border border-dev-border rounded-lg shadow-lg z-20 py-1">
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-400
                                       hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reports Section */}
        <div className="w-80 flex flex-col bg-dev-surface">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-dev-border">
            <BarChart3 className="w-4 h-4 text-dev-accent" />
            <h2 className="font-medium text-dev-text">
              Reports
              <span className="text-dev-text-muted text-sm ml-1">({currentProject.reports.length})</span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {currentProject.reports.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-8 h-8 text-dev-text-subtle mx-auto mb-2" />
                <p className="text-sm text-dev-text-muted">
                  No reports yet
                </p>
                <p className="text-xs text-dev-text-subtle mt-1">
                  Run analysis to generate reports
                </p>
              </div>
            ) : (
              currentProject.reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => onViewReport(report.id)}
                  className="w-full text-left p-3 rounded-lg bg-dev-bg border border-dev-border
                           hover:border-dev-accent/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-lg font-bold ${
                      report.score.overall >= 70 ? 'text-green-500' :
                      report.score.overall >= 50 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {report.score.overall}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-dev-accent" />
                  </div>
                  <p className="text-xs text-dev-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(report.timestamp)}
                  </p>
                  <p className="text-xs text-dev-text-subtle mt-1">
                    {report.files.length} files analyzed
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
