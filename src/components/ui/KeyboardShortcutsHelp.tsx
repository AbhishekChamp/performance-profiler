import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardShortcuts, formatShortcut, KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  // Register shortcut to open/close help
  useKeyboardShortcuts({
    onShowHelp: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    enabled: true,
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-dev-border bg-dev-surface text-dev-text-muted hover:bg-dev-hover hover:text-dev-text transition-all"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (?)?"
      >
        <Keyboard size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dev-surface rounded-xl shadow-2xl z-[101] min-w-[400px] max-w-[90vw] max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-dev-border">
                <h2 className="m-0 text-lg font-semibold text-dev-text">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-dev-hover text-dev-text-muted hover:text-dev-text transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="flex flex-col gap-3">
                  {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <kbd className="inline-flex items-center justify-center min-w-[100px] px-3 py-1.5 bg-dev-bg border border-dev-border rounded-md font-mono text-xs font-semibold text-dev-text whitespace-nowrap">
                        {formatShortcut(shortcut)}
                      </kbd>
                      <span className="flex-1 text-sm text-dev-text-subtle">{shortcut.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-3 bg-dev-bg border-t border-dev-border text-xs text-dev-text-muted text-center">
                <p>Press <kbd className="inline-flex items-center justify-center px-2 py-0.5 bg-dev-surface border border-dev-border rounded font-mono text-xs font-semibold">?</kbd> anytime to show this help</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
