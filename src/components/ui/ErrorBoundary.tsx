import { Component, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Component name for logging purposes */
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to error tracking service in production
    const meta = import.meta as unknown as { env: { PROD: boolean } };
    if (meta.env.PROD === true) {
      // Send to error tracking service - console.error allowed in production for error tracking
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback != null) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dev-danger/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-dev-danger" />
          </div>
          <h2 className="text-xl font-semibold text-dev-text mb-2">Something went wrong</h2>
          <p className="text-dev-text-muted text-sm mb-2 max-w-md">
            {this.props.componentName != null && (
              <span className="text-xs uppercase tracking-wider text-dev-text-subtle block mb-2">
                {this.props.componentName}
              </span>
            )}
            {this.state.error?.message ??
              'An unexpected error occurred while rendering this component.'}
          </p>
          {(import.meta as unknown as { env: { DEV: boolean } }).env.DEV === true && (this.state.errorInfo != null) && (
            <pre className="mt-4 p-4 bg-dev-surface rounded-lg text-left text-xs text-dev-text-muted overflow-auto max-w-md max-h-40">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <div className="flex gap-3 mt-6">
            <button onClick={this.handleReset} className="dev-button flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <button onClick={this.handleGoHome} className="dev-button-secondary flex items-center gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>
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
): React.FC<P> {
  const WrappedComponent = (props: P): React.JSX.Element => (
    <ErrorBoundary componentName={displayName ?? Component.displayName ?? Component.name}>
      <Component {...props} />
    </ErrorBoundary>
  );
  WrappedComponent.displayName =
    displayName ?? `withErrorBoundary(${Component.displayName ?? Component.name})`;
  return WrappedComponent;
}


