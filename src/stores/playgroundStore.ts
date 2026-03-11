import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PlaygroundFile, PlaygroundLanguage, PlaygroundAnalysis, EditorState } from '@/types/playground';

interface PlaygroundStoreState {
  // Files
  files: PlaygroundFile[];
  activeFileId: string | null;
  
  // Analysis
  isAnalyzing: boolean;
  analysis: PlaygroundAnalysis | null;
  
  // Editor state
  editorState: Record<string, EditorState>;
  
  // History for undo/redo
  history: string[];
  historyIndex: number;
  
  // Actions
  addFile: (name: string, language: PlaygroundLanguage, content: string) => string;
  removeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  updateFileIssues: (id: string, issues: PlaygroundFile['issues']) => void;
  revertFile: (id: string) => void;
  
  // Editor actions
  saveEditorState: (fileId: string, state: EditorState) => void;
  
  // History actions
  pushHistory: (content: string) => void;
  undo: () => string | null;
  redo: () => string | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Analysis actions
  setAnalyzing: (analyzing: boolean) => void;
  setAnalysis: (analysis: PlaygroundAnalysis | null) => void;
  
  // Import/Export
  importFiles: (files: { name: string; language: PlaygroundLanguage; content: string }[]) => void;
  exportFile: (id: string) => { name: string; content: string } | null;
  exportAll: () => { name: string; content: string }[];
  
  // Reset
  reset: () => void;
}

// const getLanguageFromFilename = (filename: string): PlaygroundLanguage => {
//   if (filename.endsWith('.tsx')) return 'tsx';
//   if (filename.endsWith('.ts')) return 'typescript';
//   if (filename.endsWith('.jsx') || filename.endsWith('.js')) return 'javascript';
//   if (filename.endsWith('.scss') || filename.endsWith('.sass')) return 'scss';
//   if (filename.endsWith('.css')) return 'css';
//   return 'html';
// };

export const usePlaygroundStore = create<PlaygroundStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        files: [],
        activeFileId: null,
        isAnalyzing: false,
        analysis: null,
        editorState: {},
        history: [],
        historyIndex: -1,
        
        // File actions
        addFile: (name, language, content) => {
          const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const file: PlaygroundFile = {
            id,
            name,
            language,
            originalContent: content,
            modifiedContent: content,
            issues: [],
            isDirty: false,
          };
          
          set(state => ({
            files: [...state.files, file],
            activeFileId: id,
          }));
          
          return id;
        },
        
        removeFile: (id) => {
          set(state => {
            const files = state.files.filter(f => f.id !== id);
            const activeFileId = state.activeFileId === id 
              ? (files[0]?.id || null)
              : state.activeFileId;
            
            // Clean up editor state
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _removed, ...restEditorState } = state.editorState;
            
            return { files, activeFileId, editorState: restEditorState };
          });
        },
        
        setActiveFile: (id) => {
          set({ activeFileId: id });
        },
        
        updateFileContent: (id, content) => {
          set(state => ({
            files: state.files.map(f => 
              f.id === id 
                ? { ...f, modifiedContent: content, isDirty: content !== f.originalContent }
                : f
            ),
          }));
        },
        
        updateFileIssues: (id, issues) => {
          set(state => ({
            files: state.files.map(f => 
              f.id === id ? { ...f, issues } : f
            ),
          }));
        },
        
        revertFile: (id) => {
          set(state => ({
            files: state.files.map(f => 
              f.id === id 
                ? { ...f, modifiedContent: f.originalContent, isDirty: false, issues: [] }
                : f
            ),
          }));
        },
        
        // Editor actions
        saveEditorState: (fileId, editorState) => {
          set(state => ({
            editorState: { ...state.editorState, [fileId]: editorState },
          }));
        },
        
        // History actions
        pushHistory: (content) => {
          set(state => {
            // Remove any future history if we're not at the end
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(content);
            
            // Keep only last 50 entries
            if (newHistory.length > 50) {
              newHistory.shift();
            }
            
            return {
              history: newHistory,
              historyIndex: newHistory.length - 1,
            };
          });
        },
        
        undo: () => {
          const state = get();
          if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            set({ historyIndex: newIndex });
            return state.history[newIndex];
          }
          return null;
        },
        
        redo: () => {
          const state = get();
          if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1;
            set({ historyIndex: newIndex });
            return state.history[newIndex];
          }
          return null;
        },
        
        canUndo: () => {
          const state = get();
          return state.historyIndex > 0;
        },
        
        canRedo: () => {
          const state = get();
          return state.historyIndex < state.history.length - 1;
        },
        
        // Analysis actions
        setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
        setAnalysis: (analysis) => set({ analysis }),
        
        // Import/Export
        importFiles: (files) => {
          const newFiles: PlaygroundFile[] = files.map(({ name, language, content }) => ({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            language,
            originalContent: content,
            modifiedContent: content,
            issues: [],
            isDirty: false,
          }));
          
          set(state => ({
            files: [...state.files, ...newFiles],
            activeFileId: newFiles[0]?.id || state.activeFileId,
          }));
        },
        
        exportFile: (id) => {
          const file = get().files.find(f => f.id === id);
          if (!file) return null;
          return {
            name: file.name,
            content: file.modifiedContent,
          };
        },
        
        exportAll: () => {
          return get().files.map(f => ({
            name: f.name,
            content: f.modifiedContent,
          }));
        },
        
        // Reset
        reset: () => set({
          files: [],
          activeFileId: null,
          isAnalyzing: false,
          analysis: null,
          editorState: {},
          history: [],
          historyIndex: -1,
        }),
      }),
      {
        name: 'PlaygroundStore',
        partialize: (state) => ({
          files: state.files.map(f => ({
            ...f,
            // Don't persist issues, they'll be re-analyzed
            issues: [],
          })),
          activeFileId: state.activeFileId,
        }),
      }
    ),
    { name: 'PlaygroundStore' }
  )
);

// Sample files for demo
export const SAMPLE_FILES = [
  {
    name: 'example.html',
    language: 'html' as PlaygroundLanguage,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Performance Example</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <img src="large-image.jpg">
  <script src="app.js"></script>
</body>
</html>`,
  },
  {
    name: 'styles.css',
    language: 'css' as PlaygroundLanguage,
    content: `/* Unused CSS example */
.unused-class {
  color: red;
}

.hero {
  background-image: url('large-bg.jpg');
  font-display: swap;
}

/* Inline critical CSS */
body {
  margin: 0;
  font-family: Arial, sans-serif;
}`,
  },
  {
    name: 'app.js',
    language: 'javascript' as PlaygroundLanguage,
    content: `// Unused imports
import { unused } from './utils';
import lodash from 'lodash';

console.log('Debug message');

function init() {
  // Large dependency
  const result = lodash.merge({}, { a: 1 });
  
  // Inefficient DOM query
  document.querySelectorAll('*').forEach(el => {
    console.log(el);
  });
}

init();`,
  },
];
