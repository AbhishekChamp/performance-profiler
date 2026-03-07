import { createRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FileUpload } from '@/components/upload/FileUpload';
import { Sidebar } from '@/components/layout/Sidebar';
import { OverviewSection } from '@/components/report/OverviewSection';
import { BundleSection } from '@/components/report/BundleSection';
import { DOMSection } from '@/components/report/DOMSection';
import { CSSSection } from '@/components/report/CSSSection';
import { AssetsSection } from '@/components/report/AssetsSection';
import { JavaScriptSection } from '@/components/report/JavaScriptSection';
import { ReactSection } from '@/components/report/ReactSection';
import { TimelineSection } from '@/components/report/TimelineSection';
import { RisksSection } from '@/components/report/RisksSection';
import type { AnalysisSection } from '@/components/layout/types';
import { Activity, Loader2 } from 'lucide-react';
import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexComponent,
});

function IndexComponent() {
  const [activeSection, setActiveSection] = useState<AnalysisSection>('overview');
  const { files, clearFiles } = useFileUpload();
  const { isAnalyzing, progress, run } = useAnalysis();
  const { currentReport } = useAnalysisStore();

  const handleFilesSelected = () => {
    // Files are already tracked in the hook
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    await run(files);
    clearFiles();
  };

  const renderContent = () => {
    if (isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 relative mb-4">
            <div className="absolute inset-0 border-4 border-dev-border rounded-full" />
            <div 
              className="absolute inset-0 border-4 border-dev-accent rounded-full border-t-transparent animate-spin"
            />
            <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-dev-accent animate-spin" />
          </div>
          <h3 className="text-lg font-medium text-dev-text mb-2">
            Analyzing Performance
          </h3>
          {progress && (
            <>
              <p className="text-sm text-dev-text-muted mb-4">{progress.message}</p>
              <div className="w-64 h-2 bg-dev-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-dev-accent transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <p className="text-xs text-dev-text-subtle mt-2">{progress.progress}%</p>
            </>
          )}
        </div>
      );
    }

    if (!currentReport) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-dev-accent/20 to-dev-accent/5 rounded-2xl flex items-center justify-center border border-dev-accent/20">
                <Activity className="w-10 h-10 text-dev-accent" />
              </div>
              <h2 className="text-2xl font-semibold text-dev-text mb-2">
                Frontend Performance Profiler
              </h2>
              <p className="text-dev-text-muted max-w-md mx-auto">
                Analyze your HTML, JavaScript bundles, and React builds to detect performance 
                issues and generate actionable optimization recommendations.
              </p>
            </div>
            <FileUpload 
              onFilesSelected={handleFilesSelected} 
              onAnalyze={handleAnalyze}
            />
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return <OverviewSection report={currentReport} />;
      case 'bundle':
        return currentReport.bundle ? <BundleSection bundle={currentReport.bundle} /> : <NoData section="Bundle" />;
      case 'dom':
        return currentReport.dom ? <DOMSection dom={currentReport.dom} /> : <NoData section="DOM" />;
      case 'css':
        return currentReport.css ? <CSSSection css={currentReport.css} /> : <NoData section="CSS" />;
      case 'assets':
        return currentReport.assets ? <AssetsSection assets={currentReport.assets} /> : <NoData section="Assets" />;
      case 'javascript':
        return currentReport.javascript && currentReport.javascript.length > 0 
          ? <JavaScriptSection js={currentReport.javascript} /> 
          : <NoData section="JavaScript" />;
      case 'react':
        return currentReport.react ? <ReactSection react={currentReport.react} /> : <NoData section="React" />;
      case 'timeline':
        return <TimelineSection timeline={currentReport.timeline} />;
      case 'risks':
        return <RisksSection risk={currentReport.renderRisk} optimizations={currentReport.summary.optimizations} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {currentReport && !isAnalyzing && (
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          hasReport={!!currentReport}
        />
      )}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function NoData({ section }: { section: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-dev-text-muted mb-2">No {section} data available</p>
      <p className="text-sm text-dev-text-subtle">
        Upload {section.toLowerCase()} files to see analysis
      </p>
    </div>
  );
}
