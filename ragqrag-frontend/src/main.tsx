import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import App from './App.tsx';
import { AnimationsProvider } from './styles/animations';
import { useSessionStore } from './hooks/useSessionStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RootProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const reduceMotion = useSessionStore((s) => s.reduceMotion);
  return (
    <AnimationsProvider value={{ reduceMotion }}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AnimationsProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RootProviders>
        <App />
      </RootProviders>
    </BrowserRouter>
  </StrictMode>,
);

