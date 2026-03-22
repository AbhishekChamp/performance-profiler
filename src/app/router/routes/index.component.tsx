import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Sidebar } from '@/components/layout/Sidebar';
import { getNextSection, getPreviousSection, getSectionByIndex } from '@/components/layout/sidebarData';
import { OverviewSection } from '@/components/report/OverviewSection';
import { BundleSection } from '@/components/report/BundleSection';
import { DOMSection } from '@/components/report/DOMSection';
import { CSSSection } from '@/components/report/CSSSection';
import { AssetsSection } from '@/components/report/AssetsSection';
import { JavaScriptSection } from '@/components/report/JavaScriptSection';

import { TimelineSection } from '@/components/report/TimelineSection';
import { RisksSection } from '@/components/report/RisksSection';
import { WebVitalsSection } from '@/components/report/WebVitalsSection';
import { NetworkSection } from '@/components/report/NetworkSection';
import { ImagesSection } from '@/components/report/ImagesSection';
import { FontsSection } from '@/components/report/FontsSection';
import { AccessibilitySection as A11ySection } from '@/components/report/AccessibilitySection';
import { SEOSection } from '@/components/report/SEOSection';
import { TypeScriptSection } from '@/components/report/TypeScriptSection';
import { SecuritySection } from '@/components/report/SecuritySection';
import { ThirdPartySection } from '@/components/report/ThirdPartySection';
import { MemorySection } from '@/components/report/MemorySection';
import { ImportsSection } from '@/components/report/ImportsSection';
import { BudgetSettings } from '@/components/settings/BudgetSettings';
import { ReportComparison } from '@/components/compare/ReportComparison';
import { TemplateSelector } from '@/components/templates';
import { TrendDashboard } from '@/components/trends/TrendDashboard';
import { GraphSection } from '@/components/graph';
import { CICDConfigGenerator } from '@/components/cicd';
import { CodePlayground } from '@/components/playground';
import { WaterfallSection } from '@/components/report/WaterfallSection';
import { ESLintSection } from '@/components/report/ESLintSection';
import { CreateProjectDialog, ProjectDetail, ProjectsList } from '@/components/projects';
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary';
import type { AnalysisSection } from '@/components/layout/types';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Code2,
  Cpu,
  Folder,
  Gauge,
  Layers,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemeToggleSimple } from '@/components/ui/ThemeToggle';

// Static background - no animations to prevent memory issues
function StaticBackground(): React.ReactNode {
  return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-30"
      style={{ 
        zIndex: 0,
        background: 'radial-gradient(ellipse at 30% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
      }}
    />
  );
}

// Modern Feature Card with hover effects
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}): React.ReactNode {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group"
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg ${gradient}`}
      />

      <div className="relative h-full bg-(--dev-surface)/60 backdrop-blur-xl rounded-2xl p-6 border border-(--dev-border)/50 group-hover:border-(--dev-border) transition-all duration-300 overflow-hidden">
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`}
          style={{ opacity: 0.05 }}
        />

        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
            transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
            transition: 'transform 0.7s ease-out',
          }}
        />

        <div className="relative">
          <div
            className={`w-12 h-12 rounded-xl ${gradient} p-[1px] mb-4 group-hover:scale-110 transition-transform duration-300`}
          >
            <div className="w-full h-full rounded-xl bg-(--dev-surface) flex items-center justify-center">
              <Icon className="w-6 h-6 text-(--dev-text)" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-(--dev-text) mb-2 group-hover:text-(--dev-accent) transition-colors">
            {title}
          </h3>
          <p className="text-sm text-(--dev-text-muted) leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// Animated Counter using requestAnimationFrame
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }): React.ReactNode {
  const [displayValue, setDisplayValue] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startValue + (value - startValue) * easeOutQuart);
      
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value]);

  return (
    <span className="font-mono font-bold text-2xl text-(--dev-text)">
      {displayValue}
      {suffix}
    </span>
  );
}

