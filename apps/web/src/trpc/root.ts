/**
 * Root tRPC router
 * Combines all sub-routers and exports the main app router
 */

import { createTRPCRouter } from './trpc';
import { productsRouter } from './routers/products';

/**
 * Main application router
 * This is where all sub-routers are combined
 */
export const appRouter = createTRPCRouter({
  products: productsRouter,
  // Future routers will be added here:
  // customers: customersRouter,
  // orders: ordersRouter,
  // giftBoxes: giftBoxesRouter,
  // auth: authRouter, (when authentication is implemented)
});

// Export type definition only (not the router itself for client)
export type AppRouter = typeof appRouter;