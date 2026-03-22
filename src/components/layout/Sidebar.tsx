import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { TIMING } from '@/utils/animations';
import { ThemeToggleSimple } from '@/components/ui/ThemeToggle';
import type { AnalysisSection } from '@/components/layout/types';

interface SidebarProps {
  activeSection: AnalysisSection;
  onSectionChange: (section: AnalysisSection) => void;
  hasReport?: boolean;
}

const SECTION_GROUPS: Record<string, AnalysisSection[]> = {
  'Core Analysis': ['overview', 'bundle', 'dom', 'css', 'images', 'fonts', 'assets'],
  'Code Quality': ['javascript', 'typescript', 'imports'],
  'Performance': ['webvitals', 'network', 'memory', 'timeline', 'waterfall'],
  'Issues & Risks': ['accessibility', 'seo', 'security', 'risks'],
  'Tools': ['cicd', 'eslint', 'playground', 'budget', 'templates', 'compare', 'trends', 'graph'],
};

interface SectionInfo {
  id: AnalysisSection;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionInfo[] = [
  { id: 'overview', label: 'Overview', icon: null },
  { id: 'bundle', label: 'Bundle', icon: null },
  { id: 'dom', label: 'DOM', icon: null },
  { id: 'css', label: 'CSS', icon: null },
  { id: 'images', label: 'Images', icon: null },
  { id: 'fonts', label: 'Fonts', icon: null },
  { id: 'assets', label: 'Assets', icon: null },
  { id: 'javascript', label: 'JavaScript', icon: null },
  { id: 'typescript', label: 'TypeScript', icon: null },
  { id: 'imports', label: 'Imports', icon: null },
  { id: 'webvitals', label: 'Web Vitals', icon: null },
  { id: 'network', label: 'Network', icon: null },
  { id: 'memory', label: 'Memory', icon: null },
  { id: 'timeline', label: 'Timeline', icon: null },
  { id: 'waterfall', label: 'Waterfall', icon: null },
  { id: 'accessibility', label: 'Accessibility', icon: null },
  { id: 'seo', label: 'SEO', icon: null },
  { id: 'security', label: 'Security', icon: null },
  { id: 'risks', label: 'Risks', icon: null },
  { id: 'cicd', label: 'CI/CD', icon: null },
  { id: 'eslint', label: 'ESLint', icon: null },
  { id: 'playground', label: 'Playground', icon: null },
  { id: 'budget', label: 'Budget', icon: null },
  { id: 'templates', label: 'Templates', icon: null },
  { id: 'compare', label: 'Compare', icon: null },
  { id: 'trends', label: 'Trends', icon: null },
  { id: 'graph', label: 'Graph', icon: null },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(Object.keys(SECTION_GROUPS));
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const updateIndicator = useCallback((): void => {
    const activeItem = itemRefs.current.get(activeSection);
    if (activeItem !== undefined && navRef.current !== null) {
      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      setIndicatorStyle({
        top: itemRect.top - navRect.top,
        height: itemRect.height,
      });
    }
  }, [activeSection]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  const toggleGroup = (group: string): void => {
    setExpandedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, section: AnalysisSection): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSectionChange(section);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--dev-surface)] border border-[var(--dev-border)]"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        className="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[var(--dev-surface)] border-r border-[var(--dev-border)] lg:transform-none lg:transition-none"
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-[var(--dev-border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--dev-text)]">Report Sections</h2>
            <ThemeToggleSimple size="sm" />
          </div>

          <nav ref={navRef} className="flex-1 overflow-y-auto p-2 relative">
            <motion.div
              className="absolute left-0 w-1 bg-[var(--dev-accent)] rounded-r"
              initial={false}
              animate={{
                top: indicatorStyle.top,
                height: indicatorStyle.height,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />

            {Object.entries(SECTION_GROUPS).map(([groupName, sections]) => (
              <div key={groupName} className="mb-2">
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[var(--dev-text-muted)] uppercase tracking-wider hover:text-[var(--dev-text)] transition-colors"
                >
                  {groupName}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${expandedGroups.includes(groupName) ? '' : '-rotate-90'}`}
                  />
                </button>

                <AnimatePresence>
                  {expandedGroups.includes(groupName) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: TIMING.fast }}
                      className="overflow-hidden"
                    >
                      {sections.map((sectionId, index) => {
                        const section = SECTIONS.find(s => s.id === sectionId);
                        if (section === undefined) return null;
                        const isActive = activeSection === sectionId;

                        return (
                          <motion.button
                            key={sectionId}
                            ref={el => {
                              if (el !== null) itemRefs.current.set(sectionId, el);
                            }}
                            onClick={() => onSectionChange(sectionId)}
                            onKeyDown={(e) => handleKeyDown(e, sectionId)}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                              transition-all duration-200
                              ${isActive
                                ? 'text-[var(--dev-accent)] font-medium bg-[var(--dev-accent)]/10'
                                : 'text-[var(--dev-text-muted)] hover:text-[var(--dev-text)] hover:bg-[var(--dev-surface-hover)]'
                              }
                            `}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ x: 4 }}
                            tabIndex={0}
                            role="tab"
                            aria-selected={isActive}
                          >
                            {section.icon}
                            <span>{section.label}</span>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>
        </div>
      </motion.aside>
    </>
  );
}
