import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Download, 
  Check, 
  FileCode, 
  Terminal, 
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Package,
  Zap,
  Image,
  Type,
  Settings
} from 'lucide-react';
import { PlatformSelector, PlatformCard } from './PlatformSelector';
import { Button } from '@/components/ui/Button';
import { 
  generateConfig, 
  generateBudgetCheckScript, 
  getAllPlatforms,
  validateBudget,
  PLATFORMS 
} from '@/core/ci-cd';
import { createCodeBlock, getLanguageFromFilename, type Language } from '@/utils/syntaxHighlight';
import type { CIPlatform, BudgetConfig, PerformanceBudget } from '@/types/cicd';
import toast from 'react-hot-toast';

// Budget input component
function BudgetInput({ 
  label, 
  value, 
  onChange, 
  unit = 'KB',
  icon: Icon,
  min = 0,
  max = 10000
}: { 
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  unit?: string;
  icon: React.ElementType;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-dev-text">
        <Icon size={16} className="text-dev-accent" />
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value) : undefined;
            onChange(val);
          }}
          min={min}
          max={max}
          placeholder="Unlimited"
          className="flex-1 px-3 py-2 bg-dev-bg border border-dev-border rounded-lg
                     text-sm text-dev-text focus:outline-none focus:ring-2 focus:ring-dev-accent/50
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-sm text-dev-text-muted w-12">{unit}</span>
      </div>
    </div>
  );
}

