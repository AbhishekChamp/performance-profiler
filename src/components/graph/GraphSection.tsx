import { useState } from 'react';
import { motion } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import { Layers, AlertTriangle, Package, GitCommit, Maximize2, Minimize2 } from 'lucide-react';
import { DependencyGraph } from './DependencyGraph';
import { useAnalysisStore } from '@/stores/analysisStore';
import { buildDependencyGraph, calculateGraphStats } from '@/core/graph';
import { Button } from '@/components/ui/Button';

export function GraphSection() {
  const { currentReport } = useAnalysisStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  if (!currentReport) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Layers className="w-16 h-16 mb-4 text-dev-text-subtle" />
        <h3 className="text-lg font-medium text-dev-text">No Report Available</h3>
        <p className="text-sm text-dev-text-muted mt-2">
          Upload and analyze files to view the dependency graph
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
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-dev-bg' : ''}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between ${isFullscreen ? 'p-6' : ''}`}>
        <div>
          <h2 className="text-2xl font-bold text-dev-text flex items-center gap-2">
            <Layers className="text-dev-accent" size={28} />
            Dependency Graph
          </h2>
          <p className="text-sm text-dev-text-muted mt-1">
            Interactive visualization of module dependencies and relationships
          </p>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          leftIcon={isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isFullscreen ? 'px-6' : ''}`}>
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 text-dev-text-muted mb-1">
            <Package size={16} />
            <span className="text-sm">Modules</span>
          </div>
          <p className="text-2xl font-bold text-dev-text">{stats.totalModules}</p>
        </div>
        
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 text-dev-text-muted mb-1">
            <GitCommit size={16} />
            <span className="text-sm">Dependencies</span>
          </div>
          <p className="text-2xl font-bold text-dev-text">{stats.totalDependencies}</p>
        </div>
        
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 text-dev-text-muted mb-1">
            <AlertTriangle size={16} />
            <span className="text-sm">Circular</span>
          </div>
          <p className={`text-2xl font-bold ${stats.circularDependencyCount > 0 ? 'text-dev-danger' : 'text-dev-text'}`}>
            {stats.circularDependencyCount}
          </p>
        </div>
        
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 text-dev-text-muted mb-1">
            <Package size={16} />
            <span className="text-sm">Duplicates</span>
          </div>
          <p className={`text-2xl font-bold ${stats.duplicateModuleCount > 0 ? 'text-dev-warning' : 'text-dev-text'}`}>
            {stats.duplicateModuleCount}
          </p>
        </div>
      </div>
      
      {/* Warnings */}
      {(stats.circularDependencyCount > 0 || stats.duplicateModuleCount > 0) && (
        <div className={`space-y-2 ${isFullscreen ? 'px-6' : ''}`}>
          {stats.circularDependencyCount > 0 && (
            <div className="glass-panel rounded-xl p-4 border border-dev-danger/30 bg-dev-danger/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-dev-danger shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-dev-danger">Circular Dependencies Detected</h4>
                  <p className="text-sm text-dev-text-muted mt-1">
                    {stats.circularDependencyCount} circular {stats.circularDependencyCount === 1 ? 'dependency was' : 'dependencies were'} found. 
                    These can cause bundling issues and should be refactored.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {stats.duplicateModuleCount > 0 && (
            <div className="glass-panel rounded-xl p-4 border border-dev-warning/30 bg-dev-warning/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-dev-warning shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-dev-warning">Duplicate Modules</h4>
                  <p className="text-sm text-dev-text-muted mt-1">
                    {stats.duplicateModuleCount} duplicate {stats.duplicateModuleCount === 1 ? 'module was' : 'modules were'} found. 
                    Consider deduplicating to reduce bundle size.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Graph Container */}
      <div className={`${isFullscreen ? 'flex-1 px-6 pb-6' : ''}`} style={{ height: isFullscreen ? 'calc(100vh - 300px)' : '600px' }}>
        <div className="glass-panel rounded-xl overflow-hidden h-full">
          <ReactFlowProvider>
            <DependencyGraph />
          </ReactFlowProvider>
        </div>
      </div>
      
      {/* Help Text */}
      <div className={`text-center text-sm text-dev-text-muted ${isFullscreen ? 'px-6' : ''}`}>
        <p>
          <strong>Tip:</strong> Click on a node to view details. Drag to rearrange. 
          Use mouse wheel to zoom. Search and filter using the panel on the left.
        </p>
      </div>
    </motion.div>
  );
}
