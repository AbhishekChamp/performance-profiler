import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import toast from 'react-hot-toast';
import { useCallback, useEffect, useState } from 'react';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

type ThemeOption = {
  mode: 'dark' | 'light' | 'system';
  label: string;
  icon: typeof Sun;
  description: string;
};

const themeOptions: ThemeOption[] = [
  { mode: 'light', label: 'Light', icon: Sun, description: 'Always use light theme' },
  { mode: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark theme' },
  { mode: 'system', label: 'System', icon: Monitor, description: 'Follow system preference' },
];

export function ThemeToggle({ size = 'md', showLabel = false, className = '' }: ThemeToggleProps) {
  const { mode, resolvedMode, setMode } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleModeChange = useCallback((newMode: 'dark' | 'light' | 'system') => {
    setMode(newMode);
    setIsOpen(false);
    
    const messages = {
      dark: 'Dark theme enabled 🌙',
      light: 'Light theme enabled ☀️',
      system: 'Using system theme preference 🖥️',
    };
    
    try {
      toast.success(messages[newMode], { duration: 2000 });
    } catch (e) {
      console.error('Failed to show toast:', e);
    }
  }, [setMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.theme-toggle-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const currentOption = themeOptions.find(opt => opt.mode === mode) || themeOptions[1];
  const CurrentIcon = currentOption.icon;

  const iconSizes = { sm: 14, md: 18, lg: 22 };
  const buttonSizes = { 
    sm: 'h-8 text-xs', 
    md: 'h-9 text-sm', 
    lg: 'h-10 text-base' 
  };
  const iconSize = iconSizes[size];
  const buttonSize = buttonSizes[size];

  return (
    <div className={`theme-toggle-dropdown relative inline-block ${className}`}>
      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${buttonSize}
          flex items-center gap-2 px-3 rounded-lg
          border border-dev-border bg-dev-surface
          text-dev-text-muted hover:text-dev-text
          hover:bg-dev-surface-hover
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-dev-accent/30
          ${isOpen ? 'ring-2 ring-dev-accent/30' : ''}
        `}
        aria-label="Change theme"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <CurrentIcon size={iconSize} />
        {showLabel && (
          <span className="font-medium">
            {currentOption.label}
            {mode === 'system' && (
              <span className="ml-1.5 text-xs opacity-60">
                ({resolvedMode})
              </span>
            )}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute right-0 top-full mt-2 z-50
            w-56 rounded-xl
            border border-dev-border bg-dev-surface
            shadow-xl shadow-black/20
            animate-fade-in
          "
          role="listbox"
          aria-label="Select theme"
        >
          <div className="p-2 space-y-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = mode === option.mode;
              
              return (
                <button
                  key={option.mode}
                  onClick={() => handleModeChange(option.mode)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-dev-accent/10 text-dev-accent' 
                      : 'text-dev-text-muted hover:bg-dev-surface-hover hover:text-dev-text'
                    }
                  `}
                  role="option"
                  aria-selected={isActive}
                >
                  <Icon size={18} />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className={`text-xs ${isActive ? 'text-dev-accent/70' : 'text-dev-text-subtle'}`}>
                      {option.description}
                    </div>
                  </div>
                  {isActive && (
                    <Check size={16} className="text-dev-accent" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Keyboard hint */}
          <div className="px-3 py-2 border-t border-dev-border text-xs text-dev-text-subtle">
            <kbd className="px-1.5 py-0.5 bg-dev-border rounded text-dev-text-muted">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
            </kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 bg-dev-border rounded text-dev-text-muted">
              Shift
            </kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 bg-dev-border rounded text-dev-text-muted">
              L
            </kbd>
            {' to toggle'}
          </div>
        </div>
      )}
    </div>
  );
}

/* 
 * Simple toggle for compact spaces (cycles through modes)
 * Use this in headers or constrained spaces
 */
export function ThemeToggleSimple({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { resolvedMode, toggleMode } = useThemeStore();
  const isDark = resolvedMode === 'dark';

  const iconSizes = { sm: 16, md: 20, lg: 24 };
  const buttonSizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const iconSize = iconSizes[size];
  const buttonSize = buttonSizes[size];

  return (
    <button
      onClick={toggleMode}
      className={`
        ${buttonSize}
        flex items-center justify-center
        rounded-lg border border-dev-border
        bg-dev-surface text-dev-text-muted
        hover:bg-dev-surface-hover hover:text-dev-text
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-dev-accent/30
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Moon size={iconSize} /> : <Sun size={iconSize} />}
    </button>
  );
}

/*
 * Segmented control variant for settings panels
 * Shows all three options side by side
 */
export function ThemeToggleSegmented({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { mode, resolvedMode, setMode } = useThemeStore();

  const iconSizes = { sm: 14, md: 16, lg: 18 };
  const containerSizes = { 
    sm: 'p-0.5 rounded-lg', 
    md: 'p-1 rounded-xl', 
    lg: 'p-1.5 rounded-xl' 
  };
  const buttonSizes = { 
    sm: 'px-2 py-1.5 rounded text-xs', 
    md: 'px-3 py-2 rounded-lg text-sm', 
    lg: 'px-4 py-2.5 rounded-lg text-base' 
  };
  
  const iconSize = iconSizes[size];
  const containerSize = containerSizes[size];
  const buttonSize = buttonSizes[size];

  return (
    <div 
      className={`
        inline-flex items-center gap-1
        bg-dev-surface border border-dev-border
        ${containerSize}
        ${className}
      `}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = mode === option.mode;
        
        return (
          <button
            key={option.mode}
            onClick={() => setMode(option.mode)}
            className={`
              ${buttonSize}
              flex items-center gap-2
              font-medium transition-all duration-200
              ${isActive 
                ? 'bg-dev-accent text-white shadow-sm' 
                : 'text-dev-text-muted hover:text-dev-text hover:bg-dev-surface-hover'
              }
            `}
            role="radio"
            aria-checked={isActive}
          >
            <Icon size={iconSize} />
            <span>{option.label}</span>
            {option.mode === 'system' && mode === 'system' && (
              <span className="text-xs opacity-70">
                ({resolvedMode === 'dark' ? 'Dark' : 'Light'})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
