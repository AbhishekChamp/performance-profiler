import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  AlertCircle, 
  Check, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Copy, 
  Download, 
  Eye,
  FileCode, 
  GitBranch,
  Image,
  Info,
  Monitor,
  Package,
  RotateCcw,
  Scale,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Terminal,
  Type,
  X,
  Zap
} from 'lucide-react';
import { 
  BUDGET_PRESETS,
  generateBudgetCheckScript, 
  generateConfig, 
  getAllPlatforms,
  getBudgetPreset,
  validateBudget,
} from '@/core/ci-cd';
import { createCodeBlock, getLanguageFromFilename } from '@/utils/syntaxHighlight';
import type { BudgetConfig, CIPlatform, PerformanceBudget } from '@/types/cicd';
import toast from 'react-hot-toast';

// --- Types & Interfaces ---

interface Step {
  id: 'preset' | 'budgets' | 'platform' | 'preview';
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { id: 'preset', title: 'Choose Preset', description: 'Start with a template', icon: Sparkles },
  { id: 'budgets', title: 'Customize', description: 'Adjust thresholds', icon: Settings },
  { id: 'platform', title: 'Platform', description: 'Select CI/CD tool', icon: GitBranch },
  { id: 'preview', title: 'Generate', description: 'Export config', icon: Download },
];

// --- Utility Components ---

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// --- Sub-Components ---

function StepIndicator({ 
  steps, 
  currentStep, 
  onStepClick,
  canProceedToStep
}: { 
  steps: Step[]; 
  currentStep: number; 
  onStepClick: (index: number) => void;
  canProceedToStep: (stepIndex: number) => boolean;
}): React.ReactNode {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = canProceedToStep(index);
          
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                  isActive && "bg-dev-accent/10 ring-1 ring-dev-accent/30",
                  isCompleted && !isActive && "opacity-70 hover:opacity-100",
                  !isClickable && "opacity-40 cursor-not-allowed",
                  isClickable && !isActive && "hover:bg-dev-surface-hover cursor-pointer"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                  isActive && "bg-dev-accent text-white shadow-lg shadow-dev-accent/25",
                  isCompleted && !isActive && "bg-dev-success/20 text-dev-success",
                  !isActive && !isCompleted && "bg-dev-surface-hover text-dev-text-muted"
                )}>
                  {isCompleted && !isActive ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <step.icon size={20} />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-dev-accent" : "text-dev-text"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-dev-text-muted">{step.description}</p>
                </div>
              </button>
              
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-dev-border mx-4 hidden md:block">
                  <div 
                    className={cn(
                      "h-full bg-dev-accent transition-all duration-500",
                      isCompleted ? "w-full" : "w-0"
                    )} 
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PresetCard({ 
  preset, 
  isSelected, 
  onClick 
}: { 
  preset: typeof BUDGET_PRESETS[0];
  isSelected: boolean;
  onClick: () => void;
}): React.ReactNode {
  const iconMap: Record<string, React.ElementType | undefined> = {
    shield: Shield,
    scale: Scale,
    coffee: Coffee,
    smartphone: Smartphone,
    monitor: Monitor,
  };
  
  const Icon = iconMap[preset.icon] ?? Sparkles;
  
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden group",
        isSelected 
          ? "border-dev-accent bg-dev-accent/5 shadow-lg shadow-dev-accent/10" 
          : "border-dev-border bg-dev-surface hover:border-dev-accent/30 hover:shadow-md"
      )}
    >
      {/* Background gradient on selection */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          isSelected && "opacity-100"
        )}
        style={{
          background: `radial-gradient(circle at top right, ${preset.color}10, transparent 60%)`
        }}
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{ 
              backgroundColor: isSelected ? `${preset.color}20` : 'var(--dev-surface-hover)',
            }}
          >
            <Icon 
              size={24} 
              style={{ color: isSelected ? preset.color : 'var(--dev-text-muted)' }}
            />
          </div>
          
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 rounded-full bg-dev-accent flex items-center justify-center"
            >
              <Check size={14} className="text-white" />
            </motion.div>
          )}
        </div>
        
        <h3 className="font-semibold text-dev-text mb-1">{preset.name}</h3>
        <p className="text-sm text-dev-text-muted leading-relaxed">{preset.description}</p>
        
        {/* Budget preview */}
        <div className="mt-4 pt-4 border-t border-dev-border/50">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-md bg-dev-bg text-dev-text-muted">
              {preset.budgets.bundleSize}KB bundle
            </span>
            <span className="text-xs px-2 py-1 rounded-md bg-dev-bg text-dev-text-muted">
              {preset.budgets.lighthousePerformance}+ LH
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function BudgetSlider({ 
  label, 
  value, 
  onChange, 
  min = 0,
  max,
  unit = '',
  icon: Icon,
  description,
}: { 
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  unit?: string;
  icon: React.ElementType;
  description?: string;
}): React.ReactNode {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="p-4 rounded-xl bg-dev-surface border border-dev-border hover:border-dev-accent/30 transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-dev-bg flex items-center justify-center group-hover:bg-dev-accent/10 transition-colors">
            <Icon size={18} className="text-dev-accent" />
          </div>
          <div>
            <label className="text-sm font-medium text-dev-text">{label}</label>
            {description !== undefined && description !== '' && (
              <p className="text-xs text-dev-text-muted">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Math.min(max, Math.max(min, parseInt(e.target.value) || 0)))}
            className="w-20 px-2 py-1.5 bg-dev-bg border border-dev-border rounded-lg text-sm text-dev-text text-center focus:outline-none focus:ring-2 focus:ring-dev-accent/30"
          />
          <span className="text-sm text-dev-text-muted w-10">{unit}</span>
        </div>
      </div>
      
      <div className="relative h-2 bg-dev-bg rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-dev-accent rounded-full transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-dev-text-subtle">{min}{unit}</span>
        <span className="text-xs text-dev-text-subtle">{max}{unit}</span>
      </div>
    </div>
  );
}

