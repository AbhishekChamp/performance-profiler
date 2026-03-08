import { Outlet } from '@tanstack/react-router';
import { Header } from '@/components/layout/Header';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useCallback } from 'react';
import { useConfirm } from '@/hooks/useConfirm';

export function RootComponent() {
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
    </div>
  );
}
