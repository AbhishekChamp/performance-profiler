import { 
  Package, 
  FileCode, 
  Palette, 
  Images, 
  Braces, 
  Component,
  Clock,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import type { AnalysisSection } from './types';

interface SidebarProps {
  activeSection: AnalysisSection;
  onSectionChange: (section: AnalysisSection) => void;
  hasReport: boolean;
}

const sections: { id: AnalysisSection; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Zap },
  { id: 'bundle', label: 'Bundle Analysis', icon: Package },
  { id: 'dom', label: 'DOM Complexity', icon: FileCode },
  { id: 'css', label: 'CSS Analysis', icon: Palette },
  { id: 'assets', label: 'Assets', icon: Images },
  { id: 'javascript', label: 'JavaScript', icon: Braces },
  { id: 'react', label: 'React', icon: Component },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'risks', label: 'Risks', icon: AlertTriangle },
];

export function Sidebar({ activeSection, onSectionChange, hasReport }: SidebarProps) {
  return (
    <aside className="w-56 bg-dev-surface border-r border-dev-border flex flex-col shrink-0">
      <div className="p-3 border-b border-dev-border">
        <h2 className="section-header mb-0">Analysis Sections</h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const isDisabled = !hasReport && section.id !== 'overview';

          return (
            <button
              key={section.id}
              onClick={() => !isDisabled && onSectionChange(section.id)}
              disabled={isDisabled}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm
                transition-all duration-200 mb-1
                ${isActive 
                  ? 'bg-dev-accent/10 text-dev-accent border border-dev-accent/30' 
                  : 'text-dev-text-muted hover:bg-dev-surface-hover hover:text-dev-text'
                }
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-dev-border text-xs text-dev-text-subtle">
        <p>Keyboard shortcuts:</p>
        <div className="mt-1 space-y-1">
          <div className="flex justify-between">
            <span>Navigate</span>
            <kbd className="px-1.5 py-0.5 bg-dev-border rounded text-dev-text-muted">↑↓</kbd>
          </div>
          <div className="flex justify-between">
            <span>Select</span>
            <kbd className="px-1.5 py-0.5 bg-dev-border rounded text-dev-text-muted">Enter</kbd>
          </div>
        </div>
      </div>
    </aside>
  );
}
