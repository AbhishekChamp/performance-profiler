import { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  registerItem: (index: number) => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

interface DropdownProps {
  children: React.ReactNode;
  className?: string;
}

export function Dropdown({ children, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const itemCount = useRef(0);

  const registerItem = useCallback(() => {
    const index = itemCount.current;
    itemCount.current += 1;
    return index;
  }, []);

  // Reset active index when closing
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIndex(-1);
    }
  }, [isOpen]);

  return (
    <DropdownContext.Provider
      value={{ isOpen, setIsOpen, activeIndex, setActiveIndex, registerItem }}
    >
      <div className={`relative ${className}`}>{children}</div>
    </DropdownContext.Provider>
  );
}

function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within a Dropdown provider');
  }
  return context;
}

interface DropdownTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownTrigger({ children, className = '' }: DropdownTriggerProps) {
  const { isOpen, setIsOpen } = useDropdown();

  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      onClick={() => setIsOpen(!isOpen)}
      className={`
        flex items-center gap-2 px-4 py-2 bg-dev-surface border border-dev-border 
        rounded-lg text-dev-text hover:border-dev-accent/50 transition-colors
        focus:outline-none focus:ring-2 focus:ring-dev-accent/50
        ${className}
      `}
    >
      {children}
      <ChevronDown
        size={16}
        className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenu({ children, className = '' }: DropdownMenuProps) {
  const { isOpen, setIsOpen, activeIndex, setActiveIndex } = useDropdown();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
      if (!items) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex(Math.min(items.length - 1, activeIndex + 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex(Math.max(0, activeIndex - 1));
          break;
        case 'Home':
          event.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setActiveIndex(items.length - 1);
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          break;
        case 'Enter':
        case ' ':
          if (activeIndex >= 0) {
            event.preventDefault();
            (items[activeIndex] as HTMLElement)?.click();
          }
          break;
      }
    },
    [activeIndex, setActiveIndex, setIsOpen]
  );

  // Focus active item
  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
      (items?.[activeIndex] as HTMLElement)?.focus();
    }
  }, [isOpen, activeIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          role="menu"
          onKeyDown={handleKeyDown}
          className={`
            absolute z-50 mt-2 w-56 bg-dev-surface border border-dev-border 
            rounded-lg shadow-xl overflow-hidden
            ${className}
          `}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  className = '',
}: DropdownItemProps) {
  const { setIsOpen } = useDropdown();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    setIsOpen(false);
  };

  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      tabIndex={-1}
      className={`
        w-full px-4 py-2 text-left text-sm transition-colors
        focus:outline-none focus:bg-dev-accent/10 focus:text-dev-accent
        ${disabled 
          ? 'opacity-50 cursor-not-allowed text-dev-text-muted' 
          : 'text-dev-text hover:bg-dev-surface-hover'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

interface DropdownSeparatorProps {
  className?: string;
}

export function DropdownSeparator({ className = '' }: DropdownSeparatorProps) {
  return <div className={`h-px bg-dev-border my-1 ${className}`} />;
}

interface DropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownLabel({ children, className = '' }: DropdownLabelProps) {
  return (
    <div className={`px-4 py-1.5 text-xs font-medium text-dev-text-muted ${className}`}>
      {children}
    </div>
  );
}
