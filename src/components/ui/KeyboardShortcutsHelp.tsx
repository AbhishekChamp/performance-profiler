import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Keyboard, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  KEYBOARD_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  type ShortcutCategory,
  formatShortcut,
  useFocusTrap,
  useKeyboardShortcuts,
} from '@/hooks/useKeyboardShortcuts';

// Group shortcuts by category
const groupShortcutsByCategory = (): Record<ShortcutCategory, typeof KEYBOARD_SHORTCUTS> => {
  const groups: Record<ShortcutCategory, typeof KEYBOARD_SHORTCUTS> = {
    navigation: [],
    analysis: [],
    view: [],
    export: [],
    general: [],
  };

  KEYBOARD_SHORTCUTS.forEach((shortcut) => {
    if (shortcut.hidden !== true) {
      groups[shortcut.category].push(shortcut);
    }
  });

  return groups;
};

export function KeyboardShortcutsHelp(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<ShortcutCategory>>(
    () => new Set(Object.keys(SHORTCUT_CATEGORIES) as ShortcutCategory[])
  );
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap for accessibility
  useFocusTrap(isOpen, modalRef);

  // Register shortcut to open/close help
  useKeyboardShortcuts({
    onShowHelp: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    enabled: true,
  });

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const toggleCategory = (category: ShortcutCategory): void => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const shortcutGroups = groupShortcutsByCategory();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-dev-border bg-dev-surface text-dev-text-muted hover:bg-dev-hover hover:text-dev-text transition-all focus:outline-none focus:ring-2 focus:ring-dev-accent/50"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (Shift + ?)"
      >
        <Keyboard size={18} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-100"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="keyboard-shortcuts-title"
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dev-surface rounded-xl shadow-2xl z-101 w-full max-w-lg max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-dev-border">
                <h2 
                  id="keyboard-shortcuts-title" 
                  className="m-0 text-lg font-semibold text-dev-text"
                >
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-dev-hover text-dev-text-muted hover:text-dev-text transition-colors focus:outline-none focus:ring-2 focus:ring-dev-accent/50"
                  aria-label="Close keyboard shortcuts"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <p className="text-sm text-dev-text-subtle mb-4">
                  Press the highlighted keys to quickly navigate and control the application.
                </p>

                <div className="space-y-2">
                  {(Object.keys(SHORTCUT_CATEGORIES) as ShortcutCategory[])
                    .sort((a, b) => SHORTCUT_CATEGORIES[a].order - SHORTCUT_CATEGORIES[b].order)
                    .map((category) => {
                      const shortcuts = shortcutGroups[category];
                      if (shortcuts.length === 0) return null;

                      const isExpanded = expandedCategories.has(category);
                      const categoryInfo = SHORTCUT_CATEGORIES[category];

                      return (
                        <div key={category} className="border border-dev-border rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-dev-bg hover:bg-dev-surface-hover transition-colors text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-dev-accent/30"
                            aria-expanded={isExpanded}
                            aria-controls={`category-${category}`}
                          >
                            <span className="font-medium text-dev-text">{categoryInfo.label}</span>
                            {isExpanded ? (
                              <ChevronUp size={16} className="text-dev-text-muted" aria-hidden="true" />
                            ) : (
                              <ChevronDown size={16} className="text-dev-text-muted" aria-hidden="true" />
                            )}
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                id={`category-${category}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-2 space-y-1">
                                  {shortcuts.map((shortcut, index) => (
                                    <div 
                                      key={index} 
                                      className="flex items-center gap-4 px-3 py-2 rounded-md hover:bg-dev-surface-hover transition-colors"
                                    >
                                      <kbd className="inline-flex items-center justify-center min-w-24 px-2 py-1.5 bg-dev-bg border border-dev-border rounded-md font-mono text-xs font-semibold text-dev-text whitespace-nowrap">
                                        {formatShortcut(shortcut)}
                                      </kbd>
                                      <span className="flex-1 text-sm text-dev-text-subtle">
                                        {shortcut.description}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>

                {/* Quick tip */}
                <div className="mt-4 p-3 bg-dev-accent/5 border border-dev-accent/20 rounded-lg">
                  <p className="text-sm text-dev-text-muted">
                    <strong className="text-dev-accent">Pro tip:</strong> Use number keys{' '}
                    <kbd className="px-1.5 py-0.5 bg-dev-surface border border-dev-border rounded text-xs">1</kbd>
                    {'-'}
                    <kbd className="px-1.5 py-0.5 bg-dev-surface border border-dev-border rounded text-xs">9</kbd>
                    {' and '}
                    <kbd className="px-1.5 py-0.5 bg-dev-surface border border-dev-border rounded text-xs">0</kbd>
                    {' to jump directly to sections.'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-dev-bg border-t border-dev-border text-xs text-dev-text-muted text-center">
                <p>
                  Press{' '}
                  <kbd className="inline-flex items-center justify-center px-2 py-0.5 bg-dev-surface border border-dev-border rounded font-mono text-xs font-semibold">
                    Shift
                  </kbd>
                  {' + '}
                  <kbd className="inline-flex items-center justify-center px-2 py-0.5 bg-dev-surface border border-dev-border rounded font-mono text-xs font-semibold">
                    ?
                  </kbd>
                  {' anytime to show this help'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
