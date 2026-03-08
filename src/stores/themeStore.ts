import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ThemeMode } from '@/types';

interface ThemeState {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  
  // Actions
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  resolveTheme: () => void;
}

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        mode: 'system',
        resolvedMode: 'dark',

        setMode: (mode) => {
          const resolvedMode = mode === 'system' ? getSystemTheme() : mode;
          applyTheme(resolvedMode);
          set({ mode, resolvedMode });
        },

        toggleMode: () => {
          const currentMode = get().mode;
          let newMode: ThemeMode;
          
          if (currentMode === 'system') {
            newMode = get().resolvedMode === 'dark' ? 'light' : 'dark';
          } else if (currentMode === 'dark') {
            newMode = 'light';
          } else {
            newMode = 'system';
          }
          
          const resolvedMode = newMode === 'system' ? getSystemTheme() : newMode;
          applyTheme(resolvedMode);
          set({ mode: newMode, resolvedMode });
        },

        resolveTheme: () => {
          const { mode } = get();
          const resolvedMode = mode === 'system' ? getSystemTheme() : mode;
          applyTheme(resolvedMode);
          set({ resolvedMode });
        },
      }),
      {
        name: 'ThemeStore',
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
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const store = useThemeStore.getState();
    if (store.mode === 'system') {
      const newMode = e.matches ? 'dark' : 'light';
      applyTheme(newMode);
      useThemeStore.setState({ resolvedMode: newMode });
    }
  });
}

// Selectors
export const selectThemeMode = (state: ThemeState) => state.mode;
export const selectResolvedTheme = (state: ThemeState) => state.resolvedMode;
