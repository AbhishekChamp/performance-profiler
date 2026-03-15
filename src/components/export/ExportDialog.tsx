import { useState } from 'react';
import type { AnalysisReport } from '@/types';
import { copyToClipboard, exportReport, formatMetricsForSharing } from '@/utils/export';
import { Check, FileCode, FileDown, FileJson, FileText, Share2, X } from 'lucide-react';

interface ExportDialogProps {
  report: AnalysisReport;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ report, isOpen, onClose }: ExportDialogProps): React.ReactNode {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExport = (format: 'json' | 'pdf' | 'html' | 'markdown'): void => {
    exportReport(report, format);
  };

  const handleShare = async (): Promise<void> => {
    const text = formatMetricsForSharing(report);
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dev-surface rounded-xl border border-dev-border w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dev-border">
          <h2 className="text-lg font-semibold text-dev-text">Export Report</h2>
          <button
            onClick={onClose}
            className="text-dev-text-muted hover:text-dev-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Options */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleExport('json')}
              className="flex flex-col items-center gap-2 p-4 bg-dev-bg border border-dev-border rounded-lg hover:border-dev-accent transition-colors"
            >
              <FileJson className="w-8 h-8 text-dev-accent" />
              <span className="text-sm text-dev-text">JSON</span>
              <span className="text-xs text-dev-text-muted">Machine readable</span>
            </button>

            <button
              onClick={() => handleExport('pdf')}
              className="flex flex-col items-center gap-2 p-4 bg-dev-bg border border-dev-border rounded-lg hover:border-dev-accent transition-colors"
            >
              <FileDown className="w-8 h-8 text-red-400" />
              <span className="text-sm text-dev-text">PDF</span>
              <span className="text-xs text-dev-text-muted">Print & share</span>
            </button>

            <button
              onClick={() => handleExport('html')}
              className="flex flex-col items-center gap-2 p-4 bg-dev-bg border border-dev-border rounded-lg hover:border-dev-accent transition-colors"
            >
              <FileCode className="w-8 h-8 text-orange-400" />
              <span className="text-sm text-dev-text">HTML</span>
              <span className="text-xs text-dev-text-muted">Self-contained</span>
            </button>

            <button
              onClick={() => handleExport('markdown')}
              className="flex flex-col items-center gap-2 p-4 bg-dev-bg border border-dev-border rounded-lg hover:border-dev-accent transition-colors"
            >
              <FileText className="w-8 h-8 text-blue-400" />
              <span className="text-sm text-dev-text">Markdown</span>
              <span className="text-xs text-dev-text-muted">GitHub friendly</span>
            </button>
          </div>

          {/* Share Section */}
          <div className="border-t border-dev-border pt-4">
            <h3 className="text-sm font-medium text-dev-text mb-3">Quick Share</h3>
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 p-3 bg-dev-accent/10 border border-dev-accent/30 rounded-lg hover:bg-dev-accent/20 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-400">Copied to clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5 text-dev-accent" />
                  <span className="text-sm text-dev-text">Copy metrics summary</span>
                </>
              )}
            </button>
          </div>

          {/* Report Info */}
          <div className="text-center text-xs text-dev-text-subtle">
            <p>Report ID: {report.id}</p>
            <p>Generated: {new Date(report.timestamp).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
