/**
 * tRPC Provider component
 * Wraps the app with tRPC client and React Query
 */

'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { trpc, createTRPCClient } from '../lib/trpc';

interface TRPCProviderProps {
  children: React.ReactNode;
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  // Create clients - useState ensures they're only created once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            
            // Retry configuration
            retry: (failureCount, error) => {
              // Don't retry for client errors
              const trpcError = error as any;
              if (trpcError?.data?.httpStatus >= 400 && trpcError?.data?.httpStatus < 500) {
                return false;
              }
              return failureCount < 3;
            },
          },
          
          mutations: {
            // Don't retry mutations
            retry: false,
            
            // Show error toasts for failed mutations
            onError: (error) => {
              console.error('Mutation failed:', error);
              // TODO: Add toast notification when UI components are available
            },
          },
        },
      })
  );

  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* Show React Query devtools in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </trpc.Provider>
  );
}