import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppRouter } from './app/router';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: false,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#1a1a2e',
            },
            style: {
              borderLeft: '4px solid #10b981',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1a1a2e',
            },
            style: {
              borderLeft: '4px solid #ef4444',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#1a1a2e',
            },
            style: {
              borderLeft: '4px solid #3b82f6',
            },
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
);
