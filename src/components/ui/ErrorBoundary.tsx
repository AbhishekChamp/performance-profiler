import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-100 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dev-danger/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-dev-danger" />
          </div>
          <h2 className="text-xl font-semibold text-dev-text mb-2">Something went wrong</h2>
          <p className="text-dev-text-muted text-sm mb-6 max-w-md">
            {this.state.error?.message ||
              'An unexpected error occurred while rendering this component.'}
          </p>
          <button onClick={this.handleReset} className="dev-button flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping sections
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );
  WrappedComponent.displayName =
    displayName || `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}
