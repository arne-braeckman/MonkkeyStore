/**
 * tRPC client configuration
 * Sets up type-safe client for React components
 */

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { type AppRouter } from '../trpc/root';

/**
 * Create the tRPC React hooks
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Inference helper for input types
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for output types
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * Get base URL for tRPC calls
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative URL
    return '';
  }
  
  if (process.env.VERCEL_URL) {
    // Reference for vercel.com
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.RENDER_INTERNAL_HOSTNAME) {
    // Reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT ?? 3000}`;
  }
  
  // Assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Create tRPC client configuration
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      // Logger for development
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === 'development' ||
          (opts.direction === 'down' && opts.result instanceof Error),
      }),
      
      // HTTP batch link for requests
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        
        // Optional: Add headers or transformation
        headers() {
          return {
            // Add any custom headers here
            // Authorization will be added when auth is implemented
          };
        },
        
        // Performance: Batch requests
        maxURLLength: 2083,
      }),
    ],
  });
}

/**
 * Mock service worker setup for testing (optional)
 * Uncomment when msw-trpc is needed for testing
 */
// export const mswTrpc = createTRPCMsw<AppRouter>();

/**
 * Utility type helpers for components
 */
export type Product = RouterOutputs['products']['getAll'][number];
export type CreateProductInput = RouterInputs['products']['create'];
export type UpdateProductInput = RouterInputs['products']['update'];

/**
 * Helper hooks for common operations
 */
export function useProducts() {
  return trpc.products.getAll.useQuery();
}

export function useProduct(id: string) {
  return trpc.products.getById.useQuery({ id });
}

export function useCreateProduct() {
  return trpc.products.create.useMutation();
}

export function useUpdateProduct() {
  return trpc.products.update.useMutation();
}

export function useDeleteProduct() {
  return trpc.products.delete.useMutation();
}

export function useSearchProducts() {
  return trpc.products.search.useMutation();
}