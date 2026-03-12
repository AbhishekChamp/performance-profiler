import { useState, useEffect, useRef, useCallback } from 'react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { FileUpload } from '@/components/upload/FileUpload';
import { Sidebar } from '@/components/layout/Sidebar';
import { getSectionByIndex, getNextSection, getPreviousSection } from '@/components/layout/sidebarData';
import { OverviewSection } from '@/components/report/OverviewSection';
import { BundleSection } from '@/components/report/BundleSection';
import { DOMSection } from '@/components/report/DOMSection';
import { CSSSection } from '@/components/report/CSSSection';
import { AssetsSection } from '@/components/report/AssetsSection';
import { JavaScriptSection } from '@/components/report/JavaScriptSection';
import { ReactSection } from '@/components/report/ReactSection';
import { TimelineSection } from '@/components/report/TimelineSection';
import { RisksSection } from '@/components/report/RisksSection';
import { WebVitalsSection } from '@/components/report/WebVitalsSection';
import { NetworkSection } from '@/components/report/NetworkSection';
import { ImagesSection } from '@/components/report/ImagesSection';
import { FontsSection } from '@/components/report/FontsSection';
import { AccessibilitySection } from '@/components/report/AccessibilitySection';
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
import type { AnalysisSection } from '@/components/layout/types';
import {
  Activity,
  Zap,
  Shield,
  BarChart3,
  Code2,
  Sparkles,
  Gauge,
  Layers,
  Cpu,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemeToggleSimple } from '@/components/ui/ThemeToggle';

// Static background - no animations to prevent memory issues
function StaticBackground() {
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
}) {
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
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
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
      if (frameRef.current) {
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
function StatsBar() {
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
function HeroSection() {
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
}) {
  const progressValue = progress?.progress || 0;

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

function NoData({ section }: { section: string }) {
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

export function IndexComponent() {
  const [activeSection, setActiveSection] = useState<AnalysisSection>('overview');
  const { files, isDragging, addFiles, removeFile, clearFiles, setIsDragging } = useFileUpload();
  const { isAnalyzing, progress, run, error } = useAnalysis();
  const { currentReport } = useAnalysisStore();
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
    if (error) {
      toast.error(error, { duration: 5000 });
    }
  }, [error]);

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one file to analyze');
      return;
    }

    toast.dismiss('analysis');
    toast.loading('Starting analysis...', { id: 'analysis' });

    try {
      await run(files);
      toast.success('Analysis complete! 🎉', { id: 'analysis', duration: 3000 });
      clearFiles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      toast.error(message, { id: 'analysis', duration: 5000 });
    }
  };

  const renderContent = () => {
    if (isAnalyzing) {
      return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-(--dev-bg)">
          <AnalysisProgress progress={progress} />
        </div>
      );
    }

    if (!currentReport) {
      return (
        <div className="relative min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-8 bg-(--dev-bg)">
          <StaticBackground />

          <div className="relative z-10 w-full max-w-4xl">
            <HeroSection />

            <div className="mt-8">
              <FileUpload
                files={files}
                isDragging={isDragging}
                onAddFiles={addFiles}
                onRemoveFile={removeFile}
                onClearFiles={clearFiles}
                onSetDragging={setIsDragging}
                onAnalyze={handleAnalyze}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-(--dev-bg)">
        {(() => {
          switch (activeSection) {
            case 'overview':
              return <OverviewSection report={currentReport} />;
            case 'bundle':
              return currentReport.bundle ? (
                <BundleSection bundle={currentReport.bundle} />
              ) : (
                <NoData section="Bundle" />
              );
            case 'dom':
              return currentReport.dom ? (
                <DOMSection dom={currentReport.dom} />
              ) : (
                <NoData section="DOM" />
              );
            case 'css':
              return currentReport.css ? (
                <CSSSection css={currentReport.css} />
              ) : (
                <NoData section="CSS" />
              );
            case 'images':
              return currentReport.images ? (
                <ImagesSection images={currentReport.images} />
              ) : (
                <NoData section="Images" />
              );
            case 'fonts':
              return currentReport.fonts ? (
                <FontsSection fonts={currentReport.fonts} />
              ) : (
                <NoData section="Fonts" />
              );
            case 'assets':
              return currentReport.assets ? (
                <AssetsSection assets={currentReport.assets} />
              ) : (
                <NoData section="Assets" />
              );
            case 'javascript':
              return currentReport.javascript && currentReport.javascript.length > 0 ? (
                <JavaScriptSection js={currentReport.javascript} />
              ) : (
                <NoData section="JavaScript" />
              );
            case 'react':
              return currentReport.react ? (
                <ReactSection react={currentReport.react} />
              ) : (
                <NoData section="React" />
              );
            case 'webvitals':
              return currentReport.webVitals ? (
                <WebVitalsSection webVitals={currentReport.webVitals} />
              ) : (
                <NoData section="Web Vitals" />
              );
            case 'network':
              return currentReport.network ? (
                <NetworkSection network={currentReport.network} />
              ) : (
                <NoData section="Network" />
              );
            case 'accessibility':
              return currentReport.accessibility ? (
                <AccessibilitySection accessibility={currentReport.accessibility} />
              ) : (
                <NoData section="Accessibility" />
              );
            case 'seo':
              return currentReport.seo ? (
                <SEOSection seo={currentReport.seo} />
              ) : (
                <NoData section="SEO" />
              );
            case 'typescript':
              return currentReport.typescript ? (
                <TypeScriptSection typescript={currentReport.typescript} />
              ) : (
                <NoData section="TypeScript" />
              );
            case 'security':
              return currentReport.security ? (
                <SecuritySection security={currentReport.security} />
              ) : (
                <NoData section="Security" />
              );
            case 'thirdparty':
              return currentReport.thirdParty ? (
                <ThirdPartySection thirdParty={currentReport.thirdParty} />
              ) : (
                <NoData section="Third-Party" />
              );
            case 'memory':
              return currentReport.memory ? (
                <MemorySection memory={currentReport.memory} />
              ) : (
                <NoData section="Memory" />
              );
            case 'imports':
              return currentReport.imports ? (
                <ImportsSection imports={currentReport.imports} />
              ) : (
                <NoData section="Imports" />
              );
            case 'graph':
              return <GraphSection />;
            case 'timeline':
              return <TimelineSection timeline={currentReport.timeline} />;
            case 'risks':
              return (
                <RisksSection
                  risk={currentReport.renderRisk}
                  optimizations={currentReport.summary.optimizations}
                />
              );
            case 'budget':
              return <BudgetSettings report={currentReport} />;
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
              return <CodePlayground />;
            default:
              return null;
          }
        })()}
      </div>
    );
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
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto focus:outline-none bg-(--dev-bg)"
        tabIndex={-1}
        aria-label="Report content"
      >
        <div className={currentReport ? 'max-w-5xl mx-auto p-6 bg-(--dev-bg)' : ''}>
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
