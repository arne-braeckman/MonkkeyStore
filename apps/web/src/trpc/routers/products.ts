/**
 * Product tRPC router
 * Implements type-safe product CRUD operations connecting to Convex database
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, publicProcedure } from '../trpc';
import { convexServer } from '../../lib/convex-server';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

/**
 * Product input validation schemas
 * Using Zod for runtime type checking and validation
 */
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  price: z.number().positive('Price must be positive').max(999999.99, 'Price too high'),
  stock: z.number().int('Stock must be integer').min(0, 'Stock cannot be negative'),
  images: z.array(z.string().url('Invalid image URL')).optional().default([]),
  videos: z.array(z.string().url('Invalid video URL')).optional().default([]),
  customization_options: z.array(z.object({
    area: z.string(),
    type: z.string(),
    options: z.array(z.string())
  })).optional().default([])
});

const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().min(1, 'Product ID is required')
});

const productIdSchema = z.object({
  id: z.string().min(1, 'Product ID is required')
});

/**
 * Products router with CRUD operations
 */
export const productsRouter = createTRPCRouter({
  /**
   * Get all products
   */
  getAll: publicProcedure.query(async () => {
    try {
      console.time('trpc-products-getAll');
      const products = await convexServer.query(api.products.list);
      console.timeEnd('trpc-products-getAll');
      
      return products;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: 'Failed to fetch products' 
      });
    }
  }),

  /**
   * Get product by ID
   */
  getById: publicProcedure
    .input(productIdSchema)
    .query(async ({ input }) => {
      try {
        console.time('trpc-products-getById');
        const product = await convexServer.query(api.products.get, { id: input.id as Id<"products"> });
        console.timeEnd('trpc-products-getById');
        
        if (!product) {
          throw new TRPCError({ 
            code: 'NOT_FOUND', 
            message: 'Product not found' 
          });
        }
        
        return product;
      } catch (error) {
        console.error('Failed to fetch product:', error);
        if (error instanceof Error && error.message.includes('NOT_FOUND')) {
          throw error; // Re-throw tRPC errors
        }
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to fetch product' 
        });
      }
    }),

  /**
   * Create new product
   */
  create: publicProcedure
    .input(createProductSchema)
    .mutation(async ({ input }) => {
      try {
        console.time('trpc-products-create');
        
        // Validate and sanitize input using existing validation
        const validatedInput = {
          ...input,
          name: input.name.trim(),
          description: input.description?.trim(),
          isDeleted: false
        };
        
        const productId = await convexServer.mutation(api.products.create, validatedInput);
        console.timeEnd('trpc-products-create');
        
        return { 
          id: productId,
          message: 'Product created successfully'
        };
      } catch (error) {
        console.error('Failed to create product:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to create product' 
        });
      }
    }),

  /**
   * Update existing product
   */
  update: publicProcedure
    .input(updateProductSchema)
    .mutation(async ({ input }) => {
      try {
        console.time('trpc-products-update');
        
        const { id, ...updateData } = input;
        
        // Clean update data (remove undefined fields)
        const cleanedData: any = {};
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === 'name' && typeof value === 'string') {
              cleanedData[key] = value.trim();
            } else if (key === 'description' && typeof value === 'string') {
              cleanedData[key] = value.trim();
            } else {
              cleanedData[key] = value;
            }
          }
        });
        
        await convexServer.mutation(api.products.update, { id: id as Id<"products">, ...cleanedData });
        console.timeEnd('trpc-products-update');
        
        return { 
          id,
          message: 'Product updated successfully'
        };
      } catch (error) {
        console.error('Failed to update product:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to update product' 
        });
      }
    }),

  /**
   * Delete product (soft delete)
   */
  delete: publicProcedure
    .input(productIdSchema)
    .mutation(async ({ input }) => {
      try {
        console.time('trpc-products-delete');
        
        // Use remove instead of softDelete for now
        await convexServer.mutation(api.products.remove, { 
          id: input.id as Id<"products">
        });
        
        console.timeEnd('trpc-products-delete');
        
        return { 
          id: input.id,
          message: 'Product deleted successfully'
        };
      } catch (error) {
        console.error('Failed to delete product:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to delete product' 
        });
      }
    }),

  /**
   * Search products by name
   */
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1, 'Search query is required'),
      limit: z.number().min(1).max(100).default(20)
    }))
    .query(async ({ input }) => {
      try {
        console.time('trpc-products-search');
        
        // Use existing search functionality if available, otherwise filter
        const allProducts = await convexServer.query(api.products.list);
        const filteredProducts = allProducts.filter(product => 
          product.name.toLowerCase().includes(input.query.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(input.query.toLowerCase()))
        ).slice(0, input.limit);
        
        console.timeEnd('trpc-products-search');
        
        return filteredProducts;
      } catch (error) {
        console.error('Failed to search products:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to search products' 
        });
      }
    }),
});