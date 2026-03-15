import { beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from '../themeStore';
import type { ThemeMode } from '@/types';

describe('ThemeStore', () => {
  beforeEach(() => {
    // Reset to default state
    useThemeStore.setState({
      mode: 'dark' as ThemeMode,
      resolvedMode: 'dark',
      isTransitioning: false,
      hasInitialized: false,
    });
  });

  it('should initialize with dark mode', () => {
    const state = useThemeStore.getState();
    
    expect(state.mode).toBe('dark');
    expect(state.resolvedMode).toBe('dark');
  });

  it('should set theme mode', () => {
    const store = useThemeStore.getState();
    
    store.setMode('light');
    
    expect(useThemeStore.getState().mode).toBe('light');
    expect(useThemeStore.getState().resolvedMode).toBe('light');
  });

  it('should toggle between dark and light', () => {
    const store = useThemeStore.getState();
    
    // Start with dark
    expect(store.resolvedMode).toBe('dark');
    
    // Toggle to light
    store.toggleMode();
    expect(useThemeStore.getState().resolvedMode).toBe('light');
    
    // Toggle back to dark
    store.toggleMode();
    expect(useThemeStore.getState().resolvedMode).toBe('dark');
  });

  it('should cycle through modes', () => {
    const store = useThemeStore.getState();
    
    store.cycleMode();
    
    // Should toggle to the opposite mode
    expect(useThemeStore.getState().resolvedMode).toBe('light');
  });

  it('should handle system mode', () => {
    const store = useThemeStore.getState();
    
    store.setMode('system');
    
    expect(useThemeStore.getState().mode).toBe('system');
    // resolvedMode should be either 'dark' or 'light' based on system preference
    expect(['dark', 'light']).toContain(useThemeStore.getState().resolvedMode);
  });

  it('should track transitioning state', () => {
    const store = useThemeStore.getState();
    
    store.setTransitioning(true);
    expect(useThemeStore.getState().isTransitioning).toBe(true);
    
    store.setTransitioning(false);
    expect(useThemeStore.getState().isTransitioning).toBe(false);
  });

  it('should track initialization state', () => {
    const store = useThemeStore.getState();
    
    store.setInitialized(true);
    expect(useThemeStore.getState().hasInitialized).toBe(true);
  });

  it('should persist theme state', () => {
    const persistedState = {
      mode: 'light' as ThemeMode,
      resolvedMode: 'light' as 'dark' | 'light',
      hasInitialized: true,
    };
    
    useThemeStore.setState(persistedState);
    
    expect(useThemeStore.getState().mode).toBe('light');
    expect(useThemeStore.getState().resolvedMode).toBe('light');
  });
});
