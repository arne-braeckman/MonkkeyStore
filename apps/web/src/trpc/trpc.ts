/**
 * tRPC configuration and context setup
 * Configures tRPC with Next.js 14 App Router support and authentication placeholder
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { rateLimitMiddleware } from './middleware/rateLimit';

/**
 * Context interface for future authentication
 * Currently placeholder - authentication will be implemented in future stories
 */
interface CreateContextOptions {
  req?: NextRequest;
  user?: {
    id: string;
    email: string;
  } | null;
}

/**
 * Create tRPC context
 * Sets up the context that will be available in all tRPC procedures
 */
export const createTRPCContext = (opts?: { req?: NextRequest }) => {
  const req = opts?.req;

  // Authentication placeholder - will be populated in future stories
  // For now, we set user to null to maintain type safety
  const user = null;

  return {
    req,
    user,
    // Add request timing for performance monitoring
    requestStartTime: Date.now(),
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC with error formatting and middleware
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller (for server components)
 */
export const createTRPCCallerFactory = t.createCallerFactory;

/**
 * Export reusable router and procedure builders
 */
export const createTRPCRouter = t.router;
export const middleware = t.middleware;

/**
 * Public procedure (no authentication required)
 * Used for endpoints that don't require authentication
 * Includes rate limiting and performance monitoring
 */
export const publicProcedure = t.procedure
  .use(rateLimitMiddleware)
  .use(async (opts) => {
    const start = Date.now();
    
    const result = await opts.next({
      ctx: {
        ...opts.ctx,
      },
    });

    // Performance monitoring
    const duration = Date.now() - start;
    if (duration > 1000) { // Log slow operations (>1s)
      console.warn(`⚠️ Slow tRPC operation: ${duration}ms`);
    }

    return result;
  });

/**
 * Protected procedure (requires authentication)
 * Placeholder for future authentication implementation
 */
export const protectedProcedure = t.procedure.use(async (opts) => {
  // Authentication check placeholder
  // In future stories, this will verify authentication
  const { ctx } = opts;
  
  if (!ctx.user) {
    // For now, we allow access but log that auth is not implemented
    console.warn('⚠️ Protected procedure called without authentication (auth not yet implemented)');
  }

  return opts.next({
    ctx: {
      ...ctx,
      // Ensure user is available in protected procedures
      user: ctx.user,
    },
  });
});

/**
 * Error handling utilities
 */
export const createTRPCError = (code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR', message: string) => {
  return new TRPCError({ code, message });
};

/**
 * Input validation middleware
 * Integrates with existing validation system from Story 1.2
 */
export const createValidatedProcedure = (schema: any) => {
  return publicProcedure.input(schema);
};