import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get all corporate billing info
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("corporateBillingInfo").collect();
  },
});

// Query to get corporate billing info by ID
export const get = query({
  args: { id: v.id("corporateBillingInfo") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to get corporate billing info by customer ID
export const getByCustomer = query({
  args: { customer_id: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("corporateBillingInfo")
      .withIndex("by_customer", (q) => q.eq("customer_id", args.customer_id))
      .first();
  },
});

// Query to get corporate billing info with customer details
export const getWithCustomerDetails = query({
  args: { id: v.id("corporateBillingInfo") },
  handler: async (ctx, args) => {
    const billingInfo = await ctx.db.get(args.id);
    if (!billingInfo) return null;

    const customer = await ctx.db.get(billingInfo.customer_id);
    
    return {
      ...billingInfo,
      customer,
    };
  },
});

// Mutation to create corporate billing info
export const create = mutation({
  args: {
    customer_id: v.id("customers"),
    company_name: v.string(),
    tax_id: v.string(),
    billing_contact: v.object({
      name: v.string(),
      email: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Validation
    if (args.company_name.trim().length === 0) {
      throw new Error("Company name cannot be empty");
    }
    
    if (args.tax_id.trim().length === 0) {
      throw new Error("Tax ID cannot be empty");
    }

    if (args.billing_contact.name.trim().length === 0) {
      throw new Error("Billing contact name cannot be empty");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.billing_contact.email)) {
      throw new Error("Invalid billing contact email format");
    }

    // Verify customer exists
    const customer = await ctx.db.get(args.customer_id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Check if corporate billing info already exists for this customer
    const existingBilling = await ctx.db
      .query("corporateBillingInfo")
      .withIndex("by_customer", (q) => q.eq("customer_id", args.customer_id))
      .first();
    
    if (existingBilling) {
      throw new Error("Corporate billing info already exists for this customer");
    }

    return await ctx.db.insert("corporateBillingInfo", args);
  },
});

// Mutation to update corporate billing info
export const update = mutation({
  args: {
    id: v.id("corporateBillingInfo"),
    company_name: v.optional(v.string()),
    tax_id: v.optional(v.string()),
    billing_contact: v.optional(v.object({
      name: v.string(),
      email: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const billingInfo = await ctx.db.get(id);
    if (!billingInfo) {
      throw new Error("Corporate billing info not found");
    }

    // Remove undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    // Validation
    if (filteredUpdates.company_name !== undefined && filteredUpdates.company_name.trim().length === 0) {
      throw new Error("Company name cannot be empty");
    }
    
    if (filteredUpdates.tax_id !== undefined && filteredUpdates.tax_id.trim().length === 0) {
      throw new Error("Tax ID cannot be empty");
    }

    if (filteredUpdates.billing_contact) {
      if (filteredUpdates.billing_contact.name.trim().length === 0) {
        throw new Error("Billing contact name cannot be empty");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(filteredUpdates.billing_contact.email)) {
        throw new Error("Invalid billing contact email format");
      }
    }

    await ctx.db.patch(id, filteredUpdates);
    return await ctx.db.get(id);
  },
});

// Mutation to delete corporate billing info
export const remove = mutation({
  args: { id: v.id("corporateBillingInfo") },
  handler: async (ctx, args) => {
    const billingInfo = await ctx.db.get(args.id);
    if (!billingInfo) {
      throw new Error("Corporate billing info not found");
    }

    await ctx.db.delete(args.id);
    return { success: true, deletedId: args.id };
  },
});