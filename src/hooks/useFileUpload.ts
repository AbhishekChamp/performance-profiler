import { useCallback, useState } from 'react';
import type { UploadedFile } from '@/types';

interface UseFileUploadReturn {
  files: UploadedFile[];
  isDragging: boolean;
  addFiles: (fileList: FileList | null) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setIsDragging: (dragging: boolean) => void;
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

export function useFileUpload(): UseFileUploadReturn {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: UploadedFile[] = [];
    const processedPaths = new Set<string>();

    for (const file of Array.from(fileList)) {
      // Skip if not a supported file type
      if (!isSupportedFile(file.name)) {
        continue;
      }

      // Get the relative path (for folder uploads) or just filename
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      
      // Skip duplicates
      if (processedPaths.has(relativePath)) {
        continue;
      }
      processedPaths.add(relativePath);

      try {
        // Skip binary files and very large files (>10MB)
        if (file.size > 10 * 1024 * 1024) {
          continue;
        }

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
      setFiles(prev => {
        // Merge with existing files, avoiding duplicates by path
        const existingPaths = new Set(prev.map(f => f.path));
        const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
        return [...prev, ...uniqueNewFiles];
      });
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    isDragging,
    addFiles,
    removeFile,
    clearFiles,
    setIsDragging,
  };
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
