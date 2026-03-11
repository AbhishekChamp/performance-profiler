import { useRef, useEffect } from 'react';
import type { AnalysisSection } from './types';
import { sections } from './sidebarData';

interface SidebarProps {
  activeSection: AnalysisSection;
  onSectionChange: (section: AnalysisSection) => void;
  hasReport: boolean;
}

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
      case ' ': {
        event.preventDefault();
        if (hasReport || sectionId === 'overview') {
          onSectionChange(sectionId);
        }
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        const nextButton = navRef.current?.querySelectorAll('button')[index + 1] as HTMLButtonElement;
        nextButton?.focus();
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prevButton = navRef.current?.querySelectorAll('button')[index - 1] as HTMLButtonElement;
        prevButton?.focus();
        break;
      }
      case 'Home': {
        event.preventDefault();
        const firstButton = navRef.current?.querySelector('button') as HTMLButtonElement;
        firstButton?.focus();
        break;
      }
      case 'End': {
        event.preventDefault();
        const buttons = navRef.current?.querySelectorAll('button');
        const lastButton = buttons?.[buttons.length - 1] as HTMLButtonElement;
        lastButton?.focus();
        break;
      }
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


