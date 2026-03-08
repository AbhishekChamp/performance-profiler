import { useState, useEffect, useRef } from 'react';
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
import type { AnalysisSection } from '@/components/layout/types';
import { Activity, Zap, Shield, BarChart3, Code2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemeToggleSimple } from '@/components/ui/ThemeToggle';

// Animated background particles
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Draw connections
        particles.forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 150) * 0.1;
            ctx.stroke();
          }
        });
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
  );
}

// 3D Floating Card Component
function FloatingCard({
  icon: Icon,
  title,
  description,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  delay?: number;
}) {
  const [transform, setTransform] = useState('rotateX(0deg) rotateY(0deg)');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`);
  };

  const handleMouseLeave = () => {
    setTransform('rotateX(0deg) rotateY(0deg) scale(1)');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative group cursor-pointer"
      style={{
        perspective: '1000px',
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="relative bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 transition-all duration-200 ease-out"
        style={{
          transform: transform,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow Effect */}
        <div
          className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${color}`}
        />

        <div className="relative">
          <div
            className={`w-14 h-14 rounded-xl ${color.replace('bg-linear-to-br', '').replace('from-', 'bg-').split(' ')[0]} bg-opacity-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon
              className={`w-7 h-7 ${color.includes('blue') ? 'text-blue-400' : color.includes('purple') ? 'text-purple-400' : color.includes('pink') ? 'text-pink-400' : color.includes('cyan') ? 'text-cyan-400' : 'text-emerald-400'}`}
            />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Hero Section with 3D Elements
function HeroSection() {
  return (
    <div className="relative text-center mb-12">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-0 right-0 z-20">
        <ThemeToggleSimple size="md" />
      </div>

      {/* Animated Background Rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 pointer-events-none">
        <div className="absolute inset-0 border border-blue-500/20 rounded-full animate-pulse" />
        <div
          className="absolute inset-8 border border-purple-500/20 rounded-full animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
        <div
          className="absolute inset-16 border border-pink-500/20 rounded-full animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute inset-24 border border-cyan-500/20 rounded-full animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      {/* 3D Logo Container */}
      <div className="relative inline-block mb-8">
        <div
          className="relative w-32 h-32 mx-auto"
          style={{
            transformStyle: 'preserve-3d',
            animation: 'float 6s ease-in-out infinite',
          }}
        >
          {/* Main Logo */}
          <div
            className="absolute inset-0 rounded-3xl bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30"
            style={{ transform: 'translateZ(30px)' }}
          >
            <Activity className="w-16 h-16 text-white" />
          </div>

          {/* Side Faces for 3D Effect */}
          <div
            className="absolute inset-y-0 left-0 w-8 bg-linear-to-r from-blue-600 to-purple-600 rounded-l-3xl"
            style={{ transform: 'rotateY(-90deg) translateZ(64px)' }}
          />
          <div
            className="absolute inset-y-0 right-0 w-8 bg-linear-to-l from-purple-600 to-pink-600 rounded-r-3xl"
            style={{ transform: 'rotateY(90deg) translateZ(64px)' }}
          />
          <div
            className="absolute inset-x-0 top-0 h-8 bg-linear-to-b from-blue-400 to-purple-400 rounded-t-3xl"
            style={{ transform: 'rotateX(90deg) translateZ(64px)' }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-purple-600 to-pink-600 rounded-b-3xl"
            style={{ transform: 'rotateX(-90deg) translateZ(64px)' }}
          />

          {/* Floating Elements */}
          <div
            className="absolute -top-4 -right-4 w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              transform: 'translateZ(50px)',
              animation: 'orbit 8s linear infinite',
            }}
          >
            <Zap className="w-5 h-5 text-gray-900" />
          </div>
          <div
            className="absolute -bottom-2 -left-6 w-8 h-8 bg-pink-400 rounded-lg flex items-center justify-center shadow-lg"
            style={{
              transform: 'translateZ(40px)',
              animation: 'orbit 10s linear infinite reverse',
            }}
          >
            <Sparkles className="w-4 h-4 text-gray-900" />
          </div>
        </div>
      </div>

      {/* Title with Gradient Text */}
      <h1 className="text-5xl md:text-6xl font-bold mb-4">
        <span className="bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Frontend Performance
        </span>
        <br />
        <span className="text-white">Profiler</span>
      </h1>

      <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
        Analyze your application's performance with{' '}
        <span className="text-cyan-400 font-semibold">16 specialized analyzers</span>. Detect
        bottlenecks, optimize bundles, and ship faster.
      </p>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12">
        <FloatingCard
          icon={BarChart3}
          title="Performance"
          description="Bundle analysis, Web Vitals, memory leaks"
          color="bg-linear-to-br from-blue-500 to-cyan-500"
          delay={0}
        />
        <FloatingCard
          icon={Shield}
          title="Security"
          description="XSS detection, secrets scanning"
          color="bg-linear-to-br from-emerald-500 to-green-500"
          delay={100}
        />
        <FloatingCard
          icon={Code2}
          title="Code Quality"
          description="TypeScript, React patterns, a11y"
          color="bg-linear-to-br from-purple-500 to-pink-500"
          delay={200}
        />
        <FloatingCard
          icon={Zap}
          title="Optimization"
          description="Images, fonts, network hints"
          color="bg-linear-to-br from-orange-500 to-red-500"
          delay={300}
        />
      </div>
    </div>
  );
}

// Analysis Progress with 3D Effect
function AnalysisProgress({
  progress,
}: {
  progress: { message: string; progress: number } | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      {/* 3D Rotating Rings */}
      <div className="relative w-40 h-40 mb-8" style={{ perspective: '1000px' }}>
        <div
          className="absolute inset-0 border-4 border-blue-500/30 rounded-full"
          style={{
            transform: 'rotateX(60deg) rotateZ(0deg)',
            animation: 'spin3d 4s linear infinite',
          }}
        />
        <div
          className="absolute inset-4 border-4 border-purple-500/30 rounded-full"
          style={{
            transform: 'rotateX(60deg) rotateZ(45deg)',
            animation: 'spin3d 6s linear infinite reverse',
          }}
        />
        <div
          className="absolute inset-8 border-4 border-pink-500/30 rounded-full"
          style={{
            transform: 'rotateX(60deg) rotateZ(90deg)',
            animation: 'spin3d 8s linear infinite',
          }}
        />

        {/* Center Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-12 h-12 text-cyan-400 animate-pulse" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-2">Analyzing Performance</h3>

      {progress && (
        <>
          <p className="text-gray-400 mb-6">{progress.message}</p>

          {/* 3D Progress Bar */}
          <div
            className="w-80 h-4 bg-gray-800 rounded-full overflow-hidden relative"
            style={{ perspective: '500px' }}
          >
            <div
              className="h-full bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 relative"
              style={{
                width: `${progress.progress}%`,
                transform: 'translateZ(10px)',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          <p className="text-3xl font-bold text-white mt-4">{progress.progress}%</p>
        </>
      )}
    </div>
  );
}

function NoData({ section }: { section: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
        <Activity className="w-8 h-8 text-gray-600" />
      </div>
      <p className="text-gray-400 mb-2">No {section} data available</p>
      <p className="text-sm text-gray-500">Upload {section.toLowerCase()} files to see analysis</p>
    </div>
  );
}

export function IndexComponent() {
  const [activeSection, setActiveSection] = useState<AnalysisSection>('overview');
  const { files, isDragging, addFiles, removeFile, clearFiles, setIsDragging } = useFileUpload();
  const { isAnalyzing, progress, run, error } = useAnalysis();
  const { currentReport } = useAnalysisStore();

  // Show error toast if analysis fails
  useEffect(() => {
    if (error) {
      try {
        toast.error(error, { duration: 5000 });
      } catch (e) {
        console.error('Failed to show error toast:', e);
      }
    }
  }, [error]);

  const handleAnalyze = async () => {
    if (files.length === 0) {
      try {
        toast.error('Please upload at least one file to analyze');
      } catch (e) {
        console.error('Failed to show toast:', e);
      }
      return;
    }

    // Dismiss any existing toast first
    toast.dismiss('analysis');
    
    try {
      toast.loading('Starting analysis...', { id: 'analysis' });
    } catch (e) {
      console.error('Failed to show loading toast:', e);
    }

    try {
      await run(files);
      try {
        toast.success('Analysis complete! 🎉', { id: 'analysis', duration: 3000 });
      } catch (e) {
        console.error('Failed to show success toast:', e);
      }
      clearFiles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      try {
        toast.error(message, { id: 'analysis', duration: 5000 });
      } catch (e) {
        console.error('Failed to show error toast:', e);
      }
    }
  };

  const renderContent = () => {
    // Show analysis progress when analyzing
    if (isAnalyzing) {
      return (
        <div className="h-full flex items-center justify-center">
          <AnalysisProgress progress={progress} />
        </div>
      );
    }

    // Show upload form when no report exists
    if (!currentReport) {
      return (
        <div className="relative min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-8">
          <ParticleBackground />

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

    // Show report view when report exists
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
            case 'compare':
              return <ReportComparison />;
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
      <main className="flex-1 overflow-y-auto">
        <div className={currentReport ? 'max-w-5xl mx-auto p-6' : ''}>{renderContent()}</div>
      </main>

      {/* Global CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotateX(10deg) rotateY(-10deg); }
          50% { transform: translateY(-20px) rotateX(10deg) rotateY(10deg); }
        }
        
        @keyframes orbit {
          0% { transform: translateZ(50px) rotate(0deg) translateX(60px) rotate(0deg); }
          100% { transform: translateZ(50px) rotate(360deg) translateX(60px) rotate(-360deg); }
        }
        
        @keyframes spin3d {
          0% { transform: rotateX(60deg) rotateZ(0deg); }
          100% { transform: rotateX(60deg) rotateZ(360deg); }
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