function PlatformCard({ 
  platform, 
  isSelected, 
  onClick 
}: { 
  platform: ReturnType<typeof getAllPlatforms>[0];
  isSelected: boolean;
  onClick: () => void;
}): React.ReactNode {
  const iconMap: Record<string, React.ElementType | undefined> = {
    github: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    gitlab: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.423-.73-.423-.867 0L16.418 9.45H7.582L4.919 1.263C4.783.84 4.187.84 4.05 1.26L1.386 9.45.044 13.587c-.121.374.013.79.332 1.024l11.323 8.23 11.318-8.228c.322-.235.454-.65.338-1.026z"/>
      </svg>
    ),
    circleci: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.909a7.09 7.09 0 110 14.182 7.09 7.09 0 010-14.182zm0 2.909a4.182 4.182 0 100 8.364 4.182 4.182 0 000-8.364z"/>
      </svg>
    ),
    azure: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.483 21.3H24L14.025 4.013l-3.038 8.347 5.836 6.938L5.483 21.3zM13.23 2.7L6.105 8.677 0 19.253h5.505l8.435-9.695L13.23 2.7z"/>
      </svg>
    ),
    jenkins: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.286c1.514 0 2.914.455 4.09 1.234-.396.175-.79.396-1.095.67a5.587 5.587 0 00-2.995-.86 5.6 5.6 0 00-2.995.86c-.305-.274-.7-.495-1.095-.67A6.728 6.728 0 0112 2.286z"/>
      </svg>
    ),
    vercel: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 22.525H0l12-21.05 12 21.05z"/>
      </svg>
    ),
    netlify: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.49 19.04h-.23L6.04 18l4.26-4.23 1.64 1.64a.68.68 0 000-.96l-6.14-6.13a.68.68 0 00-.96 0l-6.14 6.13a.68.68 0 000 .96l1.64 1.64 2.82-2.82a.68.68 0 10-.96-.96L.68 17.04l-1.04 2.05 2.05-1.04 2.05 1.04-1.04 2.05 2.05-1.04 1.74 1.74zM17.51 4.96h.23l.22 1.04-4.26 4.23-1.64-1.64a.68.68 0 000 .96l6.14 6.13a.68.68 0 00.96 0l6.14-6.13a.68.68 0 000-.96l-1.64-1.64-2.82 2.82a.68.68 0 10.96.96l2.82-2.82 2.05 1.04-1.04-2.05-2.05 1.04-1.04-2.05 2.05-1.04-1.74-1.74z"/>
      </svg>
    ),
  };
  
  const Icon = iconMap[platform.icon] ?? FileCode;
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-5 rounded-xl border-2 text-left transition-all duration-300",
        isSelected 
          ? "border-dev-accent bg-dev-accent/5 shadow-lg shadow-dev-accent/10" 
          : "border-dev-border bg-dev-surface hover:border-dev-accent/30"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          isSelected ? "bg-dev-accent/20" : "bg-dev-bg"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            isSelected ? "text-dev-accent" : "text-dev-text"
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-dev-text">{platform.name}</h3>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-dev-accent flex items-center justify-center"
              >
                <Check size={12} className="text-white" />
              </motion.div>
            )}
          </div>
          <p className="text-sm text-dev-text-muted mt-1">{platform.description}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs px-2 py-1 rounded-md bg-dev-bg text-dev-text-muted">
              {platform.supportedFormats.join(', ')}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function PreviewModal({ 
  isOpen, 
  onClose, 
  config,
  checkScript,
}: { 
  isOpen: boolean;
  onClose: () => void;
  config: ReturnType<typeof generateConfig> | null;
  checkScript: ReturnType<typeof generateBudgetCheckScript>;
}): React.ReactNode {
  const [activeTab, setActiveTab] = useState<'config' | 'script' | 'instructions'>('config');
  const [copied, setCopied] = useState(false);
  const _modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen || config === null) return null;
  
  const highlightedConfig = createCodeBlock(config.content, getLanguageFromFilename(config.filename));
  const highlightedScript = createCodeBlock(checkScript.script, 'javascript');
  
  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(
        activeTab === 'config' ? config.content : 
        activeTab === 'script' ? checkScript.script : 
        config.setupInstructions.join('\n')
      );
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };
  
  const handleDownload = (): void => {
    const content = activeTab === 'config' ? config.content : 
                   activeTab === 'script' ? checkScript.script : 
                   config.setupInstructions.join('\n');
    const filename = activeTab === 'config' ? config.filename :
                    activeTab === 'script' ? checkScript.name :
                    'setup-instructions.txt';
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Downloaded!');
  };
  
  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            ref={_modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 bg-dev-surface rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-dev-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dev-border bg-dev-bg/50">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-dev-text flex items-center gap-2">
                  <Eye size={20} className="text-dev-accent" />
                  Preview Configuration
                </h2>
                <div className="hidden sm:flex items-center gap-2">
                  {(['config', 'script', 'instructions'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                        activeTab === tab 
                          ? "bg-dev-accent text-white" 
                          : "text-dev-text-muted hover:text-dev-text hover:bg-dev-surface-hover"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dev-surface-hover hover:bg-dev-accent/20 text-dev-text transition-colors"
                >
                  {copied ? <Check size={16} className="text-dev-success" /> : <Copy size={16} />}
                  <span className="hidden sm:inline text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dev-accent hover:bg-dev-accent/90 text-white transition-colors"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline text-sm">Download</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-dev-surface-hover text-dev-text-muted hover:text-dev-text transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Mobile tabs */}
            <div className="sm:hidden flex border-b border-dev-border bg-dev-bg/50">
              {(['config', 'script', 'instructions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium transition-colors capitalize border-b-2",
                    activeTab === tab 
                      ? "text-dev-accent border-dev-accent bg-dev-accent/5" 
                      : "text-dev-text-muted border-transparent"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {/* Content - SCROLLABLE */}
            <div className="flex-1 overflow-auto p-6 bg-dev-bg">
              {activeTab === 'config' && (
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: highlightedConfig }}
                />
              )}
              
              {activeTab === 'script' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-dev-surface border border-dev-border">
                    <Info size={16} className="text-dev-accent" />
                    <p className="text-sm text-dev-text-muted">
                      This script checks your build output against the configured budgets
                    </p>
                  </div>
                  <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: highlightedScript }}
                  />
                </div>
              )}
              
              {activeTab === 'instructions' && (
                <div className="space-y-4 max-w-2xl">
                  <h3 className="text-lg font-medium text-dev-text flex items-center gap-2">
                    <Terminal size={20} className="text-dev-accent" />
                    Setup Instructions
                  </h3>
                  
                  <ol className="space-y-4">
                    {config.setupInstructions.map((step, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4 p-4 rounded-xl bg-dev-surface border border-dev-border"
                      >
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-dev-accent/20 text-dev-accent flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="text-dev-text pt-1">{step}</span>
                      </motion.li>
                    ))}
                  </ol>
                  
                  {config.requiredPlugins.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl bg-dev-accent/5 border border-dev-accent/20">
                      <p className="text-sm font-medium text-dev-text mb-2">Required plugins/packages:</p>
                      <div className="flex flex-wrap gap-2">
                        {config.requiredPlugins.map(plugin => (
                          <code key={plugin} className="px-2 py-1 bg-dev-bg rounded-lg text-xs text-dev-accent border border-dev-border">
                            {plugin}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {config.requiredEnvVars && config.requiredEnvVars.length > 0 && (
                    <div className="mt-4 p-4 rounded-xl bg-dev-warning/10 border border-dev-warning/30">
                      <p className="text-sm font-medium text-dev-warning mb-2">Required environment variables:</p>
                      <ul className="space-y-1">
                        {config.requiredEnvVars.map(env => (
                          <li key={env} className="text-sm text-dev-text font-mono bg-dev-bg px-2 py-1 rounded">
                            {env}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
    </AnimatePresence>
  );
}

// --- Main Component ---

export function CICDConfigGenerator(): React.ReactNode {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [selectedPlatform, setSelectedPlatform] = useState<CIPlatform | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [budgets, setBudgets] = useState<PerformanceBudget>({
    bundleSize: 500,
    jsSize: 300,
    cssSize: 100,
    imageSize: 200,
    fontSize: 100,
    lighthousePerformance: 90,
    lighthouseAccessibility: 90,
    lighthouseBestPractices: 90,
    lighthouseSEO: 90,
  });
  
  // Apply preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = getBudgetPreset(presetId);
    if (preset) {
      setBudgets(preset.budgets);
      setSelectedPreset(presetId);
    }
  }, []);
  
  // Budget config
  const budgetConfig: BudgetConfig = useMemo(() => ({
    name: 'Frontend Performance Budget',
    description: 'Performance budget configuration for CI/CD pipeline',
    budgets,
    failOnViolation: true,
    warnOnViolation: true,
    commentOnPR: true,
  }), [budgets]);
  
  const validationErrors = useMemo(() => validateBudget(budgets), [budgets]);
  
  const config = useMemo(() => {
    if (!selectedPlatform) return null;
    return generateConfig(selectedPlatform, budgetConfig);
  }, [selectedPlatform, budgetConfig]);
  
  const checkScript = useMemo(() => {
    return generateBudgetCheckScript(budgetConfig);
  }, [budgetConfig]);
  
  // Navigation
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0: return !!selectedPreset;
      case 1: return validationErrors.length === 0;
      case 2: return !!selectedPlatform;
      default: return true;
    }
  }, [currentStep, selectedPreset, validationErrors, selectedPlatform]);
  
  // Check if we can navigate to a specific step
  const canProceedToStep = useCallback((stepIndex: number) => {
    // Can always go back to previous steps
    if (stepIndex <= currentStep) return true;
    // Can go to next step if current step is valid
    if (stepIndex === currentStep + 1) return canProceed();
    // Can skip ahead only if all intermediate steps are valid
    if (stepIndex > currentStep + 1) {
      // Check step 0 (preset)
      if (currentStep === 0 && !selectedPreset) return false;
      // Check step 1 (budgets - validation)
      if (currentStep <= 1 && validationErrors.length > 0) return false;
      // Check step 2 (platform)
      if (currentStep <= 2 && !selectedPlatform && stepIndex >= 3) return false;
    }
    return true;
  }, [currentStep, canProceed, selectedPreset, validationErrors, selectedPlatform]);
  
  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, canProceed]);
  
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  // Render step content
  const renderStepContent = (): React.ReactNode => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-dev-text mb-2">Choose a Starting Point</h3>
              <p className="text-dev-text-muted">Select a preset that matches your project needs. You can customize it in the next step.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BUDGET_PRESETS.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPreset === preset.id}
                  onClick={() => {
                    setSelectedPreset(preset.id);
                    applyPreset(preset.id);
                  }}
                />
              ))}
            </div>
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-dev-text mb-1">Customize Budgets</h3>
                <p className="text-dev-text-muted">Fine-tune the performance thresholds for your CI/CD pipeline</p>
              </div>
              <button
                onClick={() => applyPreset(selectedPreset)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dev-surface-hover hover:bg-dev-accent/20 text-dev-text transition-colors"
              >
                <RotateCcw size={16} />
                <span className="text-sm">Reset to Preset</span>
              </button>
            </div>
            
            {validationErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-dev-danger/10 border border-dev-danger/30 flex items-start gap-3"
              >
                <AlertCircle size={20} className="text-dev-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-dev-danger">Validation Errors</p>
                  <ul className="mt-1 space-y-1">
                    {validationErrors.map((error, i) => (
                      <li key={i} className="text-sm text-dev-text">{error}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
            
            <div className="space-y-6">
              <section>
                <h4 className="text-sm font-semibold text-dev-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package size={16} />
                  Size Budgets (KB)
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <BudgetSlider
                    label="Total Bundle Size"
                    value={budgets.bundleSize ?? 500}
                    onChange={(v) => setBudgets(b => ({ ...b, bundleSize: v }))}
                    min={100}
                    max={2000}
                    unit="KB"
                    icon={Package}
                    description="Maximum total build output size"
                  />
                  <BudgetSlider
                    label="JavaScript Size"
                    value={budgets.jsSize ?? 300}
                    onChange={(v) => setBudgets(b => ({ ...b, jsSize: v }))}
                    min={50}
                    max={1500}
                    unit="KB"
                    icon={FileCode}
                    description="Maximum JS assets size"
                  />
                  <BudgetSlider
                    label="CSS Size"
                    value={budgets.cssSize ?? 100}
                    onChange={(v) => setBudgets(b => ({ ...b, cssSize: v }))}
                    min={10}
                    max={500}
                    unit="KB"
                    icon={Zap}
                    description="Maximum CSS assets size"
                  />
                  <BudgetSlider
                    label="Image Size"
                    value={budgets.imageSize ?? 200}
                    onChange={(v) => setBudgets(b => ({ ...b, imageSize: v }))}
                    min={50}
                    max={1000}
                    unit="KB"
                    icon={Image}
                    description="Maximum image assets size"
                  />
                  <BudgetSlider
                    label="Font Size"
                    value={budgets.fontSize ?? 100}
                    onChange={(v) => setBudgets(b => ({ ...b, fontSize: v }))}
                    min={10}
                    max={500}
                    unit="KB"
                    icon={Type}
                    description="Maximum font assets size"
                  />
                </div>
              </section>
              
              <section>
                <h4 className="text-sm font-semibold text-dev-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Zap size={16} />
                  Lighthouse Score Thresholds
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <BudgetSlider
                    label="Performance Score"
                    value={budgets.lighthousePerformance ?? 90}
                    onChange={(v) => setBudgets(b => ({ ...b, lighthousePerformance: v }))}
                    min={0}
                    max={100}
                    unit=""
                    icon={Zap}
                    description="Minimum Lighthouse Performance score"
                  />
                  <BudgetSlider
                    label="Accessibility Score"
                    value={budgets.lighthouseAccessibility ?? 90}
                    onChange={(v) => setBudgets(b => ({ ...b, lighthouseAccessibility: v }))}
                    min={0}
                    max={100}
                    unit=""
                    icon={CheckCircle2}
                    description="Minimum Lighthouse Accessibility score"
                  />
                  <BudgetSlider
                    label="Best Practices"
                    value={budgets.lighthouseBestPractices ?? 90}
                    onChange={(v) => setBudgets(b => ({ ...b, lighthouseBestPractices: v }))}
                    min={0}
                    max={100}
                    unit=""
                    icon={Shield}
                    description="Minimum Lighthouse Best Practices score"
                  />
                  <BudgetSlider
                    label="SEO Score"
                    value={budgets.lighthouseSEO ?? 90}
                    onChange={(v) => setBudgets(b => ({ ...b, lighthouseSEO: v }))}
                    min={0}
                    max={100}
                    unit=""
                    icon={Sparkles}
                    description="Minimum Lighthouse SEO score"
                  />
                </div>
              </section>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-dev-text mb-2">Select CI/CD Platform</h3>
              <p className="text-dev-text-muted">Choose the platform where you want to run performance checks</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getAllPlatforms().map(platform => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  isSelected={selectedPlatform === platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                />
              ))}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-dev-text mb-2">Generate Configuration</h3>
              <p className="text-dev-text-muted">Your CI/CD configuration is ready! Preview or download the files.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Summary Card */}
              <div className="md:col-span-2 p-6 rounded-2xl bg-dev-surface border border-dev-border">
                <h4 className="font-semibold text-dev-text mb-4 flex items-center gap-2">
                  <Settings size={18} className="text-dev-accent" />
                  Configuration Summary
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-dev-bg">
                    <p className="text-xs text-dev-text-muted mb-1">Preset</p>
                    <p className="font-medium text-dev-text">
                      {BUDGET_PRESETS.find(p => p.id === selectedPreset)?.name ?? 'Custom'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-dev-bg">
                    <p className="text-xs text-dev-text-muted mb-1">Platform</p>
                    <p className="font-medium text-dev-text">
                      {getAllPlatforms().find(p => p.id === selectedPlatform)?.name ?? 'None'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-dev-bg">
                    <p className="text-xs text-dev-text-muted mb-1">Bundle Budget</p>
                    <p className="font-medium text-dev-text">{budgets.bundleSize} KB</p>
                  </div>
                  <div className="p-3 rounded-lg bg-dev-bg">
                    <p className="text-xs text-dev-text-muted mb-1">Min Performance</p>
                    <p className="font-medium text-dev-text">{budgets.lighthousePerformance}/100</p>
                  </div>
                </div>
              </div>
              
              {/* Actions Card */}
              <div className="p-6 rounded-2xl bg-dev-surface border border-dev-border flex flex-col justify-center gap-3">
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-dev-accent hover:bg-dev-accent/90 text-white font-medium transition-all"
                >
                  <Eye size={18} />
                  Preview Config
                </button>
                <button
                  onClick={() => setCurrentStep(0)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-dev-surface-hover hover:bg-dev-accent/20 text-dev-text transition-colors"
                >
                  <RotateCcw size={18} />
                  Start Over
                </button>
              </div>
            </div>
            
            {/* Quick Tips */}
            <div className="p-4 rounded-xl bg-dev-accent/5 border border-dev-accent/20">
              <h4 className="font-medium text-dev-text mb-2 flex items-center gap-2">
                <Info size={16} className="text-dev-accent" />
                Next Steps
              </h4>
              <ul className="space-y-2 text-sm text-dev-text-muted">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-dev-success mt-0.5 flex-shrink-0" />
                  <span>Click "Preview Config" to view and download your configuration files</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-dev-success mt-0.5 flex-shrink-0" />
                  <span>Add the config file to your repository at the suggested path</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-dev-success mt-0.5 flex-shrink-0" />
                  <span>Commit and push to trigger your first performance check</span>
                </li>
              </ul>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dev-text flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-dev-accent/20 flex items-center justify-center">
            <GitBranch size={24} className="text-dev-accent" />
          </div>
          CI/CD Config Generator
        </h1>
        <p className="text-dev-text-muted text-lg ml-15">
          Generate performance budget configurations for your CI/CD pipeline in minutes
        </p>
      </div>
      
      {/* Step Indicator */}
      <div className="mb-8 p-4 rounded-2xl bg-dev-surface border border-dev-border">
        <StepIndicator 
          steps={STEPS} 
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          canProceedToStep={canProceedToStep}
        />
      </div>
      
      {/* Content Area */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6 md:p-8 rounded-2xl bg-dev-surface border border-dev-border"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
            currentStep === 0
              ? "opacity-0 pointer-events-none"
              : "bg-dev-surface-hover hover:bg-dev-accent/20 text-dev-text"
          )}
        >
          <ChevronLeft size={18} />
          Back
        </button>
        
        <button
          onClick={nextStep}
          disabled={!canProceed() || currentStep === STEPS.length - 1}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
            !canProceed() || currentStep === STEPS.length - 1
              ? "opacity-50 cursor-not-allowed bg-dev-surface-hover text-dev-text-muted"
              : "bg-dev-accent hover:bg-dev-accent/90 text-white shadow-lg shadow-dev-accent/25"
          )}
        >
          {currentStep === STEPS.length - 1 ? 'Complete' : 'Continue'}
          {currentStep !== STEPS.length - 1 && <ChevronRight size={18} />}
        </button>
      </div>
      
      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        config={config}
        checkScript={checkScript}
      />
    </div>
  );
}
