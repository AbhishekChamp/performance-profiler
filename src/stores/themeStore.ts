import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { get, set } from 'idb-keyval';
import type { ThemeMode } from '@/types';

interface ThemeState {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  isTransitioning: boolean;
  hasInitialized: boolean;
  
  // Actions
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  cycleMode: () => void;
  resolveTheme: () => void;
  setTransitioning: (isTransitioning: boolean) => void;
  setInitialized: (initialized: boolean) => void;
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
  
  // Update theme-color meta tag for mobile browsers
  const metaThemeColor = document.getElementById('theme-color-meta') as HTMLMetaElement | null;
  if (metaThemeColor) {
    metaThemeColor.content = mode === 'dark' ? '#0d1117' : '#ffffff';
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
        mode: 'dark',
        resolvedMode: 'dark',
        isTransitioning: false,
        hasInitialized: false,

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
          const { resolvedMode } = get();
          // Simple toggle: dark <-> light
          const newMode = resolvedMode === 'dark' ? 'light' : 'dark';
          
          applyTheme(newMode);
          set({ mode: newMode, resolvedMode: newMode, isTransitioning: true });
          
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
        
        setInitialized: (hasInitialized) => set({ hasInitialized }),
      }),
      {
        name: 'ThemeStore',
        storage: idbStorage as never,
        partialize: (state) => ({ 
          mode: state.mode,
          resolvedMode: state.resolvedMode,
          hasInitialized: state.hasInitialized,
        }),
        onRehydrateStorage: () => (state) => {
          // Apply theme when store is rehydrated
          if (state) {
            applyTheme(state.resolvedMode);
          }
        },
      }
    ),
    { name: 'ThemeStore' }
  )
);

// Initialize theme on load (for SSR compatibility)
if (typeof document !== 'undefined') {
  const initTheme = async () => {
    try {
      const saved = await get('ThemeStore');
      if (saved) {
        const state = JSON.parse(saved);
        // If already initialized before, use saved mode
        const mode = state.state?.mode || 'dark';
        applyTheme(mode);
      } else {
        // First visit - use system preference and save it
        const systemTheme = getSystemTheme();
        applyTheme(systemTheme);
        // Save the system-detected theme as the initial mode
        useThemeStore.setState({ 
          mode: systemTheme, 
          resolvedMode: systemTheme, 
          hasInitialized: true 
        });
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
