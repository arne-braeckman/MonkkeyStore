/**
 * Simple in-memory rate limiting middleware for tRPC
 * Production should use Redis or similar persistent store
 */

import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';

// Simple in-memory store (resets on server restart)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Configuration
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 100; // 100 requests per minute

/**
 * Get client identifier from request
 * In production, use more sophisticated identification (IP + user ID, etc.)
 */
function getClientId(ctx: any): string {
  // For now, use a generic identifier since auth is not implemented
  // In production with auth: return ctx.user?.id || ctx.req?.ip || 'anonymous';
  return ctx.req?.headers?.['x-forwarded-for'] || 
         ctx.req?.connection?.remoteAddress || 
         'anonymous';
}

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per time window
 */
export const rateLimitMiddleware = middleware(async (opts) => {
  const clientId = getClientId(opts.ctx);
  const now = Date.now();
  
  // Get or create client record
  let clientData = requestCounts.get(clientId);
  
  // Reset if window expired
  if (!clientData || now > clientData.resetTime) {
    clientData = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
  }
  
  // Increment request count
  clientData.count++;
  requestCounts.set(clientId, clientData);
  
  // Check if limit exceeded
  if (clientData.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
    });
  }
  
  // Clean up old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime + WINDOW_MS) {
        requestCounts.delete(key);
      }
    }
  }
  
  return opts.next({
    ctx: {
      ...opts.ctx,
      rateLimit: {
        remaining: MAX_REQUESTS - clientData.count,
        resetTime: clientData.resetTime,
      },
    },
  });
});

/**
 * Stricter rate limit for sensitive operations
 * Use for auth endpoints, payment processing, etc.
 */
export const strictRateLimitMiddleware = middleware(async (opts) => {
  const clientId = getClientId(opts.ctx);
  const now = Date.now();
  const strictKey = `strict:${clientId}`;
  
  let clientData = requestCounts.get(strictKey);
  
  // Stricter limits: 10 requests per minute
  const STRICT_MAX = 10;
  
  if (!clientData || now > clientData.resetTime) {
    clientData = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
  }
  
  clientData.count++;
  requestCounts.set(strictKey, clientData);
  
  if (clientData.count > STRICT_MAX) {
    const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded for sensitive operation. Please try again in ${retryAfter} seconds.`,
    });
  }
  
  return opts.next(opts);
});