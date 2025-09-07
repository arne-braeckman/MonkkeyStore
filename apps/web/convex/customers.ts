import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get all customers
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("customers").collect();
  },
});

// Query to get a single customer by ID
export const get = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to find customer by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Mutation to create a new customer
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone_number: v.string(),
    address: v.object({
      billing: v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
        country: v.string(),
      }),
      shipping: v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
        country: v.string(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    // Validation
    if (args.name.trim().length === 0) {
      throw new Error("Customer name cannot be empty");
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email format");
    }

    // Check if customer already exists
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existingCustomer) {
      throw new Error("Customer with this email already exists");
    }

    return await ctx.db.insert("customers", args);
  },
});

// Mutation to update a customer
export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    address: v.optional(v.object({
      billing: v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
        country: v.string(),
      }),
      shipping: v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
        country: v.string(),
      }),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Remove undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    // Validation
    if (filteredUpdates.name !== undefined && filteredUpdates.name.trim().length === 0) {
      throw new Error("Customer name cannot be empty");
    }
    
    if (filteredUpdates.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(filteredUpdates.email)) {
        throw new Error("Invalid email format");
      }

      // Check if email is already taken by another customer
      const existingCustomer = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", filteredUpdates.email))
        .first();
      
      if (existingCustomer && existingCustomer._id !== id) {
        throw new Error("Email already taken by another customer");
      }
    }

    await ctx.db.patch(id, filteredUpdates);
    return await ctx.db.get(id);
  },
});

// Mutation to delete a customer
export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    // Check if customer exists
    const customer = await ctx.db.get(args.id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Check for related orders
    const relatedOrders = await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customer_id", args.id))
      .collect();
    
    if (relatedOrders.length > 0) {
      throw new Error("Cannot delete customer with existing orders");
    }

    // Check for related corporate billing info
    const relatedBilling = await ctx.db
      .query("corporateBillingInfo")
      .withIndex("by_customer", (q) => q.eq("customer_id", args.id))
      .collect();
    
    if (relatedBilling.length > 0) {
      // Delete related corporate billing info
      for (const billing of relatedBilling) {
        await ctx.db.delete(billing._id);
      }
    }

    await ctx.db.delete(args.id);
    return { success: true, deletedId: args.id };
  },
});