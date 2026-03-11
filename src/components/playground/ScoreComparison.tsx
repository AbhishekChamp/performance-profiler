import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Package, Code2, Zap, Accessibility } from 'lucide-react';
import type { PlaygroundAnalysis } from '@/types/playground';

interface ScoreComparisonProps {
  analysis: PlaygroundAnalysis;
}

function MetricCard({ 
  label, 
  before, 
  after, 
  unit = '',
  icon: Icon,
  reverse = false 
}: { 
  label: string; 
  before: number; 
  after: number; 
  unit?: string;
  icon: React.ElementType;
  reverse?: boolean;
}) {
  const improvement = reverse 
    ? before - after 
    : after - before;
  const isPositive = reverse 
    ? improvement > 0 
    : improvement > 0;
  
  return (
    <div className="bg-dev-surface rounded-lg p-4">
      <div className="flex items-center gap-2 text-dev-text-muted mb-2">
        <Icon size={16} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-dev-text">
          {Math.round(after)}{unit}
        </span>
        {improvement !== 0 && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm font-medium ${isPositive ? 'text-dev-success' : 'text-dev-danger'}`}
          >
            {isPositive ? '+' : ''}{Math.round(improvement)}{unit}
          </motion.span>
        )}
      </div>
      <div className="mt-1 text-xs text-dev-text-muted">
        Before: {Math.round(before)}{unit}
      </div>
    </div>
  );
}

function ScoreRing({ score, size = 60 }: { score: number; size?: number }) {
  const circumference = 2 * Math.PI * ((size - 8) / 2);
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const color = score >= 90 ? '#3fb950' : score >= 70 ? '#d29922' : '#f85149';
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 8) / 2}
          fill="none"
          stroke="#30363d"
          strokeWidth="4"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 8) / 2}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}

export function ScoreComparison({ analysis }: ScoreComparisonProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const hasImprovement = analysis.score.improvement > 0;
  
  return (
    <div className="p-4 bg-dev-surface/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm text-dev-text-muted mb-1">Overall Score</div>
              <div className="flex items-center gap-3">
                <ScoreRing score={analysis.score.after} size={70} />
                <div>
                  <div className="text-2xl font-bold text-dev-text">
                    {analysis.score.after}
                    <span className="text-sm text-dev-text-muted font-normal ml-2">
                      / 100
                    </span>
                  </div>
                  {hasImprovement && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1 text-dev-success"
                    >
                      <TrendingUp size={16} />
                      <span className="text-sm font-medium">
                        +{analysis.score.improvement} points
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-12 w-px bg-dev-border mx-4" />
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-dev-text">
                {analysis.issues.total}
              </div>
              <div className="text-xs text-dev-text-muted">Total Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-dev-success">
                {analysis.issues.fixed}
              </div>
              <div className="text-xs text-dev-text-muted">Fixed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-dev-warning">
                {analysis.issues.remaining}
              </div>
              <div className="text-xs text-dev-text-muted">Remaining</div>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-dev-accent hover:underline"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      {showDetails && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-dev-border"
        >
          <MetricCard
            label="Bundle Size"
            before={analysis.metrics.bundleSize.before / 1024}
            after={analysis.metrics.bundleSize.after / 1024}
            unit=" KB"
            icon={Package}
            reverse
          />
          <MetricCard
            label="JS Complexity"
            before={analysis.metrics.jsComplexity.before}
            after={analysis.metrics.jsComplexity.after}
            icon={Code2}
            reverse
          />
          <MetricCard
            label="CSS Efficiency"
            before={analysis.metrics.cssEfficiency.before}
            after={analysis.metrics.cssEfficiency.after}
            unit="%"
            icon={Zap}
          />
          <MetricCard
            label="Accessibility"
            before={analysis.metrics.accessibility.before}
            after={analysis.metrics.accessibility.after}
            unit="%"
            icon={Accessibility}
          />
        </motion.div>
      )}
    </div>
  );
}
