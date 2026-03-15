import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, CheckCircle, Code2, Copy, Download, FileCode, FileJson, Terminal } from 'lucide-react';
import { type ConfigFormat, type ConfigGenerationOptions, generateESLintConfig, generateInstallCommands, presets } from '@/core/eslint';
import { useAnalysisStore } from '@/stores/analysisStore';
import { Modal } from '@/components/ui/Modal';
import { syntaxHighlight } from '@/utils/syntaxHighlight';
import toast from 'react-hot-toast';

export function ESLintConfigGenerator(): React.ReactNode {
  const report = useAnalysisStore((state) => state.currentReport);
  const [format, setFormat] = useState<ConfigFormat>('json');
  const [strictness, setStrictness] = useState<ConfigGenerationOptions['strictness']>('moderate');
  const [selectedPresets, setSelectedPresets] = useState<string[]>(['recommended']);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatedConfig = report
    ? generateESLintConfig(
        report.typescript,
        report.javascript,
        undefined,
        {
          format,
          presets: selectedPresets as ConfigGenerationOptions['presets'],
          strictness,
        }
      )
    : null;

  const handlePresetToggle = (presetKey: string): void => {
    setSelectedPresets((prev) =>
      prev.includes(presetKey)
        ? prev.filter((p) => p !== presetKey)
        : [...prev, presetKey]
    );
  };

  const handleCopy = useCallback(async () => {
    if (!generatedConfig) return;
    
    try {
      await navigator.clipboard.writeText(generatedConfig.content);
      setCopied(true);
      toast.success('Config copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy config');
    }
  }, [generatedConfig]);

  const handleDownload = useCallback(() => {
    if (!generatedConfig) return;

    const filename =
      format === 'json'
        ? '.eslintrc.json'
        : format === 'js'
        ? '.eslintrc.js'
        : 'eslint.config.js';

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
  }, [generatedConfig, format]);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-dev-text-muted">
        <Code2 className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No Analysis Available</p>
        <p className="text-sm mt-2">Run an analysis first to generate ESLint configuration</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dev-text">ESLint Config Generator</h2>
          <p className="text-dev-text-muted mt-1">
            Generate custom ESLint configuration based on detected issues
          </p>
        </div>
        {generatedConfig && (
          <div className="text-right">
            <div className="text-sm text-dev-text-muted">Estimated Impact</div>
            <div className="text-2xl font-bold text-dev-success-bright">
              {generatedConfig.estimatedImpact.wouldCatch} / {generatedConfig.estimatedImpact.totalIssues}
            </div>
            <div className="text-xs text-dev-text-subtle">issues would be caught</div>
          </div>
        )}
      </div>

      {/* Configuration Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Presets */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-dev-text-muted uppercase tracking-wider">
            Configuration Presets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(presets).map(([key, preset]) => (
              <motion.button
                key={key}
                onClick={() => handlePresetToggle(key)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedPresets.includes(key)
                    ? 'bg-dev-accent/10 border-dev-accent/50'
                    : 'bg-dev-surface border-dev-border hover:border-dev-accent/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedPresets.includes(key)
                        ? 'bg-dev-accent border-dev-accent'
                        : 'border-dev-text-subtle'
                    }`}
                  >
                    {selectedPresets.includes(key) && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="font-medium text-dev-text">{preset.name}</span>
                </div>
                <p className="text-sm text-dev-text-muted">{preset.description}</p>
                <p className="text-xs text-dev-text-subtle mt-2">
                  Recommended for: {preset.recommendedFor.join(', ')}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-semibold text-dev-text-muted uppercase tracking-wider mb-3">
              Config Format
            </h3>
            <div className="space-y-2">
              {[
                { key: 'json', label: 'JSON (.eslintrc.json)', icon: FileJson },
                { key: 'js', label: 'JavaScript (.eslintrc.js)', icon: FileCode },
                { key: 'flat', label: 'Flat Config (eslint.config.js)', icon: BookOpen },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFormat(key as ConfigFormat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                    format === key
                      ? 'bg-dev-accent/10 border-dev-accent/50 text-dev-accent'
                      : 'bg-dev-surface border-dev-border hover:border-dev-accent/30 text-dev-text'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Strictness */}
          <div>
            <h3 className="text-sm font-semibold text-dev-text-muted uppercase tracking-wider mb-3">
              Strictness Level
            </h3>
            <div className="space-y-2">
              {[
                { key: 'lenient', label: 'Lenient', desc: 'Warnings only' },
                { key: 'moderate', label: 'Moderate', desc: 'Balanced' },
                { key: 'strict', label: 'Strict', desc: 'Errors for most' },
              ].map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setStrictness(key as typeof strictness)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all ${
                    strictness === key
                      ? 'bg-dev-accent/10 border-dev-accent/50 text-dev-accent'
                      : 'bg-dev-surface border-dev-border hover:border-dev-accent/30 text-dev-text'
                  }`}
                >
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-dev-text-subtle">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detected Issues */}
      {generatedConfig && generatedConfig.rules.length > 0 && (
        <div className="bg-dev-surface border border-dev-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-dev-text-muted uppercase tracking-wider mb-3">
            Rules Based on Detected Issues
          </h3>
          <div className="flex flex-wrap gap-2">
            {generatedConfig.rules.map((rule) => (
              <span
                key={rule.rule}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  rule.category === 'error'
                    ? 'bg-dev-danger/10 text-dev-danger-bright border border-dev-danger/30'
                    : 'bg-dev-warning/10 text-dev-warning-bright border border-dev-warning/30'
                }`}
                title={rule.description}
              >
                {rule.rule}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowPreview(true)}
          className="dev-button flex items-center gap-2"
        >
          <Code2 className="w-4 h-4" />
          Preview Config
        </button>
        <button
          onClick={handleDownload}
          className="dev-button-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="ESLint Configuration">
        <div className="space-y-4">
          {/* Install Commands */}
          <div className="bg-dev-surface border border-dev-border rounded-lg p-4">
            <h4 className="text-sm font-medium text-dev-text mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Installation Commands
            </h4>
            <pre className="text-xs text-dev-text-muted overflow-x-auto whitespace-pre-wrap">
              {generatedConfig ? generateInstallCommands(generatedConfig.plugins) : ''}
            </pre>
            <button
              onClick={() => {
                if (generatedConfig) {
                  navigator.clipboard.writeText(generateInstallCommands(generatedConfig.plugins));
                  toast.success('Commands copied!');
                }
              }}
              className="mt-2 text-xs text-dev-accent hover:underline"
            >
              Copy commands
            </button>
          </div>

          {/* Config Preview */}
          <div className="relative">
            <div className="absolute top-2 right-2">
              <button
                onClick={handleCopy}
                className="p-2 bg-dev-surface hover:bg-dev-surface-hover rounded-md transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-dev-success" />
                ) : (
                  <Copy className="w-4 h-4 text-dev-text-muted" />
                )}
              </button>
            </div>
            <pre
              className="bg-dev-surface border border-dev-border rounded-lg p-4 text-sm overflow-x-auto max-h-96"
              dangerouslySetInnerHTML={{
                __html: generatedConfig
                  ? syntaxHighlight(generatedConfig.content, format === 'json' ? 'json' : 'javascript')
                  : '',
              }}
            />
          </div>

          {/* VS Code Settings */}
          <div className="bg-dev-accent/5 border border-dev-accent/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-dev-accent mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              VS Code Integration
            </h4>
            <p className="text-xs text-dev-text-muted mb-2">
              Add to your .vscode/settings.json for the best experience:
            </p>
            <pre className="text-xs text-dev-text-muted overflow-x-auto">
              {JSON.stringify(
                {
                  'editor.formatOnSave': true,
                  'editor.codeActionsOnSave': {
                    'source.fixAll.eslint': 'explicit',
                  },
                  'eslint.validate': ['javascript', 'typescript', 'typescriptreact'],
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
}
