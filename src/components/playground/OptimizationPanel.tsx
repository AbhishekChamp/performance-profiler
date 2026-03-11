import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Image, 
  Accessibility, 
  Terminal, 
  Package, 
  Type, 
  Zap, 
  Code, 
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { PlaygroundFile } from '@/types/playground';
import { getApplicablePresets, applyPresets, estimateSizeChange } from '@/core/playground/transformer';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const ICONS: Record<string, React.ElementType> = {
  image: Image,
  accessibility: Accessibility,
  terminal: Terminal,
  package: Package,
  type: Type,
  zap: Zap,
  code: Code,
  'refresh-cw': RefreshCw,
};

interface OptimizationPanelProps {
  file: PlaygroundFile | undefined;
  onApply: (content: string) => void;
}

export function OptimizationPanel({ file, onApply }: OptimizationPanelProps) {
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const presets = useMemo(() => {
    if (!file) return [];
    return getApplicablePresets(file.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.language]);
  
  const sizeChange = useMemo(() => {
    if (!file || !preview) return null;
    return estimateSizeChange(file.modifiedContent, preview);
  }, [file, preview]);
  
  const togglePreset = (presetId: string) => {
    setSelectedPresets(prev => {
      const newSelection = prev.includes(presetId)
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId];
      
      // Update preview
      if (file && newSelection.length > 0) {
        const result = applyPresets(file.modifiedContent, newSelection, file.language);
        setPreview(result);
        setShowPreview(true);
      } else {
        setPreview(null);
        setShowPreview(false);
      }
      
      return newSelection;
    });
  };
  
  const handleApply = () => {
    if (!file || !preview) return;
    
    onApply(preview);
    toast.success(`${selectedPresets.length} optimization${selectedPresets.length > 1 ? 's' : ''} applied!`);
    
    // Reset selection
    setSelectedPresets([]);
    setPreview(null);
    setShowPreview(false);
  };
  
  const handleApplyAll = () => {
    if (!file) return;
    
    const allPresetIds = presets.map(p => p.id);
    const result = applyPresets(file.modifiedContent, allPresetIds, file.language);
    
    onApply(result);
    toast.success('All optimizations applied!');
    
    setSelectedPresets([]);
    setPreview(null);
    setShowPreview(false);
  };
  
  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Sparkles size={48} className="text-dev-text-subtle mb-4" />
        <p className="text-dev-text-muted">Select a file to see available optimizations</p>
      </div>
    );
  }
  
  if (presets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle size={48} className="text-dev-text-subtle mb-4" />
        <p className="text-dev-text-muted">No optimizations available for this file type</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-dev-text">Quick Fixes</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleApplyAll}
          leftIcon={<Zap size={14} />}
        >
          Apply All
        </Button>
      </div>
      
      {/* Presets List */}
      <div className="space-y-2">
        {presets.map(preset => {
          const Icon = ICONS[preset.icon] || Zap;
          const isSelected = selectedPresets.includes(preset.id);
          
          return (
            <motion.button
              key={preset.id}
              onClick={() => togglePreset(preset.id)}
              className={`
                w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all
                ${isSelected 
                  ? 'bg-dev-accent/10 border border-dev-accent/30' 
                  : 'bg-dev-bg border border-transparent hover:border-dev-border'
                }
              `}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className={`
                p-2 rounded-lg flex-shrink-0
                ${isSelected ? 'bg-dev-accent/20' : 'bg-dev-surface'}
              `}>
                <Icon size={16} className={isSelected ? 'text-dev-accent' : 'text-dev-text'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isSelected ? 'text-dev-accent' : 'text-dev-text'}`}>
                    {preset.name}
                  </span>
                  {isSelected && <Check size={14} className="text-dev-accent" />}
                </div>
                <p className="text-sm text-dev-text-muted mt-0.5">{preset.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {/* Preview Panel */}
      {showPreview && preview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border border-dev-border rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full flex items-center justify-between p-3 bg-dev-surface hover:bg-dev-surface-hover transition-colors"
          >
            <span className="font-medium text-dev-text">Preview Changes</span>
            {showPreview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {showPreview && (
            <div className="p-3 space-y-3">
              {/* Size Impact */}
              {sizeChange && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dev-text-muted">Size Impact:</span>
                  <span className={sizeChange.change < 0 ? 'text-dev-success' : 'text-dev-danger'}>
                    {sizeChange.change > 0 ? '+' : ''}{sizeChange.change} bytes 
                    ({sizeChange.changePercent > 0 ? '+' : ''}{sizeChange.changePercent}%)
                  </span>
                </div>
              )}
              
              {/* Code Preview */}
              <div className="bg-dev-bg rounded p-2 overflow-x-auto">
                <pre className="text-xs text-dev-text-muted">
                  <code>{preview.substring(0, 200)}...</code>
                </pre>
              </div>
              
              {/* Apply Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleApply}
                fullWidth
                leftIcon={<Check size={14} />}
              >
                Apply {selectedPresets.length} Optimization{selectedPresets.length > 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Tips */}
      <div className="p-3 bg-dev-accent/5 border border-dev-accent/20 rounded-lg">
        <h4 className="text-sm font-medium text-dev-text mb-2 flex items-center gap-2">
          <AlertCircle size={14} className="text-dev-accent" />
          Tips
        </h4>
        <ul className="space-y-1 text-xs text-dev-text-muted">
          <li>• Click on a fix to preview changes before applying</li>
          <li>• Multiple fixes can be applied at once</li>
          <li>• Use &quot;Apply All&quot; to apply all available optimizations</li>
          <li>• Revert button restores the original code</li>
        </ul>
      </div>
    </div>
  );
}
