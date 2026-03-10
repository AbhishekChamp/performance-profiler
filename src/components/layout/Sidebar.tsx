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
  Gauge,
  Globe,
  Image,
  Type,
  Accessibility,
  Search,
  FileType,
  Shield,
  ExternalLink,
  Brain,
  GitCompare,
  DollarSign,
  Layers,
  LayoutTemplate,
  TrendingUp,
  Network,
  Terminal,
  Code2,
} from 'lucide-react';
import type { AnalysisSection } from './types';
import { useRef, useEffect } from 'react';

interface SidebarProps {
  activeSection: AnalysisSection;
  onSectionChange: (section: AnalysisSection) => void;
  hasReport: boolean;
}

export const sections: { 
  id: AnalysisSection; 
  label: string; 
  icon: React.ElementType;
  shortcut: string;
}[] = [
  { id: 'overview', label: 'Overview', icon: Zap, shortcut: '1' },
  { id: 'bundle', label: 'Bundle Analysis', icon: Package, shortcut: '2' },
  { id: 'dom', label: 'DOM Complexity', icon: FileCode, shortcut: '3' },
  { id: 'css', label: 'CSS Analysis', icon: Palette, shortcut: '4' },
  { id: 'images', label: 'Images', icon: Image, shortcut: '5' },
  { id: 'fonts', label: 'Fonts', icon: Type, shortcut: '6' },
  { id: 'assets', label: 'Assets', icon: Images, shortcut: '7' },
  { id: 'javascript', label: 'JavaScript', icon: Braces, shortcut: '8' },
  { id: 'react', label: 'React', icon: Component, shortcut: '9' },
  { id: 'webvitals', label: 'Web Vitals', icon: Gauge, shortcut: '0' },
  { id: 'network', label: 'Network', icon: Globe, shortcut: '' },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility, shortcut: '' },
  { id: 'seo', label: 'SEO', icon: Search, shortcut: '' },
  { id: 'typescript', label: 'TypeScript', icon: FileType, shortcut: '' },
  { id: 'security', label: 'Security', icon: Shield, shortcut: '' },
  { id: 'thirdparty', label: 'Third-Party', icon: ExternalLink, shortcut: '' },
  { id: 'memory', label: 'Memory', icon: Brain, shortcut: '' },
  { id: 'imports', label: 'Imports', icon: Layers, shortcut: '' },
  { id: 'graph', label: 'Dependency Graph', icon: Network, shortcut: '' },
  { id: 'timeline', label: 'Timeline', icon: Clock, shortcut: '' },
  { id: 'risks', label: 'Risks', icon: AlertTriangle, shortcut: '' },
  { id: 'budget', label: 'Budget', icon: DollarSign, shortcut: '' },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, shortcut: '' },
  { id: 'compare', label: 'Compare', icon: GitCompare, shortcut: '' },
  { id: 'trends', label: 'Trends', icon: TrendingUp, shortcut: '' },
  { id: 'cicd', label: 'CI/CD Config', icon: Terminal, shortcut: '' },
  { id: 'playground', label: 'Code Playground', icon: Code2, shortcut: '' },
];

export function Sidebar({ activeSection, onSectionChange, hasReport }: SidebarProps) {
  const navRef = useRef<HTMLElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  // Scroll active item into view
  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeSection]);

  const handleKeyDown = (event: React.KeyboardEvent, sectionId: AnalysisSection, index: number) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (hasReport || sectionId === 'overview') {
          onSectionChange(sectionId);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        const nextButton = navRef.current?.querySelectorAll('button')[index + 1] as HTMLButtonElement;
        nextButton?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevButton = navRef.current?.querySelectorAll('button')[index - 1] as HTMLButtonElement;
        prevButton?.focus();
        break;
      case 'Home':
        event.preventDefault();
        const firstButton = navRef.current?.querySelector('button') as HTMLButtonElement;
        firstButton?.focus();
        break;
      case 'End':
        event.preventDefault();
        const buttons = navRef.current?.querySelectorAll('button');
        const lastButton = buttons?.[buttons.length - 1] as HTMLButtonElement;
        lastButton?.focus();
        break;
    }
  };

  return (
    <aside 
      className="w-56 bg-dev-surface border-r border-dev-border flex flex-col shrink-0"
      aria-label="Analysis sections"
    >
      <div className="p-3 border-b border-dev-border">
        <h2 className="section-header mb-0">Analysis Sections</h2>
      </div>
      
      <nav 
        ref={navRef}
        className="flex-1 overflow-y-auto p-2"
        aria-label="Section navigation"
        role="tablist"
        aria-orientation="vertical"
      >
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const isDisabled = !hasReport && section.id !== 'overview';

          return (
            <button
              key={section.id}
              ref={isActive ? activeButtonRef : null}
              onClick={() => !isDisabled && onSectionChange(section.id)}
              onKeyDown={(e) => handleKeyDown(e, section.id, index)}
              disabled={isDisabled}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={isDisabled}
              tabIndex={isActive ? 0 : -1}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm
                transition-all duration-200 mb-1
                focus:outline-none focus:ring-2 focus:ring-dev-accent/50 focus:ring-offset-1 focus:ring-offset-dev-surface
                ${isActive 
                  ? 'bg-dev-accent/10 text-dev-accent border border-dev-accent/30' 
                  : 'text-dev-text-muted hover:bg-dev-surface-hover hover:text-dev-text'
                }
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={`${section.label}${section.shortcut ? ` (${section.shortcut})` : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 text-left truncate">{section.label}</span>
              {section.shortcut && (
                <kbd className="hidden text-xs px-1.5 py-0.5 bg-dev-border rounded text-dev-text-subtle">
                  {section.shortcut}
                </kbd>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-dev-border text-xs text-dev-text-subtle">
        <p className="font-medium mb-2">Keyboard shortcuts:</p>
        <div className="mt-1 space-y-1.5">
          <div className="flex justify-between">
            <span>Navigate</span>
            <kbd className="px-1.5 py-0.5 bg-dev-border rounded text-dev-text-muted">↑↓</kbd>
          </div>
          <div className="flex justify-between">
            <span>Jump to section</span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-dev-border rounded text-dev-text-muted">1</kbd>
              <span className="mx-1">-</span>
              <kbd className="px-1.5 py-0.5 bg-dev-border rounded text-dev-text-muted">0</kbd>
            </span>
          </div>
          <div className="flex justify-between">
            <span>Show help</span>
            <kbd className="px-1.5 py-0.5 bg-dev-border rounded text-dev-text-muted">?</kbd>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Export section order for keyboard navigation
export const getSectionIndex = (sectionId: AnalysisSection): number => {
  return sections.findIndex(s => s.id === sectionId);
};

export const getSectionByIndex = (index: number): AnalysisSection | undefined => {
  return sections[index]?.id;
};

export const getNextSection = (currentSection: AnalysisSection): AnalysisSection | undefined => {
  const currentIndex = getSectionIndex(currentSection);
  return getSectionByIndex(currentIndex + 1);
};

export const getPreviousSection = (currentSection: AnalysisSection): AnalysisSection | undefined => {
  const currentIndex = getSectionIndex(currentSection);
  return getSectionByIndex(currentIndex - 1);
};
