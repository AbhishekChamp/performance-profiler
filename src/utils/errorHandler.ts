/**
 * Global error handling utilities
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context: ErrorContext = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
  }
}

// Error codes for common scenarios
export const ErrorCodes = {
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  WORKER_ERROR: 'WORKER_ERROR',
  RENDER_ERROR: 'RENDER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// User-friendly error messages
export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.ANALYSIS_FAILED]: 'Failed to analyze your files. Please try again or check your file formats.',
  [ErrorCodes.FILE_READ_ERROR]: 'Could not read one or more files. Please check file permissions.',
  [ErrorCodes.INVALID_FILE_TYPE]: 'Some files have unsupported formats. Please upload HTML, CSS, JS, or TS files.',
  [ErrorCodes.STORAGE_ERROR]: 'Failed to save data locally. Your browser storage may be full.',
  [ErrorCodes.NETWORK_ERROR]: 'Network connection issue. Some features may be unavailable offline.',
  [ErrorCodes.WORKER_ERROR]: 'Analysis engine failed to start. Please refresh the page.',
  [ErrorCodes.RENDER_ERROR]: 'Something went wrong displaying this content.',
  [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * Log error with context for debugging
 */
export function logError(error: Error, context: ErrorContext = {}): void {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...context,
  };

  // Log to console in development
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isDev = (import.meta as any).env?.DEV;
  if (isDev === true) {
    console.error('Error logged:', errorInfo);
  }

  // In production, you might send to an error tracking service
  // Example: Sentry, LogRocket, etc.
  // if (import.meta.env.PROD) {
  //   errorTracker.captureException(error, { extra: errorInfo });
  // }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    return ErrorMessages[error.code] || error.message;
  }
  
  // Handle specific error patterns
  if (error.message.includes('Failed to fetch')) {
    return ErrorMessages[ErrorCodes.NETWORK_ERROR];
  }
  
  if (error.message.includes('QuotaExceededError')) {
    return ErrorMessages[ErrorCodes.STORAGE_ERROR];
  }
  
  return error.message || ErrorMessages[ErrorCodes.UNKNOWN_ERROR];
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  context: ErrorContext = {}
): (...args: Args) => Promise<T> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = error instanceof AppError 
        ? error 
        : new AppError(
            error instanceof Error ? error.message : 'Unknown error',
            ErrorCodes.UNKNOWN_ERROR,
            context
          );
      
      logError(appError, context);
      throw appError;
    }
  };
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('JSON parse failed'), {
      action: 'safeJsonParse',
      metadata: { jsonLength: typeof json === 'string' ? json.length : 0 },
    });
    return fallback;
  }
}

/**
 * Safe localStorage access
 */
export function safeLocalStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? safeJsonParse<T>(item, fallback) : fallback;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('localStorage access failed'), {
      action: 'safeLocalStorage',
      metadata: { key },
    });
    return fallback;
  }
}

/**
 * Report error to user with toast notification
 */
export function reportError(error: Error, showToast: (message: string) => void): void {
  const message = getErrorMessage(error);
  showToast(message);
  logError(error);
}
