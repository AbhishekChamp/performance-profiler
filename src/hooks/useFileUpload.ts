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

export function useFileUpload(): UseFileUploadReturn {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      try {
        const content = await readFile(file);
        newFiles.push({
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          content,
          path: file.name,
        });
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
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
