import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
  defaultErrorComponent: ({ error }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-dev-bg">
      <div className="w-16 h-16 rounded-2xl bg-dev-danger/10 flex items-center justify-center mb-4">
        <span className="text-3xl">💥</span>
      </div>
      <h2 className="text-xl font-semibold text-dev-text mb-2">Navigation Error</h2>
      <p className="text-dev-text-muted text-sm mb-6 max-w-md">
        {error.message || 'Failed to load this page.'}
      </p>
      <button 
        onClick={() => window.location.href = '/'} 
        className="dev-button"
      >
        Go Home
      </button>
    </div>
  ),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter(): React.JSX.Element {
  return (
    <ErrorBoundary componentName="Application">
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
