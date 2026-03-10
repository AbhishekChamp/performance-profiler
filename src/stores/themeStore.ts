import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { get, set } from 'idb-keyval';
import type { ThemeMode } from '@/types';

interface ThemeState {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  isTransitioning: boolean;
  
  // Actions
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  cycleMode: () => void;
  resolveTheme: () => void;
  setTransitioning: (isTransitioning: boolean) => void;
}

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Add transition class before theme change
  root.classList.add('theme-transitioning');
  
  if (mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  
  // Remove transition class after animation completes
  setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 350);
}

// Custom storage using idb-keyval for IndexedDB
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await set(name, undefined);
  },
};

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        mode: 'system',
        resolvedMode: 'dark',
        isTransitioning: false,

        setMode: (mode) => {
          const resolvedMode = mode === 'system' ? getSystemTheme() : mode;
          applyTheme(resolvedMode);
          set({ mode, resolvedMode, isTransitioning: true });
          
          // Reset transitioning state after animation
          setTimeout(() => {
            set({ isTransitioning: false });
          }, 350);
        },

        toggleMode: () => {
          const { mode } = get();
          let newMode: ThemeMode;
          
          // Cycle: dark -> light -> system -> dark
          if (mode === 'dark') {
            newMode = 'light';
          } else if (mode === 'light') {
            newMode = 'system';
          } else {
            newMode = 'dark';
          }
          
          const resolvedMode = newMode === 'system' ? getSystemTheme() : newMode;
          applyTheme(resolvedMode);
          set({ mode: newMode, resolvedMode, isTransitioning: true });
          
          setTimeout(() => {
            set({ isTransitioning: false });
          }, 350);
        },

        cycleMode: () => {
          get().toggleMode();
        },

        resolveTheme: () => {
          const { mode } = get();
          const resolvedMode = mode === 'system' ? getSystemTheme() : mode;
          applyTheme(resolvedMode);
          set({ resolvedMode });
        },

        setTransitioning: (isTransitioning) => set({ isTransitioning }),
      }),
      {
        name: 'ThemeStore',
        storage: idbStorage as never,
        partialize: (state) => ({ 
          mode: state.mode,
          resolvedMode: state.resolvedMode 
        }),
        onRehydrateStorage: () => (state) => {
          // Apply theme when store is rehydrated
          if (state) {
            const resolvedMode = state.mode === 'system' ? getSystemTheme() : state.mode;
            applyTheme(resolvedMode);
            state.resolvedMode = resolvedMode;
          }
        },
      }
    ),
    { name: 'ThemeStore' }
  )
);

// Listen for system theme changes
function handleSystemThemeChange(e: MediaQueryListEvent) {
  const store = useThemeStore.getState();
  if (store.mode === 'system') {
    const newMode = e.matches ? 'dark' : 'light';
    applyTheme(newMode);
    useThemeStore.setState({ resolvedMode: newMode });
  }
}

if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', handleSystemThemeChange);
}

// Initialize theme on load (for SSR compatibility)
if (typeof document !== 'undefined') {
  // Check for saved preference or system preference
  const initTheme = async () => {
    try {
      const saved = await get('ThemeStore');
      if (saved) {
        const state = JSON.parse(saved);
        const mode = state.state?.mode || 'system';
        const resolvedMode = mode === 'system' ? getSystemTheme() : mode;
        applyTheme(resolvedMode);
      } else {
        // First visit - use system preference
        const systemTheme = getSystemTheme();
        applyTheme(systemTheme);
      }
    } catch {
      // Fallback to dark theme
      applyTheme('dark');
    }
  };
  initTheme();
}

// Selectors
export const selectThemeMode = (state: ThemeState) => state.mode;
export const selectResolvedTheme = (state: ThemeState) => state.resolvedMode;
export const selectIsTransitioning = (state: ThemeState) => state.isTransitioning;
