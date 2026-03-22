import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeToggleBaseProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeClasses = {
  sm: { button: 'w-10 h-6', icon: 'w-3.5 h-3.5' },
  md: { button: 'w-14 h-8', icon: 'w-5 h-5' },
  lg: { button: 'w-16 h-9', icon: 'w-6 h-6' },
};

export function ThemeToggleSimple({ size = 'md', showLabel = false }: ThemeToggleBaseProps): React.ReactNode {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isLight = document.documentElement.classList.contains('light');
    setIsDark(!isLight);
  }, []);

  const toggleTheme = (): void => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  };

  if (!mounted) return <div className={`${sizeClasses[size].button} rounded-full bg-[var(--dev-surface-hover)]`} />;

  const s = sizeClasses[size];

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${s.button} rounded-full p-1 flex items-center gap-2
        bg-[var(--dev-surface-hover)] hover:bg-[var(--dev-surface)]
        transition-colors
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className={`${s.icon} text-[var(--dev-warning)]`} />
      ) : (
        <Moon className={`${s.icon} text-[var(--dev-accent)]`} />
      )}
      {showLabel && (
        <span className="text-sm text-[var(--dev-text-muted)] pr-2">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}

export function ThemeToggleSegmented(): React.ReactNode {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');
  }, []);

  const setDark = (): void => {
    setTheme('dark');
    document.documentElement.classList.remove('light');
  };

  const setLight = (): void => {
    setTheme('light');
    document.documentElement.classList.add('light');
  };

  return (
    <div className="flex bg-[var(--dev-surface-hover)] rounded-lg p-1">
      <button
        onClick={setDark}
        className={`px-3 py-1 rounded text-sm transition-colors ${
          theme === 'dark' ? 'bg-[var(--dev-accent)] text-white' : 'text-[var(--dev-text-muted)]'
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={setLight}
        className={`px-3 py-1 rounded text-sm transition-colors ${
          theme === 'light' ? 'bg-[var(--dev-accent)] text-white' : 'text-[var(--dev-text-muted)]'
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ThemeToggle({ size = 'md', showLabel = false }: ThemeToggleProps): React.ReactNode {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isLight = document.documentElement.classList.contains('light');
    setIsDark(!isLight);
  }, []);

  const toggleTheme = (): void => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  if (!mounted) {
    return (
      <div className={`${sizeClasses[size].button} rounded-full bg-[var(--dev-surface-hover)]`} />
    );
  }

  const s = sizeClasses[size];
  const knobSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-7 h-7';
  const knobIconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';

  return (
    <div className="flex items-center gap-3">
      <motion.button
        onClick={toggleTheme}
        className={`
          relative ${s.button} rounded-full p-1
          ${isDark ? 'bg-[var(--dev-surface-hover)]' : 'bg-[var(--dev-accent)]'}
          transition-colors duration-300
        `}
        whileTap={{ scale: 0.95 }}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <motion.div
          className={`
            relative ${knobSize} rounded-full shadow-lg
            flex items-center justify-center
            ${isDark ? 'bg-[var(--dev-surface)]' : 'bg-white'}
          `}
          animate={{
            x: isDark ? 0 : size === 'sm' ? 16 : size === 'md' ? 24 : 28,
            rotate: isDark ? 0 : 360,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        >
          {isDark ? (
            <Moon className={`${knobIconSize} text-[var(--dev-accent)]`} />
          ) : (
            <Sun className={`${knobIconSize} text-[var(--dev-warning)]`} />
          )}
        </motion.div>
      </motion.button>

      {showLabel && (
        <span className="text-sm text-[var(--dev-text-muted)]">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </div>
  );
}
