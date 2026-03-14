import { Tooltip } from '@/components/ui/Tooltip';
import type { MetricConfidence } from '@/core/browser-analysis';
import { getConfidenceDescription } from '@/core/browser-analysis';
import { Activity, Wifi, Monitor, Brain } from 'lucide-react';

interface AccuracyIndicatorProps {
  confidence: MetricConfidence;
  source: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Visual indicator for metric confidence level
 */
export function AccuracyIndicator({ 
  confidence, 
  source, 
  showLabel = true,
  size = 'md' 
}: AccuracyIndicatorProps): JSX.Element {
  const config = {
    estimated: {
      icon: Brain,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/30',
      label: 'Estimated'
    },
    simulated: {
      icon: Monitor,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/30',
      label: 'Simulated'
    },
    measured: {
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/30',
      label: 'Measured'
    },
    rum: {
      icon: Wifi,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/30',
      label: 'RUM'
    }
  };

  const { icon: Icon, color, bgColor, borderColor, label } = config[confidence];
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const containerClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  return (
    <Tooltip content={getConfidenceDescription(confidence)}>
      <span 
        className={`
          inline-flex items-center rounded-full border font-medium
          ${bgColor} ${borderColor} ${color} ${containerClasses[size]}
        `}
      >
        <Icon className={sizeClasses[size]} />
        {showLabel && (
          <span>
            {label}
            <span className="opacity-60 ml-1">• {source}</span>
          </span>
        )}
      </span>
    </Tooltip>
  );
}

interface MetricComparisonProps {
  metric: string;
  estimated: number;
  real: number;
  unit: string;
  difference: number;
  percentDifference: number;
}

/**
 * Display comparison between estimated and real metrics
 */
export function MetricComparison({
  metric,
  estimated,
  real,
  unit,
  difference,
  percentDifference
}: MetricComparisonProps): JSX.Element {
  const isBetter = difference < 0; // Negative difference means real is better
  const accuracy = Math.abs(percentDifference) <= 10 ? 'high' : 
                   Math.abs(percentDifference) <= 25 ? 'medium' : 'low';

  return (
    <div className="p-4 bg-dev-surface border border-dev-border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-dev-text">{metric}</h4>
        <AccuracyBadge accuracy={accuracy} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-dev-text-muted mb-1">Estimated</p>
          <p className="text-lg font-semibold text-dev-text">
            {formatValue(estimated, unit)}
          </p>
        </div>

        <div>
          <p className="text-xs text-dev-text-muted mb-1">Real</p>
          <p className={`text-lg font-semibold ${isBetter ? 'text-green-400' : 'text-yellow-400'}`}>
            {formatValue(real, unit)}
          </p>
        </div>

        <div>
          <p className="text-xs text-dev-text-muted mb-1">Difference</p>
          <p className={`text-lg font-semibold ${
            Math.abs(percentDifference) <= 10 ? 'text-green-400' :
            Math.abs(percentDifference) <= 25 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {percentDifference > 0 ? '+' : ''}{percentDifference.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

function AccuracyBadge({ accuracy }: { accuracy: 'high' | 'medium' | 'low' }): JSX.Element {
  const config = {
    high: { color: 'bg-green-400/20 text-green-400', label: 'High Accuracy' },
    medium: { color: 'bg-yellow-400/20 text-yellow-400', label: 'Medium Accuracy' },
    low: { color: 'bg-red-400/20 text-red-400', label: 'Low Accuracy' }
  };

  const { color, label } = config[accuracy];

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${color}`}>
      {label}
    </span>
  );
}

function formatValue(value: number, unit: string): string {
  if (unit === 'ms') {
    return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(2)}s`;
  }
  if (unit === 's') {
    return `${value.toFixed(2)}s`;
  }
  return value.toFixed(3);
}
