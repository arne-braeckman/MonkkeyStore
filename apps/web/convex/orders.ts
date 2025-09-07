import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get all orders
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orders").order("desc").collect();
  },
});

// Query to get a single order by ID
export const get = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to get orders by customer
export const getByCustomer = query({
  args: { customer_id: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customer_id", args.customer_id))
      .order("desc")
      .collect();
  },
});

// Query to get orders by status
export const getByStatus = query({
  args: { 
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});

// Query orders with detailed information (includes customer and product data)
export const getWithDetails = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;

    // Get customer information
    const customer = await ctx.db.get(order.customer_id);
    
    // Get product information for each item
    const itemsWithProducts = await Promise.all(
      order.items.map(async (item) => {
        const product = await ctx.db.get(item.product_id);
        return {
          ...item,
          product,
        };
      })
    );

    return {
      ...order,
      customer,
      items: itemsWithProducts,
    };
  },
});

// Mutation to create a new order
export const create = mutation({
  args: {
    customer_id: v.id("customers"),
    items: v.array(v.object({
      product_id: v.id("products"),
      quantity: v.number(),
      personalization: v.optional(v.object({
        area: v.string(),
        text: v.string(),
        font: v.optional(v.string()),
        color: v.optional(v.string()),
      })),
    })),
    shipping_info: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zip: v.string(),
      country: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Validation
    if (args.items.length === 0) {
      throw new Error("Order must have at least one item");
    }

    // Verify customer exists
    const customer = await ctx.db.get(args.customer_id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Calculate total price and verify products exist and have sufficient stock
    let total_price = 0;
    const stockUpdates: { productId: string; newStock: number }[] = [];

    for (const item of args.items) {
      if (item.quantity <= 0) {
        throw new Error("Item quantity must be greater than 0");
      }

      const product = await ctx.db.get(item.product_id);
      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      total_price += product.price * item.quantity;
      stockUpdates.push({
        productId: item.product_id,
        newStock: product.stock - item.quantity,
      });
    }

    const now = Date.now();
    
    // Create the order
    const orderId = await ctx.db.insert("orders", {
      customer_id: args.customer_id,
      items: args.items,
      status: "pending",
      total_price,
      shipping_info: args.shipping_info,
      created_at: now,
      updated_at: now,
    });

    // Update product stock levels
    for (const update of stockUpdates) {
      await ctx.db.patch(update.productId as any, { stock: update.newStock });
    }

    return await ctx.db.get(orderId);
  },
});

// Mutation to update order status
export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new Error("Order not found");
    }

    // If cancelling an order, restore product stock
    if (args.status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        const product = await ctx.db.get(item.product_id);
        if (product) {
          await ctx.db.patch(item.product_id, {
            stock: product.stock + item.quantity,
          });
        }
      }
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

// Mutation to update shipping info
export const updateShippingInfo = mutation({
  args: {
    id: v.id("orders"),
    shipping_info: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zip: v.string(),
      country: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.id, {
      shipping_info: args.shipping_info,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

// Mutation to delete an order (only if pending or cancelled)
export const remove = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "pending" && order.status !== "cancelled") {
      throw new Error("Can only delete pending or cancelled orders");
    }

    // If order was pending, restore product stock
    if (order.status === "pending") {
      for (const item of order.items) {
        const product = await ctx.db.get(item.product_id);
        if (product) {
          await ctx.db.patch(item.product_id, {
            stock: product.stock + item.quantity,
          });
        }
      }
    }

    await ctx.db.delete(args.id);
    return { success: true, deletedId: args.id };
  },
});