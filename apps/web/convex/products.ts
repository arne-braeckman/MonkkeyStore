import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Import validation and sanitization utilities
// Note: These imports may need adjustment based on Convex's import system
// import { DomainValidator } from "../src/lib/validation";
// import { InputSanitizer } from "../src/lib/sanitization";
// import { DatabaseErrorFactory } from "../src/lib/errors";
// import { dbLogger, performanceTracker } from "../src/lib/logger";

// Temporary inline validation functions until import system is configured
function validateAndSanitizeProduct(data: any) {
  // Basic validation
  if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    throw new Error('Product name is required and cannot be empty');
  }
  if (data.name.trim().length > 200) {
    throw new Error('Product name cannot exceed 200 characters');
  }
  if (typeof data.price !== 'number' || isNaN(data.price) || !isFinite(data.price)) {
    throw new Error('Price must be a valid number');
  }
  if (data.price <= 0) {
    throw new Error('Price must be greater than 0');
  }
  if (data.price > 999999.99) {
    throw new Error('Price exceeds maximum allowed value of $999,999.99');
  }
  if (typeof data.stock !== 'number' || isNaN(data.stock) || !isFinite(data.stock)) {
    throw new Error('Stock must be a valid number');
  }
  if (data.stock < 0) {
    throw new Error('Stock cannot be negative');
  }
  if (!Number.isInteger(data.stock)) {
    throw new Error('Stock must be a whole number');
  }
  
  // Basic sanitization
  return {
    ...data,
    name: data.name.trim().substring(0, 200),
    description: data.description ? data.description.trim().substring(0, 2000) : data.description,
  };
}

// Query to get all products
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

// Query to get a single product by ID
export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query products with pagination
export const paginated = query({
  args: { 
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .paginate(args.paginationOpts);
  },
});

// Mutation to create a new product
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    images: v.array(v.string()),
    videos: v.array(v.string()),
    stock: v.number(),
    customization_options: v.array(v.object({
      area: v.string(),
      type: v.string(),
      options: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    try {
      // Validate and sanitize input
      const sanitizedData = validateAndSanitizeProduct(args);
      
      // Insert product
      const productId = await ctx.db.insert("products", sanitizedData);
      
      // Log performance and audit
      const duration = Date.now() - startTime;
      console.log(`Performance: Product creation completed in ${duration}ms`);
      console.log(`AUDIT: Created product with ID: ${productId}`);
      
      // Warn if operation is slow
      if (duration > 100) {
        console.warn(`Slow operation detected: Product creation took ${duration}ms`);
      }
      
      return productId;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Product creation failed after ${duration}ms:`, error);
      throw error;
    }
  },
});

// Mutation to update a product
export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    videos: v.optional(v.array(v.string())),
    stock: v.optional(v.number()),
    customization_options: v.optional(v.array(v.object({
      area: v.string(),
      type: v.string(),
      options: v.array(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Remove undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    // Get current product for audit logging
    const currentProduct = await ctx.db.get(id);
    if (!currentProduct) {
      throw new Error(`Product with ID '${id}' not found`);
    }
    
    // Validate updates
    if (filteredUpdates.price !== undefined) {
      if (typeof filteredUpdates.price !== 'number' || isNaN(filteredUpdates.price) || !isFinite(filteredUpdates.price)) {
        throw new Error('Price must be a valid number');
      }
      if (filteredUpdates.price <= 0) {
        throw new Error('Price must be greater than 0');
      }
      if (filteredUpdates.price > 999999.99) {
        throw new Error('Price exceeds maximum allowed value of $999,999.99');
      }
    }
    if (filteredUpdates.stock !== undefined) {
      if (typeof filteredUpdates.stock !== 'number' || isNaN(filteredUpdates.stock) || !isFinite(filteredUpdates.stock)) {
        throw new Error('Stock must be a valid number');
      }
      if (filteredUpdates.stock < 0) {
        throw new Error('Stock cannot be negative');
      }
      if (!Number.isInteger(filteredUpdates.stock)) {
        throw new Error('Stock must be a whole number');
      }
    }
    if (filteredUpdates.name !== undefined) {
      if (typeof filteredUpdates.name !== 'string' || filteredUpdates.name.trim().length === 0) {
        throw new Error('Product name cannot be empty');
      }
      if (filteredUpdates.name.trim().length > 200) {
        throw new Error('Product name cannot exceed 200 characters');
      }
      // Sanitize name
      filteredUpdates.name = filteredUpdates.name.trim();
    }
    if (filteredUpdates.description !== undefined && filteredUpdates.description) {
      filteredUpdates.description = filteredUpdates.description.trim().substring(0, 2000);
    }

    // Update product
    await ctx.db.patch(id, filteredUpdates);
    const updatedProduct = await ctx.db.get(id);
    
    // Audit log for sensitive updates
    const sensitiveFields = ['price', 'stock', 'name'];
    const hasSensitiveUpdates = Object.keys(filteredUpdates).some(key => sensitiveFields.includes(key));
    
    if (hasSensitiveUpdates) {
      console.log(`AUDIT: Updated product ${id}`, {
        oldValues: Object.keys(filteredUpdates).reduce((acc, key) => {
          acc[key] = currentProduct[key as keyof typeof currentProduct];
          return acc;
        }, {} as any),
        newValues: filteredUpdates
      });
    }
    
    return updatedProduct;
  },
});

// Mutation to update stock level
export const updateStock = mutation({
  args: {
    id: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) {
      throw new Error("Product not found");
    }

    const newStock = product.stock + args.quantity;
    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    await ctx.db.patch(args.id, { stock: newStock });
    return await ctx.db.get(args.id);
  },
});

// Mutation to delete a product
export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    // Check if product exists and log for audit
    const product = await ctx.db.get(args.id);
    if (!product) {
      throw new Error(`Product with ID '${args.id}' not found`);
    }

    // Audit log before deletion
    console.log(`AUDIT: Deleting product ${args.id}`, {
      deletedData: {
        name: product.name,
        price: product.price,
        stock: product.stock
      }
    });

    await ctx.db.delete(args.id);
    
    console.log(`Product ${args.id} successfully deleted`);
    return { success: true, deletedId: args.id };
  },
});