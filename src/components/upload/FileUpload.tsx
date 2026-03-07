import { Upload, X, File, FileCode, FileType } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useCallback } from 'react';
import type { UploadedFile } from '@/types';

interface FileUploadProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  onAnalyze: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getFileIcon(filename: string) {
  if (filename.endsWith('.html')) return <FileType className="w-5 h-5 text-dev-warning" />;
  if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.ts') || filename.endsWith('.tsx')) {
    return <FileCode className="w-5 h-5 text-dev-accent" />;
  }
  if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    return <FileCode className="w-5 h-5 text-dev-info" />;
  }
  return <File className="w-5 h-5 text-dev-text-subtle" />;
}

export function FileUpload({ onFilesSelected, onAnalyze }: FileUploadProps) {
  const { files, isDragging, addFiles, removeFile, clearFiles, setIsDragging } = useFileUpload();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, [setIsDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, [setIsDragging]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles, setIsDragging]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = ''; // Reset input
  }, [addFiles]);

  const handleAnalyze = useCallback(() => {
    onFilesSelected(files);
    onAnalyze();
  }, [files, onFilesSelected, onAnalyze]);

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
          ${isDragging 
            ? 'border-dev-accent bg-dev-accent/5' 
            : 'border-dev-border bg-dev-surface/50 hover:border-dev-border hover:bg-dev-surface'
          }
        `}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".html,.js,.jsx,.ts,.tsx,.css,.scss,.json"
        />
        
        <div className="pointer-events-none">
          <div className={`
            w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all
            ${isDragging ? 'bg-dev-accent/20 scale-110' : 'bg-dev-surface'}
          `}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-dev-accent' : 'text-dev-text-muted'}`} />
          </div>
          
          <h3 className="text-lg font-medium text-dev-text mb-2">
            {isDragging ? 'Drop files here' : 'Upload your files'}
          </h3>
          
          <p className="text-sm text-dev-text-muted mb-4">
            Drag and drop HTML, JavaScript, CSS, or React build files
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 text-xs text-dev-text-subtle">
            <span className="px-2 py-1 bg-dev-surface rounded">.html</span>
            <span className="px-2 py-1 bg-dev-surface rounded">.js</span>
            <span className="px-2 py-1 bg-dev-surface rounded">.jsx</span>
            <span className="px-2 py-1 bg-dev-surface rounded">.ts</span>
            <span className="px-2 py-1 bg-dev-surface rounded">.tsx</span>
            <span className="px-2 py-1 bg-dev-surface rounded">.css</span>
            <span className="px-2 py-1 bg-dev-surface rounded">.json</span>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 bg-dev-surface rounded-xl border border-dev-border overflow-hidden">
          <div className="px-4 py-3 border-b border-dev-border flex items-center justify-between">
            <h4 className="text-sm font-medium text-dev-text">
              Files ({files.length})
            </h4>
            <button
              onClick={clearFiles}
              className="text-xs text-dev-text-muted hover:text-dev-danger transition-colors"
            >
              Clear all
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="px-4 py-3 flex items-center gap-3 border-b border-dev-border-subtle last:border-0 hover:bg-dev-surface-hover transition-colors"
              >
                {getFileIcon(file.name)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dev-text truncate">{file.name}</p>
                  <p className="text-xs text-dev-text-subtle">{formatBytes(file.size)}</p>
                </div>
                
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1.5 text-dev-text-subtle hover:text-dev-danger hover:bg-dev-danger/10 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="px-4 py-3 border-t border-dev-border bg-dev-surface">
            <button
              onClick={handleAnalyze}
              className="w-full dev-button flex items-center justify-center gap-2 py-2.5"
            >
              <span>Analyze Performance</span>
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-dev-surface rounded-lg border border-dev-border">
          <h5 className="text-xs font-medium text-dev-accent mb-2">Bundle Analysis</h5>
          <p className="text-xs text-dev-text-muted">Upload JS bundles to detect duplicates and size issues</p>
        </div>
        <div className="p-4 bg-dev-surface rounded-lg border border-dev-border">
          <h5 className="text-xs font-medium text-dev-accent mb-2">DOM Complexity</h5>
          <p className="text-xs text-dev-text-muted">Upload HTML files to analyze node count and depth</p>
        </div>
        <div className="p-4 bg-dev-surface rounded-lg border border-dev-border">
          <h5 className="text-xs font-medium text-dev-accent mb-2">React Detection</h5>
          <p className="text-xs text-dev-text-muted">Upload JSX/TSX files to find anti-patterns</p>
        </div>
      </div>
    </div>
  );
}
