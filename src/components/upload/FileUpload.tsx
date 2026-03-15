import { ArrowRight, CheckCircle2, File, FileCode, FileJson, FileType, FolderUp, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import { TemplateSelectorCompact } from '@/components/templates';
import type { UploadedFile } from '@/types';
import toast from 'react-hot-toast';

interface FileUploadProps {
  files: UploadedFile[];
  isDragging: boolean;
  onAddFiles: (fileList: FileList | null) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onSetDragging: (dragging: boolean) => void;
  onAnalyze: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i] ?? 'B'}`;
}

function getFileIcon(filename: string): React.ReactNode {
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

export function FileUpload({
  files,
  isDragging,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onSetDragging,
  onAnalyze,
}: FileUploadProps): React.ReactNode {
  const [isFolderMode, setIsFolderMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { detectTemplate, autoDetectEnabled, lastDetectedTemplate } = useTemplateStore();

  // Auto-detect template when files change
  useEffect(() => {
    if (files.length > 0 && autoDetectEnabled) {
      const result = detectTemplate(files);

      if (result.confidence > 0.3) {
        const templateName = result.templateId.charAt(0).toUpperCase() + result.templateId.slice(1);
        toast.success(
          `Detected ${templateName} template (${Math.round(result.confidence * 100)}% confidence)`,
          { duration: 3000, icon: '✨' }
        );
      }
    }
  }, [files, autoDetectEnabled, detectTemplate]);

  const handleDragOver = useCallback(
    (e: React.DragEvent): void => {
      e.preventDefault();
      onSetDragging(true);
    },
    [onSetDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent): void => {
      e.preventDefault();
      onSetDragging(false);
    },
    [onSetDragging]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent): void => {
      e.preventDefault();
      onSetDragging(false);
      onAddFiles(e.dataTransfer.files);
    },
    [onAddFiles, onSetDragging]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onAddFiles(e.target.files);
      e.target.value = '';
    },
    [onAddFiles]
  );

  const handleFolderInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onAddFiles(e.target.files);
      e.target.value = '';
    },
    [onAddFiles]
  );

  const totalSize = files.length > 0 ? files.reduce((sum, f) => sum + f.size, 0) : 0;

  return (
    <div className="w-full">
      {/* Upload Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-(--dev-surface)/60 backdrop-blur-sm rounded-xl p-1 border border-(--dev-border)/50">
          <button
            onClick={() => setIsFolderMode(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              !isFolderMode
                ? 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-(--dev-text-muted) hover:text-(--dev-text)'
            }`}
          >
            <File className="w-4 h-4" />
            Files
          </button>
          <button
            onClick={() => setIsFolderMode(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              isFolderMode
                ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-(--dev-text-muted) hover:text-(--dev-text)'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            Folder
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative group"
      >
        {/* Glow effect */}
        <div
          className={`absolute -inset-1 rounded-2xl blur-xl transition-all duration-500 ${
            isDragging
              ? 'bg-linear-to-r from-cyan-500 to-blue-500 opacity-40'
              : 'bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20'
          }`}
        />

        {/* Main card */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-10 md:p-12 text-center transition-all duration-300 bg-(--dev-surface)/40 backdrop-blur-xl ${
            isDragging
              ? 'border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.2)] scale-[1.02]'
              : 'border-(--dev-border)/50 hover:border-(--dev-border) hover:shadow-xl'
          }`}
        >
          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            accept=".html,.js,.jsx,.ts,.tsx,.css,.scss,.json,.map"
          />
          <input
            ref={folderInputRef}
            type="file"
            {...{ webkitdirectory: '', directory: '' }}
            onChange={handleFolderInput}
            className="hidden"
          />

          {/* Icon */}
          <div className="relative mb-6">
            <div
              className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-500 ${
                isDragging
                  ? 'bg-linear-to-br from-cyan-500 to-blue-600 scale-110 shadow-2xl shadow-cyan-500/30'
                  : 'bg-linear-to-br from-(--dev-surface) to-(--dev-bg) group-hover:scale-105 group-hover:-translate-y-1 shadow-lg'
              }`}
            >
              {isFolderMode ? (
                <FolderUp
                  className={`w-10 h-10 transition-colors ${
                    isDragging ? 'text-white' : 'text-(--dev-text-muted) group-hover:text-(--dev-accent)'
                  }`}
                />
              ) : (
                <Upload
                  className={`w-10 h-10 transition-colors ${
                    isDragging ? 'text-white' : 'text-(--dev-text-muted) group-hover:text-(--dev-accent)'
                  }`}
                />
              )}
            </div>

            {/* Floating accent dots */}
            <div
              className="absolute top-0 right-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-bounce"
              style={{ animationDelay: '0s', animationDuration: '2s' }}
            />
            <div
              className="absolute bottom-0 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}
            />
          </div>

          <h3 className="text-xl font-bold text-(--dev-text) mb-2">
            {isDragging ? 'Drop to upload!' : isFolderMode ? 'Upload build folder' : 'Upload your files'}
          </h3>

          <p className="text-(--dev-text-muted) mb-6 max-w-md mx-auto">
            {isFolderMode
              ? 'Drag and drop your build/dist folder, or click to browse'
              : 'Drag and drop HTML, JavaScript, CSS, or React build files'}
          </p>

          {/* Action Button */}
          <button
            onClick={() =>
              isFolderMode ? folderInputRef.current?.click() : fileInputRef.current?.click()
            }
            className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95"
          >
            {isFolderMode ? 'Select Folder' : 'Select Files'}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* File Type Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['.html', '.js', '.jsx', '.ts', '.tsx', '.css', '.json'].map(ext => (
              <span
                key={ext}
                className="px-3 py-1 text-xs bg-(--dev-bg)/50 text-(--dev-text-muted) rounded-lg border border-(--dev-border)/30"
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Template Selection & Auto-detection */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="bg-(--dev-surface)/40 backdrop-blur-sm border border-(--dev-border)/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-(--dev-accent)" />
              <span className="text-sm font-medium text-(--dev-text)">Analysis Template</span>
              {lastDetectedTemplate !== null && lastDetectedTemplate.confidence > 0.3 && (
                <span className="text-xs px-2 py-0.5 bg-(--dev-accent)/10 text-(--dev-accent) rounded-full">
                  Auto-detected ({Math.round(lastDetectedTemplate.confidence * 100)}%)
                </span>
              )}
            </div>
            <TemplateSelectorCompact />
            {lastDetectedTemplate !== null && lastDetectedTemplate.reasons.length > 0 && (
              <div className="mt-2 text-xs text-(--dev-text-subtle)">
                <span className="font-medium">Detected:</span>{' '}
                {lastDetectedTemplate.reasons.slice(0, 2).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="bg-(--dev-surface)/40 backdrop-blur-sm rounded-2xl border border-(--dev-border)/50 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-(--dev-border)/30 flex items-center justify-between bg-linear-to-r from-(--dev-surface)/50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <File className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-(--dev-text)">
                    {files.length} file{files.length !== 1 ? 's' : ''}
                  </h4>
                  <p className="text-xs text-(--dev-text-muted)">{formatBytes(totalSize)} total</p>
                </div>
              </div>
              <button
                onClick={onClearFiles}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-(--dev-danger) hover:bg-(--dev-danger)/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>

            {/* File Items */}
            <div className="max-h-64 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="group px-6 py-3 flex items-center gap-4 border-b border-(--dev-border)/20 last:border-0 hover:bg-(--dev-surface-hover)/50 transition-all duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-(--dev-bg) flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getFileIcon(file.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-(--dev-text) font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-(--dev-text-muted)">{formatBytes(file.size)}</p>
                  </div>

                  {file.path && file.path !== file.name && (
                    <span className="text-xs text-(--dev-text-subtle) truncate max-w-32 hidden sm:block">
                      {file.path}
                    </span>
                  )}

                  <button
                    onClick={() => onRemoveFile(file.id)}
                    className="p-2 text-(--dev-text-muted) hover:text-(--dev-danger) hover:bg-(--dev-danger)/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Analyze Button */}
            <div className="px-6 py-4 border-t border-(--dev-border)/30 bg-linear-to-r from-(--dev-surface)/30 to-transparent">
              <button
                onClick={onAnalyze}
                className="w-full py-4 bg-linear-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:via-green-400 hover:to-emerald-500 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/20 active:scale-[0.98] relative overflow-hidden group"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <span className="relative flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  Analyze Performance
                  <Sparkles className="w-5 h-5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
