import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  Shield,
  BarChart3,
  FileCode,
  Settings,
} from 'lucide-react';
import { useSetupStore } from '@/stores/setupStore';
import { ThemeToggle } from './ThemeToggle';

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Frontend Performance Profiler',
    description: "Let's get you set up in just a few steps.",
    icon: Zap,
  },
  {
    id: 'theme',
    title: 'Choose Your Theme',
    description: 'Select your preferred color scheme.',
    icon: Settings,
  },
  {
    id: 'features',
    title: 'Key Features',
    description: "Here's what you can do with the profiler:",
    icon: BarChart3,
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    description: 'Your data stays on your device.',
    icon: Shield,
  },
  {
    id: 'ready',
    title: "You're All Set!",
    description: 'Start analyzing your frontend performance.',
    icon: FileCode,
  },
];

export function SetupWizard() {
  const { isFirstRun, completeSetup } = useSetupStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(isFirstRun);

  if (!isVisible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      completeSetup();
      setIsVisible(false);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSkip = () => {
    completeSetup();
    setIsVisible(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-1000 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-dev-surface rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Progress */}
        <div className="flex gap-2 p-6 pb-0">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-dev-accent' : 'bg-dev-border'
              }`}
            />
          ))}
        </div>

        {/* Header */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-lg bg-transparent hover:bg-dev-hover text-dev-text-muted transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 text-center"
          >
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-dev-accent/10 text-dev-accent rounded-2xl">
              <Icon size={32} />
            </div>

            <h2 className="m-0 mb-2 text-2xl font-bold text-dev-text">{step.title}</h2>
            <p className="m-0 mb-6 text-base text-dev-text-subtle">{step.description}</p>

            {/* Step-specific content */}
            <div className="text-left">
              {step.id === 'welcome' && <WelcomeContent />}
              {step.id === 'theme' && <ThemeContent />}
              {step.id === 'features' && <FeaturesContent />}
              {step.id === 'privacy' && <PrivacyContent />}
              {step.id === 'ready' && <ReadyContent />}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-4 px-8 pb-8">
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-dev-bg text-dev-text-subtle hover:bg-dev-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-dev-accent text-white hover:bg-dev-accent-hover transition-all hover:-translate-y-0.5"
          >
            {isLastStep ? (
              <>
                <Check size={18} />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function WelcomeContent() {
  return (
    <div className="py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 bg-dev-bg rounded-lg">
          <div className="text-xl">📊</div>
          <span className="text-sm text-dev-text">Comprehensive performance analysis</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-dev-bg rounded-lg">
          <div className="text-xl">🔒</div>
          <span className="text-sm text-dev-text">100% client-side processing</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-dev-bg rounded-lg">
          <div className="text-xl">⚡</div>
          <span className="text-sm text-dev-text">Instant Web Vitals scoring</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-dev-bg rounded-lg">
          <div className="text-xl">📈</div>
          <span className="text-sm text-dev-text">Bundle and memory analysis</span>
        </div>
      </div>
    </div>
  );
}

function ThemeContent() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-sm text-dev-text-subtle">Select your preferred theme:</p>
      <div className="flex justify-center p-4 bg-dev-bg rounded-xl">
        <ThemeToggle showLabel size="lg" />
      </div>
    </div>
  );
}

function FeaturesContent() {
  const features = [
    'Bundle Analyzer - Check webpack/vite output',
    'Web Vitals - LCP, FID, CLS scoring',
    'Memory Analysis - Heap snapshots',
    'Import Cost - Track heavy dependencies',
    'Third-Party Scripts - Identify render blockers',
    'Export Reports - PDF, HTML, Markdown',
  ];

  return (
    <ul className="grid gap-3 p-0 m-0 list-none">
      {features.map((feature, index) => (
        <li
          key={index}
          className="flex items-center gap-3 p-2.5 bg-dev-bg rounded-lg text-sm text-dev-text-subtle"
        >
          <Check size={16} className="text-emerald-500 shrink-0" />
          {feature}
        </li>
      ))}
    </ul>
  );
}

function PrivacyContent() {
  return (
    <div className="py-4">
      <div className="bg-dev-bg rounded-xl p-6 text-center">
        <Shield size={32} className="mx-auto mb-3 text-dev-accent" />
        <h3 className="m-0 mb-2 text-lg font-semibold text-dev-text">Privacy First</h3>
        <ul className="m-0 pl-5 text-left text-sm text-dev-text-subtle">
          <li className="my-2">All analysis happens in your browser</li>
          <li className="my-2">No data is sent to any server</li>
          <li className="my-2">Reports are stored locally on your device</li>
          <li className="my-2">You control your data completely</li>
        </ul>
      </div>
    </div>
  );
}

function ReadyContent() {
  return (
    <div className="py-4 text-center">
      <div className="text-5xl mb-4">🚀</div>
      <p className="text-sm text-dev-text-subtle">
        You&apos;re ready to start profiling! Upload a project or try it with a sample analysis.
      </p>
      <div className="mt-4 p-3 bg-dev-accent/10 rounded-lg text-sm text-dev-accent">
        <strong>Tip:</strong> Press{' '}
        <kbd className="inline-block px-1.5 py-0.5 bg-dev-surface border border-dev-border rounded font-mono text-xs">
          ?
        </kbd>{' '}
        anytime to see keyboard shortcuts.
      </div>
    </div>
  );
}
