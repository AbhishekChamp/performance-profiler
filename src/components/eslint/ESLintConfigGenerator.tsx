import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Download,
  FileCode,
  FileJson,
  Info,
  Layout,
  Shield,
  Sparkles,
  Terminal,
  X,
  Zap
} from 'lucide-react';
import { 
  type ConfigFormat, 
  type ConfigGenerationOptions, 
  type Preset, 
  type PresetType, 
  generateESLintConfig, 
  generateInstallCommands,
  presets
} from '@/core/eslint';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useThemeStore } from '@/stores/themeStore';
import { createCodeBlock } from '@/utils/syntaxHighlight';
import toast from 'react-hot-toast';

// --- Types ---
type Step = 'presets' | 'format' | 'strictness' | 'generate';

interface StepConfig {
  id: Step;
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: StepConfig[] = [
  { id: 'presets', title: 'Presets', description: 'Choose your config', icon: Sparkles },
  { id: 'format', title: 'Format', description: 'Output style', icon: Layout },
  { id: 'strictness', title: 'Rules', description: 'Set strictness', icon: Shield },
  { id: 'generate', title: 'Export', description: 'Get your config', icon: Download },
];

// Step order for the wizard
const _STEP_ORDER: Step[] = ['presets', 'format', 'strictness', 'generate'];

// --- Utility ---
const cn = (...classes: (string | boolean | undefined)[]): string => 
  classes.filter(Boolean).join(' ');

// Theme-aware code block styles
const _getCodeBlockStyles = (): { background: string; color: string; border: string } => ({
  background: 'var(--code-bg, #161b22)',
  color: 'var(--code-text, #c9d1d9)',
  border: '1px solid var(--code-border, #30363d)',
});

const _getTokenColors = (): { keyword: string; string: string; number: string; comment: string; property: string; function: string; punctuation: string } => ({
  keyword: 'var(--token-keyword, #ff7b72)',
  string: 'var(--token-string, #a5d6ff)',
  number: 'var(--token-number, #79c0ff)',
  comment: 'var(--token-comment, #8b949e)',
  property: 'var(--token-property, #7ee787)',
  function: 'var(--token-function, #d2a8ff)',
  punctuation: 'var(--token-punctuation, #c9d1d9)',
});

// --- Components ---

const Card = ({ 
  children, 
  className, 
  onClick, 
  selected = false,
  disabled = false
}: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}): React.ReactNode => (
  <motion.div
    whileHover={!disabled ? { y: -4, scale: 1.01 } : {}}
    whileTap={!disabled ? { scale: 0.98 } : {}}
    onClick={!disabled ? onClick : undefined}
    className={cn(
      'relative rounded-2xl border-2 p-5 transition-all duration-300',
      selected 
        ? 'border-[var(--dev-accent)] bg-[var(--dev-accent)]/10 shadow-lg shadow-[var(--dev-accent)]/20' 
        : 'border-[var(--dev-border)] bg-[var(--dev-surface)] hover:border-[var(--dev-accent)]/30 hover:bg-[var(--dev-surface-hover)]',
      disabled && 'opacity-50 cursor-not-allowed',
      onClick && !disabled && 'cursor-pointer',
      className
    )}
  >
    {selected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[var(--dev-accent)] flex items-center justify-center"
      >
        <Check className="w-4 h-4 text-[var(--dev-text)]" />
      </motion.div>
    )}
    {children}
  </motion.div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  className
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
}): React.ReactNode => (
  <motion.button
    whileHover={!disabled ? { scale: 1.02 } : {}}
    whileTap={!disabled ? { scale: 0.98 } : {}}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200',
      variant === 'primary' && 'bg-[var(--dev-accent)] hover:bg-[var(--dev-accent)]/90 text-[var(--dev-text)] shadow-lg shadow-[var(--dev-accent)]/25',
      variant === 'secondary' && 'bg-[var(--dev-surface-hover)] hover:bg-[var(--dev-border)] text-[var(--dev-text)]',
      variant === 'ghost' && 'hover:bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)]',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}
  >
    {children}
  </motion.button>
);

// --- Step Components ---

