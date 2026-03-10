import { Upload, X, File, FileCode, FileType, FolderUp, FileJson, Trash2, Sparkles } from 'lucide-react';
import { useCallback, useState, useRef, useEffect } from 'react';
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

export function FileUpload({
  files,
  isDragging,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onSetDragging,
  onAnalyze,
}: FileUploadProps) {
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
    (e: React.DragEvent) => {
      e.preventDefault();
      onSetDragging(true);
    },
    [onSetDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onSetDragging(false);
    },
    [onSetDragging]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onSetDragging(false);
      onAddFiles(e.dataTransfer.files);
    },
    [onAddFiles, onSetDragging]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onAddFiles(e.target.files);
      e.target.value = '';
    },
    [onAddFiles]
  );

  const handleFolderInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onAddFiles(e.target.files);
      e.target.value = '';
    },
    [onAddFiles]
  );

  const totalSize = files?.reduce((sum, f) => sum + f.size, 0) || 0;

  return (
    <div className="w-full">
      {/* Upload Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-gray-800/50 rounded-xl p-1 border border-gray-700/50">
          <button
            onClick={() => setIsFolderMode(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              !isFolderMode
                ? 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-400 hover:text-white'
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
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            Folder
          </button>
        </div>
      </div>

      {/* Drop Zone with 3D Effect */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group perspective-1000
        `}
      >
        {/* 3D Card Container */}
        <div
          className={`
            relative transform-gpu transition-all duration-500 ease-out
            ${isDragging ? 'scale-[1.02] rotate-x-2' : 'hover:scale-[1.01] hover:-translate-y-1'}
          `}
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Background Glow Effect */}
          <div className="absolute -inset-1 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500" />

          {/* Main Card */}
          <div
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
              bg-gray-900/80 backdrop-blur-xl
              ${
                isDragging
                  ? 'border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.3)]'
                  : 'border-gray-700/50 hover:border-gray-600 shadow-2xl shadow-black/50'
              }
            `}
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

            {/* 3D Floating Icon */}
            <div className="relative mb-6">
              <div
                className={`
                  w-24 h-24 mx-auto rounded-2xl flex items-center justify-center
                  transition-all duration-500 transform-gpu
                  ${
                    isDragging
                      ? 'bg-linear-to-br from-cyan-500 to-blue-600 scale-110 rotate-6 shadow-2xl shadow-cyan-500/50'
                      : 'bg-linear-to-br from-gray-700 to-gray-800 group-hover:scale-105 group-hover:-translate-y-2 shadow-xl shadow-black/30'
                  }
                `}
                style={{
                  transform: isDragging ? 'translateZ(50px) rotateY(10deg)' : 'translateZ(30px)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {isFolderMode ? (
                  <FolderUp
                    className={`w-12 h-12 ${isDragging ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors`}
                  />
                ) : (
                  <Upload
                    className={`w-12 h-12 ${isDragging ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors`}
                  />
                )}

                {/* Floating Particles */}
                <div
                  className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0s', animationDuration: '2s' }}
                />
                <div
                  className="absolute -bottom-1 -left-3 w-3 h-3 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}
                />
                <div
                  className="absolute top-0 -left-4 w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                  style={{ animationDelay: '1s', animationDuration: '3s' }}
                />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">
              {isDragging
                ? 'Drop to upload!'
                : isFolderMode
                  ? 'Upload build folder'
                  : 'Upload your files'}
            </h3>

            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {isFolderMode
                ? 'Drag and drop your build/dist folder, or click to browse'
                : 'Drag and drop HTML, JavaScript, CSS, or React build files'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() =>
                  isFolderMode ? folderInputRef.current?.click() : fileInputRef.current?.click()
                }
                className="
                  px-6 py-3 bg-linear-to-r from-blue-500 to-cyan-500 
                  text-white font-semibold rounded-xl
                  transform-gpu transition-all duration-300
                  hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25
                  active:scale-95
                  border border-white/10
                "
              >
                {isFolderMode ? 'Select Folder' : 'Select Files'}
              </button>
            </div>

            {/* File Type Tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-6 text-xs">
              {['.html', '.js', '.jsx', '.ts', '.tsx', '.css', '.json'].map(ext => (
                <span
                  key={ext}
                  className="px-2.5 py-1 bg-gray-800/80 text-gray-400 rounded-lg border border-gray-700/50"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Template Selection & Auto-detection */}
      {files?.length > 0 && (
        <div className="mt-6">
          <div className="bg-dev-surface border border-dev-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-dev-accent" />
              <span className="text-sm font-medium text-dev-text">Analysis Template</span>
              {lastDetectedTemplate && lastDetectedTemplate.confidence > 0.3 && (
                <span className="text-xs px-2 py-0.5 bg-dev-accent/10 text-dev-accent rounded-full">
                  Auto-detected ({Math.round(lastDetectedTemplate.confidence * 100)}%)
                </span>
              )}
            </div>
            <TemplateSelectorCompact />
            {lastDetectedTemplate && lastDetectedTemplate.reasons.length > 0 && (
              <div className="mt-2 text-xs text-dev-text-subtle">
                <span className="font-medium">Detected:</span>{' '}
                {lastDetectedTemplate.reasons.slice(0, 2).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* File List with 3D Cards */}
      {files?.length > 0 && (
        <div className="mt-6">
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl shadow-black/30">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between bg-linear-to-r from-gray-800/50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <File className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {files?.length || 0} file{(files?.length || 0) !== 1 ? 's' : ''}
                  </h4>
                  <p className="text-xs text-gray-400">{formatBytes(totalSize)} total</p>
                </div>
              </div>
              <button
                onClick={onClearFiles}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>

            {/* File Items */}
            <div className="max-h-72 overflow-y-auto">
              {files?.map((file, index) => (
                <div
                  key={file.id}
                  className="group px-6 py-3 flex items-center gap-4 border-b border-gray-700/30 last:border-0 hover:bg-gray-800/50 transition-all duration-300"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getFileIcon(file.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate group-hover:text-white transition-colors">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                  </div>

                  {file.path && file.path !== file.name && (
                    <span className="text-xs text-gray-600 truncate max-w-50 hidden sm:block">
                      {file.path}
                    </span>
                  )}

                  <button
                    onClick={() => onRemoveFile(file.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Analyze Button */}
            <div className="px-6 py-4 border-t border-gray-700/50 bg-linear-to-r from-gray-800/30 to-transparent">
              <button
                onClick={onAnalyze}
                className="
                  w-full py-4 
                  bg-linear-to-r from-emerald-500 via-green-500 to-emerald-600
                  hover:from-emerald-400 hover:via-green-400 hover:to-emerald-500
                  text-white font-bold text-lg rounded-xl
                  transform-gpu transition-all duration-300
                  hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30
                  active:scale-[0.98]
                  cursor-pointer
                  border border-white/10
                  relative overflow-hidden
                  group
                "
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <span className="relative flex items-center justify-center gap-3">
                  <span className="text-xl">🚀</span>
                  Analyze Performance
                  <span className="text-xl">⚡</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
