import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import type { ConfirmOptions } from '@/hooks/useConfirm';

interface ConfirmDialogProps {
  isOpen: boolean;
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, options, onConfirm, onCancel }: ConfirmDialogProps): React.JSX.Element | null {
  const {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    type = 'warning',
  } = options;

  const colors = {
    danger: 'from-red-500 to-pink-500 border-red-500/50',
    warning: 'from-amber-500 to-orange-500 border-amber-500/50',
    info: 'from-blue-500 to-cyan-500 border-blue-500/50',
  };

  const buttonColors = {
    danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/25',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25',
    info: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-101 w-full max-w-md"
          >
            <div className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
              {/* Glow Effect */}
              <div
                className={`absolute -inset-px bg-linear-to-r ${colors[type]} opacity-20 blur-xl`}
              />

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className={`w-12 h-12 rounded-xl bg-linear-to-br ${colors[type]} flex items-center justify-center shrink-0`}
                  >
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
                  </div>
                  <button
                    onClick={onCancel}
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={onConfirm}
                    className={`flex-1 px-4 py-3 ${buttonColors[type]} text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