const PresetsStep = ({
  selected,
  onToggle,
}: {
  selected: PresetType[];
  onToggle: (preset: PresetType) => void;
}): React.ReactNode => {
  const presetColors: Record<PresetType, { bg: string; border: string; icon: string }> = {
    'strict-typescript': { bg: 'bg-red-500/10', border: 'border-red-500/50', icon: 'text-red-500' },
    'react-optimized': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/50', icon: 'text-cyan-500' },
    'performance': { bg: 'bg-green-500/10', border: 'border-green-500/50', icon: 'text-green-500' },
    'accessibility': { bg: 'bg-purple-500/10', border: 'border-purple-500/50', icon: 'text-purple-500' },
    'security': { bg: 'bg-amber-500/10', border: 'border-amber-500/50', icon: 'text-amber-500' },
    'recommended': { bg: 'bg-[var(--dev-accent)]/10', border: 'border-[var(--dev-accent)]/50', icon: 'text-[var(--dev-accent)]' },
  };

  const presetIcons: Record<PresetType, React.ReactNode> = {
    'strict-typescript': <Code2 className="w-6 h-6" />,
    'react-optimized': <Zap className="w-6 h-6" />,
    'performance': <Zap className="w-6 h-6" />,
    'accessibility': <Layout className="w-6 h-6" />,
    'security': <Shield className="w-6 h-6" />,
    'recommended': <Sparkles className="w-6 h-6" />,
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-[var(--dev-text)] mb-2"
        >
          Choose Your Presets
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[var(--dev-text-muted)]"
        >
          Select one or more configurations that match your project needs
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.entries(presets) as [PresetType, Preset][]).map(([key, preset], index) => {
          const isSelected = selected.includes(key);
          const colors = presetColors[key];
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                selected={isSelected}
                onClick={() => onToggle(key)}
                className={cn(
                  'h-full',
                  isSelected && colors.bg
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                  colors.bg,
                  colors.icon
                )}>
                  {presetIcons[key]}
                </div>
                <h3 className="font-semibold text-[var(--dev-text)] mb-1">{preset.name}</h3>
                <p className="text-sm text-[var(--dev-text-muted)] mb-3">{preset.description}</p>
                <div className="flex flex-wrap gap-1">
                  {preset.recommendedFor.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const FormatStep = ({
  value,
  onChange,
}: {
  value: ConfigFormat;
  onChange: (format: ConfigFormat) => void;
}): React.ReactNode => {
  const formats: { id: ConfigFormat; label: string; desc: string; icon: React.ElementType }[] = [
    { id: 'json', label: 'JSON', desc: '.eslintrc.json — Traditional format', icon: FileJson },
    { id: 'js', label: 'JavaScript', desc: '.eslintrc.js — With logic support', icon: FileCode },
    { id: 'flat', label: 'Flat Config', desc: 'eslint.config.js — New format', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-[var(--dev-text)] mb-2"
        >
          Select Format
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[var(--dev-text-muted)]"
        >
          Choose how you want to save your ESLint configuration
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {formats.map((format, index) => (
          <motion.div
            key={format.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              selected={value === format.id}
              onClick={() => onChange(format.id)}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <format.icon className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-semibold text-[var(--dev-text)] mb-1">{format.label}</h3>
              <p className="text-sm text-[var(--dev-text-muted)]">{format.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

type StrictnessLevel = NonNullable<ConfigGenerationOptions['strictness']>;

const StrictnessStep = ({
  value,
  onChange,
}: {
  value: StrictnessLevel;
  onChange: (strictness: StrictnessLevel) => void;
}): React.ReactNode => {
  const options: { id: StrictnessLevel; label: string; desc: string; color: string }[] = [
    { id: 'lenient', label: 'Lenient', desc: 'Warnings only, fewer rules', color: 'from-green-500/20 to-emerald-500/20' },
    { id: 'moderate', label: 'Moderate', desc: 'Balanced errors & warnings', color: 'from-blue-500/20 to-cyan-500/20' },
    { id: 'strict', label: 'Strict', desc: 'Most rules as errors', color: 'from-red-500/20 to-rose-500/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-[var(--dev-text)] mb-2"
        >
          Set Strictness Level
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[var(--dev-text-muted)]"
        >
          How strict should the ESLint rules be?
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {options.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              selected={value === option.id}
              onClick={() => onChange(option.id)}
              className="text-center"
            >
              <div className={cn(
                'w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4',
                option.color
              )}>
                <Shield className="w-10 h-10 text-[var(--dev-text)]/80" />
              </div>
              <h3 className="font-semibold text-[var(--dev-text)] mb-1">{option.label}</h3>
              <p className="text-sm text-[var(--dev-text-muted)]">{option.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const GenerateStep = ({
  generatedConfig,
  format,
  selectedPresets,
  strictness,
  onPreview,
}: {
  generatedConfig: ReturnType<typeof generateESLintConfig> | null;
  format: ConfigFormat;
  selectedPresets: PresetType[];
  strictness: NonNullable<ConfigGenerationOptions['strictness']>;
  onPreview: () => void;
}): React.ReactNode => {
  if (!generatedConfig) return null;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-[var(--dev-text)] mb-2"
        >
          Your Config is Ready!
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[var(--dev-text-muted)]"
        >
          Preview your configuration or download it directly
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-[var(--dev-surface)] border border-[var(--dev-border)] p-6"
        >
          <h3 className="text-lg font-semibold text-[var(--dev-text)] mb-4">Configuration Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[var(--dev-border)]">
              <span className="text-[var(--dev-text-muted)]">Presets</span>
              <span className="text-[var(--dev-text)] font-medium">{selectedPresets.length} selected</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--dev-border)]">
              <span className="text-[var(--dev-text-muted)]">Format</span>
              <span className="text-[var(--dev-text)] font-medium capitalize">{format}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--dev-border)]">
              <span className="text-[var(--dev-text-muted)]">Strictness</span>
              <span className="text-[var(--dev-text)] font-medium capitalize">{strictness}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[var(--dev-text-muted)]">Impact</span>
              <span className="text-green-500 font-medium">
                {generatedConfig.estimatedImpact.wouldCatch} issues caught
              </span>
            </div>
          </div>

          {generatedConfig.rules.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-[var(--dev-text-muted)] mb-2">Rules based on detected issues:</p>
              <div className="flex flex-wrap gap-2">
                {generatedConfig.rules.slice(0, 6).map((rule) => (
                  <span
                    key={rule.rule}
                    className={cn(
                      'px-2 py-1 rounded-lg text-xs font-medium border',
                      rule.category === 'error'
                        ? 'bg-red-500/10 text-red-500 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    )}
                  >
                    {rule.rule}
                  </span>
                ))}
                {generatedConfig.rules.length > 6 && (
                  <span className="px-2 py-1 rounded-lg text-xs text-[var(--dev-text-muted)] bg-[var(--dev-surface-hover)]">
                    +{generatedConfig.rules.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Actions Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-gradient-to-br from-[var(--dev-accent)]/10 to-purple-500/10 border border-[var(--dev-accent)]/20 p-6 flex flex-col justify-center items-center text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--dev-accent)] to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-[var(--dev-accent)]/25">
            <Code2 className="w-10 h-10 text-[var(--dev-text)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--dev-text)] mb-2">Ready to Export</h3>
          <p className="text-[var(--dev-text-muted)] mb-6">Preview, copy, or download your ESLint configuration</p>
          <Button onClick={onPreview} className="w-full max-w-xs justify-center">
            <Sparkles className="w-5 h-5" />
            Preview Configuration
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

// --- Preview Modal ---

const PreviewModal = ({
  isOpen,
  onClose,
  generatedConfig,
  format,
  isDark,
}: {
  isOpen: boolean;
  onClose: () => void;
  generatedConfig: ReturnType<typeof generateESLintConfig> | null;
  format: ConfigFormat;
  isDark: boolean;
}): React.ReactNode => {
  const [activeTab, setActiveTab] = useState<'config' | 'install' | 'vscode'>('config');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !generatedConfig) return null;

  const handleCopy = async (): Promise<void> => {
    try {
      const content = activeTab === 'config' ? generatedConfig.content :
                      activeTab === 'install' ? generateInstallCommands(generatedConfig.plugins) :
                      JSON.stringify({
                        'editor.formatOnSave': true,
                        'editor.codeActionsOnSave': { 'source.fixAll.eslint': 'explicit' },
                        'eslint.validate': ['javascript', 'typescript', 'typescriptreact'],
                      }, null, 2);
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDownload = (): void => {
    const filename = format === 'json' ? '.eslintrc.json' : format === 'js' ? '.eslintrc.js' : 'eslint.config.js';
    const blob = new Blob([generatedConfig.content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const tabs = [
    { id: 'config', label: 'Config', icon: Code2 },
    { id: 'install', label: 'Install', icon: Terminal },
    { id: 'vscode', label: 'VS Code', icon: Layout },
  ] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-[var(--dev-bg)] rounded-2xl border border-[var(--dev-border)] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--dev-border)] bg-[var(--dev-surface)]">
              <div className="flex items-center gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      activeTab === tab.id
                        ? 'bg-[var(--dev-accent)] text-[var(--dev-text)]'
                        : 'text-[var(--dev-text-muted)] hover:text-[var(--dev-text)] hover:bg-[var(--dev-surface-hover)]'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg hover:bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)] transition-colors"
                  title="Copy"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
                {activeTab === 'config' && (
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-lg hover:bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)] transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-[var(--dev-bg)]">
              {activeTab === 'config' && (
                <div dangerouslySetInnerHTML={{ 
                  __html: createCodeBlock(generatedConfig.content, format === 'json' ? 'json' : 'javascript', isDark) 
                }} />
              )}
              {activeTab === 'install' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[var(--dev-text-muted)] text-sm">
                    <Info className="w-4 h-4" />
                    Run these commands to install required plugins
                  </div>
                  <div dangerouslySetInnerHTML={{ 
                    __html: createCodeBlock(generateInstallCommands(generatedConfig.plugins), 'bash', isDark) 
                  }} />
                </div>
              )}
              {activeTab === 'vscode' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--dev-accent)]/10 border border-[var(--dev-accent)]/20 text-sm text-[var(--dev-text)]">
                    Add these settings to your <code className="text-[var(--dev-accent)]">.vscode/settings.json</code>
                  </div>
                  <div dangerouslySetInnerHTML={{ 
                    __html: createCodeBlock(JSON.stringify({
                      'editor.formatOnSave': true,
                      'editor.codeActionsOnSave': { 'source.fixAll.eslint': 'explicit' },
                      'eslint.validate': ['javascript', 'typescript', 'typescriptreact'],
                    }, null, 2), 'json', isDark)
                  }} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
    </AnimatePresence>
  );
};

// --- Main Component ---

export function ESLintConfigGenerator(): React.ReactNode {
  const report = useAnalysisStore((state) => state.currentReport);
  const resolvedMode = useThemeStore((state) => state.resolvedMode);
  const isDark = resolvedMode === 'dark';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  const [format, setFormat] = useState<ConfigFormat>('json');
  const [strictness, setStrictness] = useState<NonNullable<ConfigGenerationOptions['strictness']>>('moderate');
  const [selectedPresets, setSelectedPresets] = useState<PresetType[]>(['recommended']);

  const generatedConfig = useMemo(() => {
    if (!report) return null;
    return generateESLintConfig(report.typescript, report.javascript, undefined, {
      format,
      presets: selectedPresets,
      strictness,
    });
  }, [report, format, selectedPresets, strictness]);

  const handlePresetToggle = useCallback((preset: PresetType) => {
    setSelectedPresets(prev => 
      prev.includes(preset) ? prev.filter(p => p !== preset) : [...prev, preset]
    );
  }, []);

  const goToStep = (index: number): void => {
    // Allow going to any step if we have at least one preset selected
    if (selectedPresets.length === 0 && index > 0) return;
    setCurrentStep(index);
  };

  const canProceed = currentStep < STEPS.length - 1 && (
    currentStep === 0 ? selectedPresets.length > 0 : true
  );

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-[var(--dev-text-muted)]">
        <div className="w-24 h-24 rounded-3xl bg-[var(--dev-surface)] flex items-center justify-center mb-6">
          <Code2 className="w-12 h-12 opacity-50" />
        </div>
        <p className="text-xl font-semibold text-[var(--dev-text)] mb-2">No Analysis Available</p>
        <p className="text-sm">Run an analysis first to generate an ESLint configuration</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--dev-accent)] to-purple-500 mb-4 shadow-lg shadow-[var(--dev-accent)]/25"
        >
          <Shield className="w-8 h-8 text-[var(--dev-text)]" />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-[var(--dev-text)] mb-2"
        >
          ESLint Config Generator
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[var(--dev-text-muted)]"
        >
          Generate custom ESLint configuration based on your codebase
        </motion.p>
      </div>

      {/* Progress Steps */}
      <div className="mb-10">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isClickable = selectedPresets.length > 0 || index === 0;
            
            return (
              <div key={step.id} className="flex items-center">
                <motion.button
                  whileHover={isClickable ? { scale: 1.05 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                  onClick={() => isClickable && goToStep(index)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300',
                    isActive 
                      ? 'bg-[var(--dev-accent)] text-[var(--dev-text)] shadow-lg shadow-[var(--dev-accent)]/25' 
                      : isCompleted
                        ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                        : 'bg-[var(--dev-surface)] text-[var(--dev-text-muted)] border border-[var(--dev-border)]',
                    !isClickable && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    isActive ? 'bg-[var(--dev-text)]/20' : isCompleted ? 'bg-green-500/20' : 'bg-[var(--dev-surface-hover)]'
                  )}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs opacity-70">{step.description}</p>
                  </div>
                </motion.button>
                
                {index < STEPS.length - 1 && (
                  <div className="w-8 h-px bg-[var(--dev-border)] mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && (
              <PresetsStep selected={selectedPresets} onToggle={handlePresetToggle} />
            )}
            {currentStep === 1 && (
              <FormatStep value={format} onChange={setFormat} />
            )}
            {currentStep === 2 && (
              <StrictnessStep value={strictness} onChange={setStrictness} />
            )}
            {currentStep === 3 && (
              <GenerateStep
                generatedConfig={generatedConfig}
                format={format}
                selectedPresets={selectedPresets}
                strictness={strictness}
                onPreview={() => setShowPreview(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        
        <Button
          onClick={() => setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1))}
          disabled={!canProceed}
        >
          {currentStep === STEPS.length - 1 ? 'Finish' : 'Continue'}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        generatedConfig={generatedConfig}
        format={format}
        isDark={isDark}
      />
    </div>
  );
}
