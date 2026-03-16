import { useState } from 'react';
import { motion } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import { 
  AlertTriangle, 
  GitCommit, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Package,
  Shield,
  Zap,
} from 'lucide-react';
import { DependencyGraph } from './DependencyGraph';
import { useAnalysisStore } from '@/stores/analysisStore';
import { buildDependencyGraph, calculateGraphStats } from '@/core/graph';
import { Button } from '@/components/ui/Button';
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary';

// Stat card component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color = 'default',
  subtext,
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: 'default' | 'danger' | 'warning' | 'success';
  subtext?: string;
}): React.ReactNode {
  const colorStyles = {
    default: {
      bg: 'bg-dev-surface',
      border: 'border-dev-border',
      text: 'text-dev-text',
      iconBg: 'bg-dev-accent/10',
      iconColor: 'text-dev-accent',
    },
    danger: {
      bg: 'bg-dev-danger/5',
      border: 'border-dev-danger/20',
      text: 'text-dev-danger',
      iconBg: 'bg-dev-danger/10',
      iconColor: 'text-dev-danger',
    },
    warning: {
      bg: 'bg-dev-warning/5',
      border: 'border-dev-warning/20',
      text: 'text-dev-warning',
      iconBg: 'bg-dev-warning/10',
      iconColor: 'text-dev-warning',
    },
    success: {
      bg: 'bg-dev-success/5',
      border: 'border-dev-success/20',
      text: 'text-dev-success',
      iconBg: 'bg-dev-success/10',
      iconColor: 'text-dev-success',
    },
  };
  
  const style = colorStyles[color];
  
  return (
    <div className={`${style.bg} border ${style.border} rounded-2xl p-4 hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className={`${style.iconBg} w-10 h-10 rounded-xl flex items-center justify-center`}>
          <Icon size={20} className={style.iconColor} />
        </div>
        {subtext != null && subtext !== '' && (
          <span className="text-xs text-dev-text-muted font-medium">{subtext}</span>
        )}
      </div>
      <div className="mt-3">
        <p className={`text-2xl font-bold ${style.text}`}>{value}</p>
        <p className="text-sm text-dev-text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// Alert banner component
function AlertBanner({ 
  type, 
  title, 
  message,
}: { 
  type: 'error' | 'warning';
  title: string;
  message: string;
}): React.ReactNode {
  const styles = {
    error: {
      bg: 'bg-dev-danger/5',
      border: 'border-dev-danger/20',
      icon: 'text-dev-danger',
      iconBg: 'bg-dev-danger/10',
      title: 'text-dev-danger',
    },
    warning: {
      bg: 'bg-dev-warning/5',
      border: 'border-dev-warning/20',
      icon: 'text-dev-warning',
      iconBg: 'bg-dev-warning/10',
      title: 'text-dev-warning',
    },
  };
  
  const style = styles[type];
  
  return (
    <div className={`${style.bg} border ${style.border} rounded-2xl p-4`}>
      <div className="flex items-start gap-4">
        <div className={`${style.iconBg} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
          <AlertTriangle className={style.icon} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${style.title}`}>{title}</h4>
          <p className="text-sm text-dev-text-muted mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function GraphSection(): React.ReactNode {
  const { currentReport } = useAnalysisStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  if (currentReport == null) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center">
        <div className="w-24 h-24 rounded-3xl bg-dev-surface border border-dev-border flex items-center justify-center mb-6">
          <Layers className="w-12 h-12 text-dev-text-subtle" />
        </div>
        <h3 className="text-xl font-semibold text-dev-text">No Report Available</h3>
        <p className="text-sm text-dev-text-muted mt-2 max-w-md">
          Upload and analyze files to visualize your project&apos;s dependency graph
        </p>
      </div>
    );
  }
  
  // Build graph to get stats
  const files = currentReport.files.map(f => ({
    name: f.name,
    content: f.content || '',
    size: f.size,
  }));
  const graph = buildDependencyGraph(files);
  const stats = calculateGraphStats(graph);
  
  const hasIssues = stats.circularDependencyCount > 0 || stats.duplicateModuleCount > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-dev-bg p-6' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-dev-accent/10 rounded-xl">
              <Layers className="text-dev-accent" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-dev-text">Dependency Graph</h2>
          </div>
          <p className="text-sm text-dev-text-muted ml-14">
            Interactive visualization of module dependencies and relationships
          </p>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          leftIcon={isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          className="rounded-xl"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Modules"
          value={stats.totalModules}
          subtext="Files analyzed"
        />
        <StatCard
          icon={GitCommit}
          label="Dependencies"
          value={stats.totalDependencies}
          subtext="Import connections"
        />
        <StatCard
          icon={Zap}
          label="Circular Deps"
          value={stats.circularDependencyCount}
          color={stats.circularDependencyCount > 0 ? 'danger' : 'success'}
          subtext={stats.circularDependencyCount > 0 ? 'Needs attention' : 'All clear'}
        />
        <StatCard
          icon={Shield}
          label="Duplicates"
          value={stats.duplicateModuleCount}
          color={stats.duplicateModuleCount > 0 ? 'warning' : 'success'}
          subtext={stats.duplicateModuleCount > 0 ? 'Optimize bundle' : 'No duplicates'}
        />
      </div>
      
      {/* Issue Alerts */}
      {hasIssues && (
        <div className="space-y-3">
          {stats.circularDependencyCount > 0 && (
            <AlertBanner
              type="error"
              title={`${stats.circularDependencyCount} Circular Dependencies Detected`}
              message="Circular dependencies can cause bundling issues, increased bundle size, and runtime errors. Consider refactoring your imports to break these cycles."
            />
          )}
          
          {stats.duplicateModuleCount > 0 && (
            <AlertBanner
              type="warning"
              title={`${stats.duplicateModuleCount} Duplicate Modules Found`}
              message="Duplicate modules increase your bundle size unnecessarily. Consider deduplicating dependencies or using package manager resolutions."
            />
          )}
        </div>
      )}
      
      {/* Graph Container */}
      <div 
        className={`${isFullscreen ? 'flex-1' : 'h-[700px]'}`}
        style={{ height: isFullscreen ? 'calc(100vh - 280px)' : undefined }}
      >
        <SectionErrorBoundary sectionName="Dependency Graph">
          <ReactFlowProvider>
            <DependencyGraph />
          </ReactFlowProvider>
        </SectionErrorBoundary>
      </div>
      
      {/* Help Footer */}
      <div className="flex items-center justify-center gap-6 text-sm text-dev-text-muted py-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-dev-surface border border-dev-border flex items-center justify-center">
            <span className="text-xs">👆</span>
          </div>
          <span>Click nodes for details</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-dev-surface border border-dev-border flex items-center justify-center">
            <span className="text-xs">✋</span>
          </div>
          <span>Drag to rearrange</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-dev-surface border border-dev-border flex items-center justify-center">
            <span className="text-xs">🔍</span>
          </div>
          <span>Scroll to zoom</span>
        </div>
      </div>
    </motion.div>
  );
}