// Stats Bar
function StatsBar(): React.ReactNode {
  const stats = [
    { icon: Gauge, value: 16, suffix: '+', label: 'Analyzers' },
    { icon: Layers, value: 50, suffix: '+', label: 'Metrics' },
    { icon: Cpu, value: 100, suffix: '%', label: 'Client-side' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-8 mt-10">
      {stats.map(({ icon: Icon, value, suffix, label }) => (
        <div
          key={label}
          className="flex items-center gap-3 px-5 py-3 bg-(--dev-surface)/40 backdrop-blur-sm rounded-full border border-(--dev-border)/30"
        >
          <Icon className="w-5 h-5 text-(--dev-accent)" />
          <div className="flex items-baseline gap-1">
            <AnimatedCounter value={value} suffix={suffix} />
            <span className="text-sm text-(--dev-text-muted)">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Modern Hero Section
function HeroSection({ onNavigateToProjects }: { onNavigateToProjects: () => void }): React.ReactNode {
  return (
    <div className="relative text-center mb-8 pt-16">
      <div className="absolute top-4 right-0 z-20">
        <ThemeToggleSimple size="md" />
      </div>

      <div className="relative inline-block mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-32 h-32 border border-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute w-40 h-40 border border-purple-500/10 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        </div>

        <div
          className="relative w-24 h-24 mx-auto"
          style={{
            animation: 'float-gentle 4s ease-in-out infinite',
          }}
        >
          <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/20 flex items-center justify-center">
            <Activity className="w-12 h-12 text-white" />
          </div>

          <div
            className="absolute -top-2 -right-2 w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center shadow-lg"
            style={{ animation: 'float-orbit 6s ease-in-out infinite' }}
          >
            <Zap className="w-4 h-4 text-gray-900" />
          </div>
          <div
            className="absolute -bottom-1 -left-3 w-6 h-6 bg-pink-400 rounded-md flex items-center justify-center shadow-lg"
            style={{ animation: 'float-orbit 8s ease-in-out infinite reverse' }}
          >
            <Sparkles className="w-3 h-3 text-gray-900" />
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          <span className="bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Frontend
          </span>{' '}
          <span className="text-(--dev-text)">Performance</span>
        </h1>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-(--dev-text)">
          Profiler
        </h1>
      </div>

      <p className="text-lg md:text-xl text-(--dev-text-muted) max-w-2xl mx-auto mb-8 leading-relaxed">
        Analyze your application's performance with{' '}
        <span className="text-(--dev-accent) font-medium">
          16 specialized analyzers
        </span>
        . Detect bottlenecks, optimize bundles, and ship faster code.
      </p>

      {/* CTA Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={onNavigateToProjects}
          className="dev-button flex items-center gap-2 text-lg px-8 py-4"
        >
          <Folder className="w-5 h-5" />
          Go to Projects
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <StatsBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12">
        <FeatureCard
          icon={BarChart3}
          title="Performance"
          description="Bundle analysis, Web Vitals metrics, and memory leak detection"
          gradient="bg-linear-to-br from-blue-500 to-cyan-500"
          delay={0}
        />
        <FeatureCard
          icon={Shield}
          title="Security"
          description="XSS vulnerability detection and secrets scanning"
          gradient="bg-linear-to-br from-emerald-500 to-green-500"
          delay={100}
        />
        <FeatureCard
          icon={Code2}
          title="Code Quality"
          description="TypeScript checks, React patterns, and accessibility audits"
          gradient="bg-linear-to-br from-purple-500 to-pink-500"
          delay={200}
        />
        <FeatureCard
          icon={Zap}
          title="Optimization"
          description="Image compression, font optimization, and network hints"
          gradient="bg-linear-to-br from-orange-500 to-red-500"
          delay={300}
        />
      </div>
    </div>
  );
}

// Fun messages to keep users engaged
const FUN_MESSAGES = [
  "Scanning your codebase...",
  "Hunting for performance bottlenecks...",
  "Detecting energy-draining scripts...",
  "Checking for security vulnerabilities...",
  "Crunching bundle size numbers...",
  "Targeting unused CSS selectors...",
  "Preparing optimization rockets...",
  "Calculating your performance score...",
  "Sprinkling optimization magic...",
  "Almost there, finalizing report...",
];

// Simplified Analysis Progress - prevents memory issues
function AnalysisProgress({
  progress,
}: {
  progress: { message: string; progress: number } | null;
}): React.ReactNode {
  const progressValue = progress?.progress ?? 0;

  // Get current message based on progress
  const messageIndex = Math.min(
    Math.floor((progressValue / 100) * FUN_MESSAGES.length),
    FUN_MESSAGES.length - 1
  );

  return (
    <div className="flex flex-col items-center justify-center h-full relative px-4 py-16">
      {/* Simple spinning loader */}
      <div className="relative mb-8">
        {/* Outer ring */}
        <div className="w-24 h-24 rounded-full border-4 border-(--dev-border) border-t-(--dev-accent) animate-spin" />
        
        {/* Inner icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-10 h-10 text-(--dev-accent)" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-(--dev-text) mb-2">
        Analyzing Your Code
      </h3>

      {/* Rotating message */}
      <div className="h-8 flex items-center justify-center mb-8">
        <span className="text-(--dev-text-muted) animate-pulse">
          {FUN_MESSAGES[messageIndex]}
        </span>
      </div>

      {progress && (
        <>
          {/* Simple progress bar */}
          <div className="w-full max-w-md h-2 bg-(--dev-border)/50 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progressValue}%` }}
            />
          </div>

          {/* Progress percentage */}
          <span className="text-3xl font-bold text-(--dev-text)">
            {progressValue}%
          </span>
        </>
      )}
    </div>
  );
}

function NoData({ section }: { section: string }): React.ReactNode {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 rounded-2xl bg-(--dev-surface) flex items-center justify-center mb-4">
        <Activity className="w-8 h-8 text-(--dev-text-subtle)" />
      </div>
      <p className="text-(--dev-text-muted) mb-2">No {section} data available</p>
      <p className="text-sm text-(--dev-text-subtle)">
        Upload {section.toLowerCase()} files to see analysis
      </p>
    </div>
  );
}

type ViewState = 
  | { type: 'home' }
  | { type: 'projects' }
  | { type: 'project'; projectId: string }
  | { type: 'report'; projectId: string; reportId: string };

export function IndexComponent(): React.ReactNode {
  const [activeSection, setActiveSection] = useState<AnalysisSection>('overview');
  const [viewState, setViewState] = useState<ViewState>({ type: 'home' });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { isAnalyzing, progress, error } = useAnalysis();
  const { currentReport } = useAnalysisStore();
  const { createProject, loadProject } = useProjectStore();
  const mainRef = useRef<HTMLElement>(null);

  const handleNextSection = useCallback(() => {
    if (!currentReport) return;
    const next = getNextSection(activeSection);
    if (next) setActiveSection(next);
  }, [activeSection, currentReport]);

  const handlePreviousSection = useCallback(() => {
    if (!currentReport) return;
    const prev = getPreviousSection(activeSection);
    if (prev) setActiveSection(prev);
  }, [activeSection, currentReport]);

  const handleGoToSection = useCallback(
    (index: number) => {
      if (!currentReport) return;
      const section = getSectionByIndex(index);
      if (section) setActiveSection(section);
    },
    [currentReport]
  );

  useKeyboardShortcuts({
    onNextSection: handleNextSection,
    onPreviousSection: handlePreviousSection,
    onGoToSection: handleGoToSection,
    enabled: !!currentReport && !isAnalyzing,
  });

  useEffect(() => {
    if (error !== null && error !== '') {
      toast.error(error, { duration: 5000 });
    }
  }, [error]);

  const handleCreateProject = async (name: string, description?: string): Promise<void> => {
    const id = await createProject(name, description);
    setViewState({ type: 'project', projectId: id });
  };

  const handleOpenProject = (projectId: string): void => {
    loadProject(projectId);
    setViewState({ type: 'project', projectId });
  };

  const handleViewReport = async (reportId: string, projectId?: string): Promise<void> => {
    // Load the project and find the report
    const targetProjectId = projectId ?? (viewState.type === 'project' ? viewState.projectId : undefined);
    if (targetProjectId === undefined) return;
    
    // Load project data
    const project = await useProjectStore.getState().loadProject(targetProjectId);
    if (!project) return;
    
    // Find the specific report
    const report = project.reports.find(r => r.id === reportId);
    if (!report) {
      toast.error('Report not found');
      return;
    }
    
    // Set this as the current report for viewing
    useAnalysisStore.setState({ currentReport: report });
    setViewState({ type: 'report', projectId: targetProjectId, reportId });
  };

  const handleBackFromReport = (): void => {
    // Clear current report when going back
    useAnalysisStore.setState({ currentReport: null });
    if (viewState.type === 'report') {
      setViewState({ type: 'project', projectId: viewState.projectId });
    }
  };

  const handleBackToProjects = (): void => {
    setViewState({ type: 'projects' });
  };

  const renderContent = (): React.ReactNode | null => {
    // Analysis in progress
    if (isAnalyzing) {
      return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-(--dev-bg)">
          <AnalysisProgress progress={progress} />
        </div>
      );
    }

    // Home view with hero section
    if (viewState.type === 'home') {
      return (
        <div className="relative min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-8 bg-(--dev-bg)">
          <StaticBackground />
          <div className="relative z-10 w-full max-w-4xl">
            <HeroSection onNavigateToProjects={() => setViewState({ type: 'projects' })} />
          </div>
        </div>
      );
    }

    // Projects list view
    if (viewState.type === 'projects') {
      return (
        <div className="h-full bg-(--dev-bg)">
          <ProjectsList 
            onCreateProject={() => setShowCreateDialog(true)}
            onOpenProject={handleOpenProject}
          />
          <CreateProjectDialog
            isOpen={showCreateDialog}
            onClose={() => setShowCreateDialog(false)}
            onCreate={handleCreateProject}
          />
        </div>
      );
    }

    // Project detail view
    if (viewState.type === 'project') {
      return (
        <ProjectDetail
          projectId={viewState.projectId}
          onBack={handleBackToProjects}
          onViewReport={handleViewReport}
        />
      );
    }

    // Report view - when viewing a report, currentReport is guaranteed to be set
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (viewState.type === 'report') {
      // Type guard: currentReport must exist for report view
      if (!currentReport) {
        return null;
      }
      const report = currentReport;
      
      return (
        <div className="bg-(--dev-bg)">
          {/* Back button and report info */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-(--dev-border)">
            <button
              onClick={handleBackFromReport}
              className="dev-button-secondary flex items-center gap-2"
            >
              ← Back to Project
            </button>
            <div className="text-right">
              <p className="text-sm text-(--dev-text-muted)">
                Viewing historical report from {new Date(report.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          
          {(() => {
            switch (activeSection) {
              case 'overview':
                return <OverviewSection report={report} />;
              case 'bundle':
                return report.bundle ? (
                  <BundleSection analysis={report.bundle} />
                ) : (
                  <NoData section="Bundle" />
                );
              case 'dom':
                return report.dom ? (
                  <DOMSection analysis={report.dom} />
                ) : (
                  <NoData section="DOM" />
                );
              case 'css':
                return report.css ? (
                  <CSSSection analysis={report.css} />
                ) : (
                  <NoData section="CSS" />
                );
              case 'images':
                return report.images ? (
                  <ImagesSection analysis={report.images} />
                ) : (
                  <NoData section="Images" />
                );
              case 'fonts':
                return report.fonts ? (
                  <FontsSection analysis={report.fonts} />
                ) : (
                  <NoData section="Fonts" />
                );
              case 'assets':
                return report.assets ? (
                  <AssetsSection analysis={report.assets} />
                ) : (
                  <NoData section="Assets" />
                );
              case 'javascript':
                return report.javascript && report.javascript.length > 0 ? (
                  <JavaScriptSection files={report.javascript} />
                ) : (
                  <NoData section="JavaScript" />
                );
              case 'webvitals':
                return report.webVitals ? (
                  <WebVitalsSection analysis={report.webVitals} />
                ) : (
                  <NoData section="Web Vitals" />
                );
              case 'network':
                return report.network ? (
                  <NetworkSection analysis={report.network} />
                ) : (
                  <NoData section="Network" />
                );
              case 'accessibility':
                return report.accessibility ? (
                  <A11ySection analysis={report.accessibility} />
                ) : (
                  <NoData section="Accessibility" />
                );
              case 'seo':
                return report.seo ? (
                  <SEOSection analysis={report.seo} />
                ) : (
                  <NoData section="SEO" />
                );
              case 'typescript':
                return report.typescript ? (
                  <TypeScriptSection analysis={report.typescript} />
                ) : (
                  <NoData section="TypeScript" />
                );
              case 'security':
                return report.security ? (
                  <SecuritySection analysis={report.security} />
                ) : (
                  <NoData section="Security" />
                );
              case 'thirdparty':
                return report.thirdParty ? (
                  <ThirdPartySection thirdParty={report.thirdParty} />
                ) : (
                  <NoData section="Third-Party" />
                );
              case 'memory':
                return report.memory ? (
                  <MemorySection memory={report.memory} />
                ) : (
                  <NoData section="Memory" />
                );
              case 'imports':
                return report.imports ? (
                  <ImportsSection imports={report.imports} />
                ) : (
                  <NoData section="Imports" />
                );
              case 'graph':
                return <GraphSection />;
              case 'timeline':
                return <TimelineSection report={report} />;
              case 'risks':
                return (
                  <RisksSection report={report} />
                );
              case 'budget':
                return <BudgetSettings report={report} />;
              case 'templates':
                return (
                  <div className="p-6">
                    <TemplateSelector />
                  </div>
                );
              case 'compare':
                return <ReportComparison />;
              case 'trends':
                return <TrendDashboard />;
              case 'cicd':
                return <CICDConfigGenerator />;
              case 'playground':
                return (
                  <SectionErrorBoundary sectionName="Code Playground">
                    <CodePlayground />
                  </SectionErrorBoundary>
                );
              case 'waterfall':
                return <WaterfallSection />;
              case 'eslint':
                return <ESLintSection />;
              default:
                return null;
            }
          })()}
        </div>
      );
    }

    // Default: show projects
    return (
      <div className="h-full bg-(--dev-bg)">
        <ProjectsList 
          onCreateProject={() => setShowCreateDialog(true)}
          onOpenProject={handleOpenProject}
        />
        <CreateProjectDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateProject}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {currentReport !== null && !isAnalyzing && viewState.type === 'report' && (
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          hasReport={true}
        />
      )}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto focus:outline-none bg-(--dev-bg)"
        tabIndex={-1}
        aria-label="Report content"
      >
        <div className={viewState.type === 'report' && currentReport !== null ? 'max-w-5xl mx-auto p-6 bg-(--dev-bg)' : ''}>
          {renderContent()}
        </div>
      </main>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
