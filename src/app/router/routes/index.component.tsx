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

// Animated Background with Gradient Mesh - Theme Aware
function GradientMeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const dark = document.documentElement.classList.contains('dark') ||
        (!document.documentElement.classList.contains('light') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(dark);
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const getThemeColors = () => {
      return {
        orb1: isDark 
          ? ['rgba(59, 130, 246, 0.15)', 'rgba(6, 182, 212, 0.05)']
          : ['rgba(37, 99, 235, 0.08)', 'rgba(8, 145, 178, 0.03)'],
        orb2: isDark
          ? ['rgba(139, 92, 246, 0.12)', 'rgba(236, 72, 153, 0.04)']
          : ['rgba(124, 58, 237, 0.08)', 'rgba(219, 39, 119, 0.02)'],
        orb3: isDark
          ? ['rgba(16, 185, 129, 0.1)', 'rgba(20, 184, 166, 0.03)']
          : ['rgba(5, 150, 105, 0.06)', 'rgba(13, 148, 136, 0.02)'],
        noise: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
      };
    };

    const drawGradientOrb = (
      x: number,
      y: number,
      radius: number,
      color1: string,
      color2: string
    ) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(0.5, color2);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      const colors = getThemeColors();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.005;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      drawGradientOrb(
        centerX + Math.sin(time) * 200,
        centerY + Math.cos(time * 0.7) * 150,
        400,
        colors.orb1[0],
        colors.orb1[1]
      );

      drawGradientOrb(
        centerX + Math.cos(time * 0.8) * 250,
        centerY + Math.sin(time * 1.2) * 180,
        350,
        colors.orb2[0],
        colors.orb2[1]
      );

      drawGradientOrb(
        centerX + Math.sin(time * 1.1 + Math.PI) * 180,
        centerY + Math.cos(time * 0.9) * 200,
        300,
        colors.orb3[0],
        colors.orb3[1]
      );

      ctx.fillStyle = colors.noise;
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1, 1);
      }

      animationId = requestAnimationFrame(animate);
    };

    resize();
    animate();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// Floating particles with connections - Theme Aware
function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const dark = document.documentElement.classList.contains('dark') ||
        (!document.documentElement.classList.contains('light') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(dark);
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const getThemeColor = () => {
      return isDark ? [148, 163, 184] : [100, 116, 139];
    };

    const createParticles = () => {
      particles.length = 0;
      const count = Math.min(50, Math.floor((canvas.width * canvas.height) / 25000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const animate = () => {
      const [r, g, b] = getThemeColor();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
    return () => cancelAnimationFrame(animationId);
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
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

// Analysis Progress with modern design
function AnalysisProgress({
  progress,
}: {
  progress: { message: string; progress: number } | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full relative px-4">
      <div className="relative w-32 h-32 mb-8">
        <div
          className="absolute inset-0 border-4 border-blue-500/20 rounded-full"
          style={{ animation: 'spin-slow 8s linear infinite' }}
        />
        <div
          className="absolute inset-2 border-4 border-purple-500/20 rounded-full"
          style={{ animation: 'spin-slow 6s linear infinite reverse' }}
        />
        <div
          className="absolute inset-4 border-4 border-pink-500/20 rounded-full"
          style={{ animation: 'spin-slow 4s linear infinite' }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Activity className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-(--dev-text) mb-2">
        Analyzing Performance
      </h3>

      {progress && (
        <>
          <p className="text-(--dev-text-muted) mb-6 text-center">{progress.message}</p>

          <div className="w-full max-w-md h-2 bg-(--dev-border)/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>

          <p className="text-2xl font-bold text-(--dev-text) mt-4">
            {progress.progress}%
          </p>
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
        <div className="h-full flex items-center justify-center">
          <AnalysisProgress progress={progress} />
        </div>
      );
    }

    if (!currentReport) {
      return (
        <div className="relative min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-8 bg-(--dev-bg)">
          <GradientMeshBackground />
          <FloatingParticles />

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
      <div className="animate-in fade-in duration-500">
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
        className="flex-1 overflow-y-auto focus:outline-none"
        tabIndex={-1}
        aria-label="Report content"
      >
        <div className={currentReport ? 'max-w-5xl mx-auto p-6' : ''}>
          {renderContent()}
        </div>
      </main>

      <style>{`
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        
        @keyframes float-orbit {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(5px, -5px); }
          50% { transform: translate(0, -10px); }
          75% { transform: translate(-5px, -5px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-in {
          animation: fade-in 0.5s ease-out;
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
