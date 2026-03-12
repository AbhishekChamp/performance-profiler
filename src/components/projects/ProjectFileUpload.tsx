import { useCallback, useState, useRef } from 'react';
import { Upload, File, FileCode, FolderUp, FileJson, FileType } from 'lucide-react';
import type { UploadedFile } from '@/types';
import toast from 'react-hot-toast';

interface ProjectFileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getFileIcon(filename: string) {
  if (filename.endsWith('.html')) return <FileType className="w-5 h-5 text-orange-400" />;
  if (filename.endsWith('.json')) return <FileJson className="w-5 h-5 text-yellow-400" />;
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
    return <FileCode className="w-5 h-5 text-blue-400" />;
  }
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
    return <FileCode className="w-5 h-5 text-cyan-400" />;
  }
  if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    return <FileCode className="w-5 h-5 text-pink-400" />;
  }
  return <File className="w-5 h-5 text-gray-400" />;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string || '');
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Supported file extensions for analysis
const SUPPORTED_EXTENSIONS = new Set([
  '.html', '.htm',
  '.js', '.jsx', '.mjs', '.cjs',
  '.ts', '.tsx',
  '.css', '.scss', '.sass', '.less',
  '.json', '.map'
]);

function isSupportedFile(filename: string): boolean {
  const lowerName = filename.toLowerCase();
  return Array.from(SUPPORTED_EXTENSIONS).some(ext => lowerName.endsWith(ext));
}

export function ProjectFileUpload({ onFilesUploaded }: ProjectFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{ name: string; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    const newFiles: UploadedFile[] = [];
    const processedPaths = new Set<string>();

    // Show preview
    const preview = Array.from(fileList)
      .filter(f => isSupportedFile(f.name))
      .slice(0, 5)
      .map(f => ({ name: f.name, size: f.size }));
    setPreviewFiles(preview);

    for (const file of Array.from(fileList)) {
      if (!isSupportedFile(file.name)) continue;

      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      
      if (processedPaths.has(relativePath)) continue;
      processedPaths.add(relativePath);

      // Skip large files (>10MB)
      if (file.size > 10 * 1024 * 1024) continue;

      try {
        const content = await readFile(file);
        
        newFiles.push({
          id: generateId(),
          name: file.name,
          type: file.type || getFileType(file.name),
          size: file.size,
          content,
          path: relativePath,
        });
      } catch {
        // Error reading file handled silently
      }
    }

    if (newFiles.length > 0) {
      onFilesUploaded(newFiles);
      toast.success(`${newFiles.length} file${newFiles.length !== 1 ? 's' : ''} uploaded successfully`);
    } else {
      toast.error('No valid files to upload');
    }

    setPreviewFiles([]);
    setIsProcessing(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging 
            ? 'border-dev-accent bg-dev-accent/10' 
            : 'border-dev-border hover:border-dev-accent/50 hover:bg-dev-bg'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-dev-accent/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-dev-accent" />
          </div>
          
          <div>
            <p className="text-dev-text font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-dev-text-muted mt-1">
              Supports HTML, JS, TS, CSS, and JSON files
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="dev-button-secondary text-sm"
              disabled={isProcessing}
            >
              Select Files
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="dev-button-secondary text-sm flex items-center gap-2"
              disabled={isProcessing}
            >
              <FolderUp className="w-4 h-4" />
              Select Folder
            </button>
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".html,.htm,.js,.jsx,.ts,.tsx,.css,.scss,.sass,.less,.json,.map"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error - webkitdirectory is not in standard HTML types but is supported
          webkitdirectory=""
          directory=""
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Preview */}
      {previewFiles.length > 0 && (
        <div className="bg-dev-bg rounded-lg p-4">
          <p className="text-sm font-medium text-dev-text mb-3">Uploading...</p>
          <div className="space-y-2">
            {previewFiles.map((file, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 p-2 bg-dev-surface rounded-lg"
              >
                {getFileIcon(file.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dev-text truncate">{file.name}</p>
                  <p className="text-xs text-dev-text-muted">{formatBytes(file.size)}</p>
                </div>
                <div className="w-4 h-4 border-2 border-dev-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && previewFiles.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-dev-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const typeMap: Record<string, string> = {
    'html': 'text/html',
    'htm': 'text/html',
    'js': 'application/javascript',
    'jsx': 'application/javascript',
    'ts': 'application/typescript',
    'tsx': 'application/typescript',
    'css': 'text/css',
    'scss': 'text/scss',
    'sass': 'text/sass',
    'less': 'text/less',
    'json': 'application/json',
    'map': 'application/json',
  };
  return typeMap[ext || ''] || 'text/plain';
}
