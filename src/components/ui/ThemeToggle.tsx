import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import toast from 'react-hot-toast';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ThemeToggle({ size = 'md', showLabel = false }: ThemeToggleProps) {
  const { resolvedMode, mode, setMode, toggleMode } = useThemeStore();

  const isDark = resolvedMode === 'dark';
  const isSystemPreference = mode === 'system';

  const handleToggle = () => {
    toggleMode();
    const newMode = !isDark ? 'Dark' : 'Light';
    toast.success(`${newMode} mode enabled`, {
      icon: !isDark ? '🌙' : '☀️',
      duration: 2000,
    });
  };

  const handleSystemPreference = () => {
    setMode('system');
    toast.success('Using system theme preference', {
      icon: '🖥️',
      duration: 2000,
    });
  };

  const iconSizes = { sm: 16, md: 20, lg: 24 };
  const buttonSizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const iconSize = iconSizes[size];
  const buttonSize = buttonSizes[size];

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        className={`${buttonSize} flex items-center justify-center gap-2 rounded-lg border border-dev-border bg-dev-surface text-dev-text-muted hover:bg-dev-hover hover:text-dev-text transition-all`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Moon size={iconSize} /> : <Sun size={iconSize} />}
        {showLabel && <span className="text-sm font-medium">{isDark ? 'Dark' : 'Light'}</span>}
      </button>

      <button
        onClick={handleSystemPreference}
        className={`${buttonSize} flex items-center justify-center rounded-lg border border-dev-border bg-dev-surface text-dev-text-muted hover:bg-dev-hover hover:text-dev-text transition-all ${
          isSystemPreference ? 'bg-dev-accent/10 border-dev-accent text-dev-accent' : 'opacity-60'
        }`}
        aria-label="Use system preference"
        title="Use system preference"
      >
        <Monitor size={iconSize} />
      </button>
    </div>
  );
}

export function ThemeToggleSimple({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { resolvedMode, toggleMode } = useThemeStore();
  const isDark = resolvedMode === 'dark';

  const iconSizes = { sm: 16, md: 20, lg: 24 };
  const buttonSizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const iconSize = iconSizes[size];
  const buttonSize = buttonSizes[size];

  return (
    <button
      onClick={toggleMode}
      className={`${buttonSize} flex items-center justify-center rounded-lg border border-dev-border bg-dev-surface text-dev-text-muted hover:bg-dev-hover hover:text-dev-text transition-all`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Moon size={iconSize} /> : <Sun size={iconSize} />}
    </button>
  );
}