// Tab component
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 text-sm font-medium transition-colors border-b-2
        ${active 
          ? 'text-dev-accent border-dev-accent' 
          : 'text-dev-text-muted border-transparent hover:text-dev-text hover:border-dev-border'
        }
      `}
    >
      {children}
    </button>
  );
}

// Setup instructions component
function SetupInstructions({ config }: { config: ReturnType<typeof generateConfig> }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-dev-text flex items-center gap-2">
        <Terminal size={18} />
        Setup Instructions
      </h3>
      
      <ol className="space-y-3">
        {config.setupInstructions.map((step, index) => (
          <li key={index} className="flex gap-3 text-sm text-dev-text">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-dev-accent/20 text-dev-accent 
                           flex items-center justify-center text-xs font-medium">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      
      {config.requiredPlugins.length > 0 && (
        <div className="mt-4 p-3 bg-dev-surface rounded-lg">
          <p className="text-sm text-dev-text-muted mb-2">Required plugins/packages:</p>
          <div className="flex flex-wrap gap-2">
            {config.requiredPlugins.map(plugin => (
              <code key={plugin} className="px-2 py-1 bg-dev-bg rounded text-xs text-dev-accent">
                {plugin}
              </code>
            ))}
          </div>
        </div>
      )}
      
      {config.requiredEnvVars && config.requiredEnvVars.length > 0 && (
        <div className="mt-4 p-3 bg-dev-warning/10 border border-dev-warning/30 rounded-lg">
          <p className="text-sm text-dev-warning mb-2">Required environment variables:</p>
          <ul className="space-y-1">
            {config.requiredEnvVars.map(env => (
              <li key={env} className="text-sm text-dev-text font-mono">
                {env}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CICDConfigGenerator() {
  const [selectedPlatform, setSelectedPlatform] = useState<CIPlatform | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'script' | 'instructions'>('config');
  const [copied, setCopied] = useState(false);
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
  
  const highlightedConfig = useMemo(() => {
    if (!config) return '';
    const lang = getLanguageFromFilename(config.filename);
    return createCodeBlock(config.content, lang);
  }, [config]);
  
  const handleCopy = async () => {
    if (!config) return;
    
    try {
      await navigator.clipboard.writeText(config.content);
      setCopied(true);
      toast.success('Config copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy config');
    }
  };
  
  const handleDownload = () => {
    if (!config) return;
    
    const blob = new Blob([config.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = config.filename.split('/').pop() || 'config.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Config downloaded!');
  };
  
  const handleDownloadScript = () => {
    const blob = new Blob([checkScript.script], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = checkScript.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Script downloaded!');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-dev-text flex items-center gap-2">
          <FileCode className="text-dev-accent" size={28} />
          CI/CD Config Generator
        </h2>
        <p className="text-sm text-dev-text-muted mt-1">
          Generate performance budget configurations for your CI/CD pipeline
        </p>
      </div>
      
      {/* Budget Configuration */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="font-medium text-dev-text mb-4 flex items-center gap-2">
          <Settings size={18} />
          Performance Budgets
        </h3>
        
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-dev-danger/10 border border-dev-danger/30 rounded-lg">
            <div className="flex items-center gap-2 text-dev-danger">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">Validation Errors</span>
            </div>
            <ul className="mt-2 space-y-1">
              {validationErrors.map((error, i) => (
                <li key={i} className="text-sm text-dev-text">{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BudgetInput
            label="Total Bundle Size"
            value={budgets.bundleSize}
            onChange={(v) => setBudgets(b => ({ ...b, bundleSize: v }))}
            icon={Package}
          />
          <BudgetInput
            label="JavaScript Size"
            value={budgets.jsSize}
            onChange={(v) => setBudgets(b => ({ ...b, jsSize: v }))}
            icon={FileCode}
          />
          <BudgetInput
            label="CSS Size"
            value={budgets.cssSize}
            onChange={(v) => setBudgets(b => ({ ...b, cssSize: v }))}
            icon={Zap}
          />
          <BudgetInput
            label="Image Size"
            value={budgets.imageSize}
            onChange={(v) => setBudgets(b => ({ ...b, imageSize: v }))}
            icon={Image}
          />
          <BudgetInput
            label="Font Size"
            value={budgets.fontSize}
            onChange={(v) => setBudgets(b => ({ ...b, fontSize: v }))}
            icon={Type}
          />
        </div>
        
        <div className="mt-6 pt-6 border-t border-dev-border">
          <h4 className="text-sm font-medium text-dev-text mb-3">Lighthouse Score Thresholds</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['lighthousePerformance', 'lighthouseAccessibility', 'lighthouseBestPractices', 'lighthouseSEO'] as const).map((key) => (
              <BudgetInput
                key={key}
                label={key.replace('lighthouse', '')}
                value={budgets[key]}
                onChange={(v) => setBudgets(b => ({ ...b, [key]: v }))}
                icon={Zap}
                unit="/100"
                max={100}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Platform Selection */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="font-medium text-dev-text mb-4">Select CI/CD Platform</h3>
        
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
      
      {/* Generated Config */}
      <AnimatePresence>
        {config && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-panel rounded-xl overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex items-center justify-between px-6 border-b border-dev-border">
              <div className="flex gap-4">
                <Tab active={activeTab === 'config'} onClick={() => setActiveTab('config')}>
                  Config File
                </Tab>
                <Tab active={activeTab === 'script'} onClick={() => setActiveTab('script')}>
                  Check Script
                </Tab>
                <Tab active={activeTab === 'instructions'} onClick={() => setActiveTab('instructions')}>
                  Setup Guide
                </Tab>
              </div>
              
              <div className="flex items-center gap-2 py-2">
                <span className="text-sm text-dev-text-muted">{config.filename}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownload}
                  leftIcon={<Download size={16} />}
                >
                  Download
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {activeTab === 'config' && (
                <div 
                  className="overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: highlightedConfig }}
                />
              )}
              
              {activeTab === 'script' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-dev-text">{checkScript.name}</h4>
                      <p className="text-sm text-dev-text-muted">{checkScript.description}</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownloadScript}
                      leftIcon={<Download size={16} />}
                    >
                      Download Script
                    </Button>
                  </div>
                  <div 
                    className="overflow-x-auto"
                    dangerouslySetInnerHTML={{ 
                      __html: createCodeBlock(checkScript.script, 'javascript') 
                    }}
                  />
                </div>
              )}
              
              {activeTab === 'instructions' && <SetupInstructions config={config} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Tips */}
      <div className="glass-panel rounded-xl p-4 bg-dev-accent/5 border-dev-accent/20">
        <h4 className="font-medium text-dev-text mb-2 flex items-center gap-2">
          <AlertCircle size={16} className="text-dev-accent" />
          Tips for Performance Budgets
        </h4>
        <ul className="space-y-1 text-sm text-dev-text-muted">
          <li>• Set realistic budgets based on your current build sizes</li>
          <li>• Use Lighthouse CI for automated performance testing</li>
          <li>• Review and adjust budgets quarterly as your app grows</li>
          <li>• Consider different budgets for mobile vs desktop builds</li>
          <li>• Enable PR comments to catch budget violations early</li>
        </ul>
      </div>
    </div>
  );
}
