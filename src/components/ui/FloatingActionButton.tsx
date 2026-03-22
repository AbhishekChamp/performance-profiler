import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

interface FabAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

interface FloatingActionButtonProps {
  actions: FabAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

const variantColors = {
  default: 'bg-[var(--dev-accent)] hover:bg-[var(--dev-accent)]/90',
  success: 'bg-[var(--dev-success)] hover:bg-[var(--dev-success)]/90',
  warning: 'bg-[var(--dev-warning)] hover:bg-[var(--dev-warning)]/90',
  danger: 'bg-[var(--dev-danger)] hover:bg-[var(--dev-danger)]/90',
};

export function FloatingActionButton({ actions, position = 'bottom-right' }: FloatingActionButtonProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect !== undefined) {
      setRipple({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setTimeout(() => setRipple(null), 600);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleOutsideClick = (): void => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [isOpen]);

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 flex flex-col items-center gap-3`}
      onClick={(e) => e.stopPropagation()}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex flex-col items-center gap-3 mb-2"
          >
            {actions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-full
                  text-white font-medium text-sm
                  shadow-lg hover:shadow-xl
                  transition-shadow
                  ${variantColors[action.variant ?? 'default']}
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {action.icon}
                <span>{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        className={`
          relative w-14 h-14 rounded-full
          bg-[var(--dev-accent)] text-white
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          overflow-hidden
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {ripple !== null && (
          <motion.span
            initial={{ width: 0, height: 0, opacity: 0.5 }}
            animate={{ width: 200, height: 200, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute rounded-full bg-white pointer-events-none"
            style={{
              left: ripple.x - 100,
              top: ripple.y - 100,
            }}
          />
        )}
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
