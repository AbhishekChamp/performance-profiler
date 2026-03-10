import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  RotateCcw, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  X,
  Plus,
  Trash2,
  Zap,
  FileJson,
  FileType,
  FileText,
  ChevronRight,
  AlertCircle,
  Code2,
} from 'lucide-react';
import { usePlaygroundStore, SAMPLE_FILES } from '@/stores/playgroundStore';
import { analyzeFile, calculateAnalysis, applyQuickFix } from '@/core/playground/analyzer';
import { createPatch, generateCommitMessage } from '@/core/playground/transformer';
import { ScoreComparison } from './ScoreComparison';
import { OptimizationPanel } from './OptimizationPanel';
import { IssueList } from './IssueList';
import { Button } from '@/components/ui/Button';
import type { PlaygroundFile } from '@/types/playground';
import toast from 'react-hot-toast';

// File icon mapping
const FILE_ICONS: Record<string, React.ElementType> = {
  html: FileCode,
  css: FileText,
  scss: FileText,
  javascript: FileJson,
  typescript: FileJson,
  tsx: FileJson,
};

// Editor theme based on app theme
function getEditorTheme(isDark: boolean): 'vs-dark' | 'light' {
  return isDark ? 'vs-dark' : 'light';
}

// File tab component
function FileTab({ 
  file, 
  isActive, 
  onClick, 
  onClose 
}: { 
  file: PlaygroundFile; 
  isActive: boolean; 
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}) {
  const Icon = FILE_ICONS[file.language] || FileCode;
  
  return (
    <motion.button
      layout
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 text-sm border-r border-dev-border
        transition-colors min-w-[120px] max-w-[200px]
        ${isActive 
          ? 'bg-dev-surface text-dev-text border-t-2 border-t-dev-accent' 
          : 'bg-dev-bg text-dev-text-muted hover:bg-dev-surface-hover'
        }
      `}
    >
      <Icon size={14} />
      <span className="flex-1 truncate">{file.name}</span>
      {file.isDirty && <span className="w-2 h-2 rounded-full bg-dev-accent" />}
      <button
        onClick={onClose}
        className="p-0.5 hover:bg-dev-border rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} />
      </button>
    </motion.button>
  );
}

export function CodePlayground() {
  const [isDark, setIsDark] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'issues' | 'optimizations'>('issues');
  const [copied, setCopied] = useState(false);
  
  const {
    files,
    activeFileId,
    isAnalyzing,
    analysis,
    addFile,
    removeFile,
    setActiveFile,
    updateFileContent,
    updateFileIssues,
    revertFile,
    importFiles,
    exportFile,
  } = usePlaygroundStore();
  
  const activeFile = files.find(f => f.id === activeFileId);
  
  // Initialize with sample files if empty
  useEffect(() => {
    if (files.length === 0) {
      importFiles(SAMPLE_FILES);
    }
  }, []);
  
  // Analyze file when content changes
  useEffect(() => {
    if (!activeFile) return;
    
    const timer = setTimeout(() => {
      const result = analyzeFile(activeFile);
      updateFileIssues(activeFile.id, result.issues);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [activeFile?.modifiedContent]);
  
  // Calculate overall analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      const overall = calculateAnalysis(files);
      usePlaygroundStore.setState({ analysis: overall });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [files]);
  
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile.id, value);
    }
  }, [activeFile, updateFileContent]);
  
  const handleApplyFix = useCallback((issueId: string) => {
    if (!activeFile) return;
    
    const issue = activeFile.issues.find(i => i.id === issueId);
    if (!issue || !issue.fixable) return;
    
    const fixed = applyQuickFix(
      activeFile.modifiedContent,
      issue.rule,
      issue.line
    );
    
    updateFileContent(activeFile.id, fixed);
    toast.success('Fix applied!');
  }, [activeFile, updateFileContent]);
  
  const handleRevert = useCallback(() => {
    if (!activeFile) return;
    revertFile(activeFile.id);
    toast.success('File reverted to original');
  }, [activeFile, revertFile]);
  
  const handleExport = useCallback(() => {
    if (!activeFile) return;
    
    const exported = exportFile(activeFile.id);
    if (!exported) return;
    
    const blob = new Blob([exported.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exported.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('File downloaded!');
  }, [activeFile, exportFile]);
  
  const handleCopy = useCallback(async () => {
    if (!activeFile) return;
    
    try {
      await navigator.clipboard.writeText(activeFile.modifiedContent);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  }, [activeFile]);
  
  const handleDownloadPatch = useCallback(() => {
    if (!activeFile) return;
    
    const patch = createPatch(
      activeFile.name,
      activeFile.originalContent,
      activeFile.modifiedContent
    );
    
    const blob = new Blob([patch], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFile.name}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Patch downloaded!');
  }, [activeFile]);
  
  const getLanguage = (filename: string) => {
    if (filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.jsx') || filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.scss')) return 'scss';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.html')) return 'html';
    return 'javascript';
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dev-border bg-dev-surface">
        <div className="flex items-center gap-3">
          <Code2 className="text-dev-accent" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-dev-text">Code Playground</h2>
            <p className="text-sm text-dev-text-muted">
              Apply optimizations and see real-time score improvements
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => importFiles(SAMPLE_FILES)}
            leftIcon={<Plus size={16} />}
          >
            Load Samples
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? 'Light' : 'Dark'} Theme
          </Button>
        </div>
      </div>
      
      {/* Score Comparison */}
      {analysis && (
        <div className="border-b border-dev-border">
          <ScoreComparison analysis={analysis} />
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* File Tabs */}
          <div className="flex items-center bg-dev-bg border-b border-dev-border overflow-x-auto">
            {files.map(file => (
              <div key={file.id} className="group">
                <FileTab
                  file={file}
                  isActive={file.id === activeFileId}
                  onClick={() => setActiveFile(file.id)}
                  onClose={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                />
              </div>
            ))}
            <button
              onClick={() => {
                const name = `file${files.length + 1}.js`;
                addFile(name, 'javascript', '// New file');
              }}
              className="p-2 text-dev-text-muted hover:text-dev-text hover:bg-dev-surface-hover transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          
          {/* Editor */}
          <div className="flex-1 relative">
            {activeFile ? (
              <Editor
                height="100%"
                language={getLanguage(activeFile.name)}
                value={activeFile.modifiedContent}
                onChange={handleEditorChange}
                theme={getEditorTheme(isDark)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  tabSize: 2,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-dev-text-muted">
                <div className="text-center">
                  <FileCode size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select or create a file to start editing</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between p-2 border-t border-dev-border bg-dev-surface">
            <div className="flex items-center gap-2">
              {activeFile && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRevert}
                    leftIcon={<RotateCcw size={14} />}
                    disabled={!activeFile.isDirty}
                  >
                    Revert
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExport}
                    leftIcon={<Download size={14} />}
                  >
                    Download
                  </Button>
                  {activeFile.isDirty && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownloadPatch}
                      leftIcon={<FileText size={14} />}
                    >
                      Export Patch
                    </Button>
                  )}
                </>
              )}
            </div>
            
            {activeFile && (
              <div className="flex items-center gap-4 text-sm text-dev-text-muted">
                <span>{activeFile.issues.length} issues</span>
                <span>{activeFile.modifiedContent.split('\n').length} lines</span>
                <span>{new Blob([activeFile.modifiedContent]).size} bytes</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-dev-border bg-dev-surface overflow-hidden"
            >
              <div className="flex items-center border-b border-dev-border">
                <button
                  onClick={() => setActiveSidebarTab('issues')}
                  className={`
                    flex-1 px-4 py-3 text-sm font-medium transition-colors
                    ${activeSidebarTab === 'issues' 
                      ? 'text-dev-accent border-b-2 border-dev-accent' 
                      : 'text-dev-text-muted hover:text-dev-text'
                    }
                  `}
                >
                  Issues ({activeFile?.issues.length || 0})
                </button>
                <button
                  onClick={() => setActiveSidebarTab('optimizations')}
                  className={`
                    flex-1 px-4 py-3 text-sm font-medium transition-colors
                    ${activeSidebarTab === 'optimizations' 
                      ? 'text-dev-accent border-b-2 border-dev-accent' 
                      : 'text-dev-text-muted hover:text-dev-text'
                    }
                  `}
                >
                  Optimizations
                </button>
              </div>
              
              <div className="h-[calc(100%-49px)] overflow-y-auto">
                {activeSidebarTab === 'issues' ? (
                  <IssueList 
                    file={activeFile} 
                    onApplyFix={handleApplyFix}
                  />
                ) : (
                  <OptimizationPanel 
                    file={activeFile}
                    onApply={(content) => {
                      if (activeFile) {
                        updateFileContent(activeFile.id, content);
                      }
                    }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="absolute right-4 bottom-20 p-2 bg-dev-accent text-white rounded-full shadow-lg hover:bg-dev-accent/90 transition-colors z-10"
        >
          <ChevronRight 
            size={20} 
            className={`transition-transform ${showSidebar ? 'rotate-180' : ''}`} 
          />
        </button>
      </div>
    </div>
  );
}
