/**
 * Server-side Convex client configuration
 * For use in API routes, server components, and tRPC procedures
 */

import { ConvexHttpClient } from "convex/browser";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_URL environment variable.\n" +
    "Set it in your .env.local file.\n" +
    "You can get the URL by running `npx convex dev` and copying the deployment URL."
  );
}

// Create the server-side Convex client
export const convexServer = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Performance monitoring for server-side operations - only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Server-side Convex client initialized');
}