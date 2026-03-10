import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Wand2,
  Check,
} from 'lucide-react';
import type { PlaygroundFile, PlaygroundIssue } from '@/types/playground';
import { Button } from '@/components/ui/Button';

interface IssueListProps {
  file: PlaygroundFile | undefined;
  onApplyFix: (issueId: string) => void;
}

const SEVERITY_ICONS = {
  error: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const SEVERITY_COLORS = {
  error: 'text-dev-danger bg-dev-danger/10 border-dev-danger/30',
  warning: 'text-dev-warning bg-dev-warning/10 border-dev-warning/30',
  info: 'text-dev-accent bg-dev-accent/10 border-dev-accent/30',
};

function IssueItem({ 
  issue, 
  onApplyFix 
}: { 
  issue: PlaygroundIssue; 
  onApplyFix: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = SEVERITY_ICONS[issue.severity];
  const colorClass = SEVERITY_COLORS[issue.severity];
  
  return (
    <motion.div
      layout
      className={`border rounded-lg overflow-hidden ${colorClass}`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-3 p-3 text-left"
      >
        <Icon size={18} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{issue.message}</span>
            <span className="text-xs opacity-70">Line {issue.line}</span>
          </div>
          <span className="text-xs opacity-70 capitalize">{issue.rule}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-current border-opacity-20"
          >
            <div className="p-3 space-y-3">
              {issue.explanation && (
                <p className="text-sm opacity-90">{issue.explanation}</p>
              )}
              
              <div className="flex items-center gap-2">
                {issue.fixable && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onApplyFix(issue.id)}
                    leftIcon={<Wand2 size={14} />}
                  >
                    Auto-Fix
                  </Button>
                )}
                
                {issue.mdnUrl && (
                  <a
                    href={issue.mdnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm opacity-70 hover:opacity-100"
                  >
                    <ExternalLink size={14} />
                    Learn more
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function IssueList({ file, onApplyFix }: IssueListProps) {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  
  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Check size={48} className="text-dev-text-subtle mb-4" />
        <p className="text-dev-text-muted">Select a file to see issues</p>
      </div>
    );
  }
  
  const filteredIssues = file.issues.filter(issue => 
    filter === 'all' || issue.severity === filter
  );
  
  const issueCounts = {
    all: file.issues.length,
    error: file.issues.filter(i => i.severity === 'error').length,
    warning: file.issues.filter(i => i.severity === 'warning').length,
    info: file.issues.filter(i => i.severity === 'info').length,
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-dev-border">
        {(['all', 'error', 'warning', 'info'] as const).map(severity => (
          <button
            key={severity}
            onClick={() => setFilter(severity)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md transition-colors
              ${filter === severity 
                ? 'bg-dev-accent text-white' 
                : 'text-dev-text-muted hover:bg-dev-surface-hover'
              }
            `}
          >
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
            {issueCounts[severity] > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full">
                {issueCounts[severity]}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Check size={48} className="text-dev-success mb-4" />
            <p className="text-dev-text font-medium">
              {filter === 'all' ? 'No issues found!' : `No ${filter} issues`}
            </p>
            <p className="text-sm text-dev-text-muted mt-1">
              {filter === 'all' 
                ? 'Your code looks great!' 
                : 'Try selecting a different filter'}
            </p>
          </div>
        ) : (
          filteredIssues.map(issue => (
            <IssueItem
              key={issue.id}
              issue={issue}
              onApplyFix={onApplyFix}
            />
          ))
        )}
      </div>
      
      {/* Summary */}
      {file.issues.length > 0 && (
        <div className="p-3 border-t border-dev-border bg-dev-surface">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dev-text-muted">
              {file.issues.length} issue{file.issues.length > 1 ? 's' : ''} found
            </span>
            <span className="text-dev-text-muted">
              {file.issues.filter(i => i.fixable).length} auto-fixable
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
