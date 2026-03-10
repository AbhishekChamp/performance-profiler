/**
 * Types for Interactive Code Playground (Feature 8)
 */

export type PlaygroundLanguage = 'html' | 'css' | 'scss' | 'javascript' | 'typescript' | 'tsx';

export interface PlaygroundFile {
  id: string;
  name: string;
  language: PlaygroundLanguage;
  originalContent: string;
  modifiedContent: string;
  issues: PlaygroundIssue[];
  isDirty: boolean;
}

export interface PlaygroundIssue {
  id: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
  fixable: boolean;
  fix?: CodeFix;
  mdnUrl?: string;
  explanation?: string;
}

export interface CodeFix {
  title: string;
  description: string;
  apply: (code: string) => string;
}

export interface PlaygroundAnalysis {
  score: {
    before: number;
    after: number;
    improvement: number;
  };
  metrics: {
    bundleSize: { before: number; after: number; };
    jsComplexity: { before: number; after: number; };
    cssEfficiency: { before: number; after: number; };
    accessibility: { before: number; after: number; };
  };
  issues: {
    total: number;
    fixed: number;
    remaining: number;
  };
}

export interface OptimizationPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  appliesTo: PlaygroundLanguage[];
  transform: (code: string) => string;
}

export interface EditorState {
  cursorPosition: { line: number; column: number };
  selection: { startLine: number; startColumn: number; endLine: number; endColumn: number } | null;
  scrollPosition: { scrollTop: number; scrollLeft: number };
}

export interface PlaygroundState {
  files: PlaygroundFile[];
  activeFileId: string | null;
  isAnalyzing: boolean;
  analysis: PlaygroundAnalysis | null;
  editorState: Record<string, EditorState>;
  history: string[];
  historyIndex: number;
}

export interface CodeTransformation {
  name: string;
  description: string;
  before: string;
  after: string;
  language: PlaygroundLanguage;
}
