import { Activity, FileDown, Trash2 } from 'lucide-react';
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
      className="h-14 bg-(--dev-surface) border-b border-(--dev-border) flex items-center justify-between px-4 shrink-0"
      role="banner"
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 bg-linear-to-br from-(--dev-accent) to-(--dev-accent-hover) rounded-lg flex items-center justify-center"
          aria-hidden="true"
        >
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-(--dev-text)">
            Frontend Performance Profiler
          </h1>
          <p className="text-xs text-(--dev-text-subtle)">
            Analyze. Optimize. Ship Faster.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {currentReport && (
          <>
            <button
              onClick={onExport}
              className="dev-button-secondary flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-(--dev-accent)/50"
              title="Export Report (Ctrl + E)"
              aria-label="Export report"
            >
              <FileDown className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onClear}
              className="dev-button-secondary flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-(--dev-accent)/50"
              title="Clear Analysis"
              aria-label="Clear analysis"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </>
        )}

        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-(--dev-border)">
          <OfflineIndicator />
          <InstallButton />
          <KeyboardShortcutsHelp />
          <ThemeToggleSimple size="sm" />
          
          <a
            href="https://github.com/AbhishekChamp/performance-profiler"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-(--dev-text-muted) hover:text-(--dev-text) transition-colors focus:outline-none focus:ring-2 focus:ring-(--dev-accent)/50 rounded-lg"
            aria-label="View on GitHub"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
