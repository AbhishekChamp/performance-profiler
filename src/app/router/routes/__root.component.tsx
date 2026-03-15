import { Outlet } from '@tanstack/react-router';
import { Header } from '@/components/layout/Header';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useThemeStore } from '@/stores/themeStore';
import { useCallback, useEffect, useRef } from 'react';
import { useConfirm } from '@/hooks/useConfirm';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePWA } from '@/hooks/usePWA';
import toast from 'react-hot-toast';

export function RootComponent(): React.JSX.Element {
  const { currentReport, reset } = useAnalysisStore();
  const { toggleMode, mode } = useThemeStore();
  const { confirm, dialog } = useConfirm();
  const mainRef = useRef<HTMLDivElement>(null);

  // Initialize PWA functionality
  usePWA();

  const handleExport = useCallback(() => {
    if (!currentReport) return;
    
    const data = JSON.stringify(currentReport, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${currentReport.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentReport]);

  const handleClear = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Clear Analysis?',
      message: 'Are you sure you want to clear the current analysis? This action cannot be undone.',
      confirmLabel: 'Clear Analysis',
      cancelLabel: 'Keep Analysis',
      type: 'warning',
    });
    
    if (confirmed) {
      reset();
    }
  }, [confirm, reset]);

  // Handle theme toggle with keyboard shortcut
  const handleCycleTheme = useCallback(() => {
    toggleMode();
    
    // Get the new mode after toggle - now simple dark <-> light
    const newMode = mode === 'dark' ? 'light' : 'dark';
    const messages = {
      dark: 'Dark theme enabled 🌙',
      light: 'Light theme enabled ☀️',
    };
    
    toast.success(messages[newMode], { duration: 1500 });
  }, [toggleMode, mode]);

  // Register global keyboard shortcuts
  useKeyboardShortcuts({
    onCycleTheme: handleCycleTheme,
    onExport: handleExport,
    enabled: true,
  });

  // Announce page changes to screen readers
  useEffect(() => {
    const announcePageLoad = (): void => {
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = 'Frontend Performance Profiler loaded';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    };

    announcePageLoad();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-dev-bg">
      <SkipToContent />
      <Header onExport={handleExport} onClear={handleClear} />
      <div 
        ref={mainRef}
        id="main-content"
        className="flex-1 overflow-hidden flex"
        role="main"
        tabIndex={-1}
      >
        <Outlet />
      </div>
      {dialog}
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
