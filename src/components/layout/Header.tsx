import { Activity, Github, FileDown, Trash2 } from 'lucide-react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { KeyboardShortcutsHelp } from '@/components/ui/KeyboardShortcutsHelp';
import { ThemeToggleSimple } from '@/components/ui/ThemeToggle';
import { InstallButton } from '@/components/ui/InstallPrompt';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';

interface HeaderProps {
  onExport?: () => void;
  onClear?: () => void;
}

export function Header({ onExport, onClear }: HeaderProps) {
  const { currentReport } = useAnalysisStore();

  return (
    <header 
      className="h-14 bg-dev-surface border-b border-dev-border flex items-center justify-between px-4 shrink-0"
      role="banner"
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 bg-linear-to-br from-dev-accent to-dev-accent-hover rounded-lg flex items-center justify-center"
          aria-hidden="true"
        >
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-dev-text">
            Frontend Performance Profiler
          </h1>
          <p className="text-xs text-dev-text-subtle">
            Analyze. Optimize. Ship Faster.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {currentReport && (
          <>
            <button
              onClick={onExport}
              className="dev-button-secondary flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-dev-accent/50"
              title="Export Report (Ctrl + E)"
              aria-label="Export report"
            >
              <FileDown className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onClear}
              className="dev-button-secondary flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-dev-accent/50"
              title="Clear Analysis"
              aria-label="Clear analysis"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </>
        )}

        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-dev-border">
          <OfflineIndicator />
          <InstallButton />
          <KeyboardShortcutsHelp />
          <ThemeToggleSimple size="sm" />
          
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-dev-text-muted hover:text-dev-text transition-colors focus:outline-none focus:ring-2 focus:ring-dev-accent/50 rounded-lg"
            aria-label="View on GitHub"
          >
            <Github className="w-5 h-5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}
