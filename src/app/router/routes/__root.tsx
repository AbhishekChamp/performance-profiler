import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Header } from '@/components/layout/Header';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { currentReport, reset } = useAnalysisStore();
  const { confirm, dialog } = useConfirm();

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

  return (
    <div className="flex flex-col h-screen bg-dev-bg">
      <Header onExport={handleExport} onClear={handleClear} />
      <Outlet />
      {dialog}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#1a1a2e',
            },
            style: {
              borderLeft: '4px solid #10b981',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1a1a2e',
            },
            style: {
              borderLeft: '4px solid #ef4444',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#1a1a2e',
            },
            style: {
              borderLeft: '4px solid #3b82f6',
            },
          },
        }}
      />
    </div>
  );
}
