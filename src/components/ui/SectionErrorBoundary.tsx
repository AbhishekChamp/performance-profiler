import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName: string;
}

export function SectionErrorBoundary({ children, sectionName }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary 
      componentName={sectionName}
      fallback={
        <div className="dev-panel p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-dev-warning mx-auto mb-3" />
          <h3 className="text-dev-text font-medium mb-1">{sectionName} failed to load</h3>
          <p className="text-sm text-dev-text-muted">
            There was an error displaying this section. Other sections may still be available.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
