import { Activity, Github, FileDown, Trash2 } from 'lucide-react';
import { useAnalysisStore } from '@/stores/analysisStore';

interface HeaderProps {
  onExport?: () => void;
  onClear?: () => void;
}

export function Header({ onExport, onClear }: HeaderProps) {
  const { currentReport } = useAnalysisStore();

  return (
    <header className="h-14 bg-dev-surface border-b border-dev-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-linear-to-br from-dev-accent to-dev-accent-hover rounded-lg flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-dev-text">Frontend Performance Profiler</h1>
          <p className="text-xs text-dev-text-subtle">Analyze. Optimize. Ship Faster.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {currentReport && (
          <>
            <button
              onClick={onExport}
              className="dev-button-secondary flex items-center gap-2"
              title="Export Report"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onClear}
              className="dev-button-secondary flex items-center gap-2"
              title="Clear Analysis"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </>
        )}

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-dev-text-muted hover:text-dev-text transition-colors"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>
    </header>
  );
}
