import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function RippleButton({ children, onClick, className = '', disabled }: RippleButtonProps): React.ReactNode {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (disabled === true) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples((prev) => [...prev, { x, y, id }]);
    
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
    
    onClick?.();
  };

  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
          initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.5 }}
          animate={{ 
            width: 200, 
            height: 200, 
            x: -100, 
            y: -100, 
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </motion.button>
  );
}

interface AnimatedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function AnimatedToggle({ checked, onChange, label }: AnimatedToggleProps): React.ReactNode {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <motion.div
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-dev-accent' : 'bg-dev-border'
        }`}
        onClick={() => onChange(!checked)}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
          initial={false}
          animate={{
            left: checked ? 'calc(100% - 20px)' : '4px',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.div>
      {label !== undefined && label !== '' && <span className="text-sm text-dev-text">{label}</span>}
    </label>
  );
}

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function AnimatedCheckbox({ checked, onChange, label }: AnimatedCheckboxProps): React.ReactNode {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <motion.div
        className={`relative w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked 
            ? 'bg-dev-accent border-dev-accent' 
            : 'border-dev-border group-hover:border-dev-accent/50'
        }`}
        onClick={() => onChange(!checked)}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence>
          {checked && (
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>
      {label !== undefined && label !== '' && <span className="text-sm text-dev-text">{label}</span>}
    </label>
  );
}

interface ToastAnimationProps {
  children: React.ReactNode;
  isVisible: boolean;
  onClose: () => void;
}

export function ToastAnimation({ children, isVisible }: ToastAnimationProps): React.ReactNode {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-4 right-4 z-50"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ModalAnimationProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function ModalAnimation({ children, isOpen, onClose }: ModalAnimationProps): React.ReactNode {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="pointer-events-auto"
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

export function Skeleton({ className = '', shimmer = true }: SkeletonProps): React.ReactNode {
  return (
    <div className={`relative overflow-hidden bg-dev-surface rounded ${className}`}>
      {shimmer && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingSpinner({ size = 'md', color = 'var(--dev-accent)' }: LoadingSpinnerProps): React.ReactNode {
  const sizes = { sm: 16, md: 24, lg: 32 };
  
  return (
    <motion.svg
      width={sizes[size]}
      height={sizes[size]}
      viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="31.416"
        strokeDashoffset="10"
      />
    </motion.svg>
  );
}
