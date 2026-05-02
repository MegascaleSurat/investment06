import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { store } from './store';
import { API_UNAUTHORIZED_EVENT } from '@/lib/api';
import { logout } from '@/app/authSlice';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  React.useEffect(() => {
    const handleUnauthorized = () => {
      store.dispatch(logout());
      queryClient.clear();
    };

    window.addEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ReduxProvider>
  );
};
