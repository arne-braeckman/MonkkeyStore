import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get all gift boxes
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("giftBoxes").order("desc").collect();
  },
});

// Query to get a single gift box by ID
export const get = query({
  args: { id: v.id("giftBoxes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to get gift box with product details
export const getWithDetails = query({
  args: { id: v.id("giftBoxes") },
  handler: async (ctx, args) => {
    const giftBox = await ctx.db.get(args.id);
    if (!giftBox) return null;

    // Get product information for each item
    const productsWithDetails = await Promise.all(
      giftBox.items.map(async (productId) => {
        const product = await ctx.db.get(productId);
        return product;
      })
    );

    // Filter out any products that no longer exist
    const validProducts = productsWithDetails.filter(product => product !== null);

    return {
      ...giftBox,
      products: validProducts,
    };
  },
});

// Mutation to create a new gift box
export const create = mutation({
  args: {
    items: v.array(v.id("products")),
    personalizationMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Validation
    if (args.items.length === 0) {
      throw new Error("Gift box must contain at least one product");
    }

    // Verify all products exist and calculate total price
    let totalPrice = 0;
    const validProducts = [];

    for (const productId of args.items) {
      const product = await ctx.db.get(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }
      
      if (product.stock <= 0) {
        throw new Error(`Product out of stock: ${product.name}`);
      }

      validProducts.push(product);
      totalPrice += product.price;
    }

    const now = Date.now();

    return await ctx.db.insert("giftBoxes", {
      items: args.items,
      totalPrice,
      personalizationMessage: args.personalizationMessage,
      created_at: now,
    });
  },
});

// Mutation to update a gift box
export const update = mutation({
  args: {
    id: v.id("giftBoxes"),
    items: v.optional(v.array(v.id("products"))),
    personalizationMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const giftBox = await ctx.db.get(id);
    if (!giftBox) {
      throw new Error("Gift box not found");
    }

    // Remove undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    // If items are being updated, recalculate total price
    if (filteredUpdates.items) {
      if (filteredUpdates.items.length === 0) {
        throw new Error("Gift box must contain at least one product");
      }

      let totalPrice = 0;
      for (const productId of filteredUpdates.items) {
        const product = await ctx.db.get(productId);
        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }
        totalPrice += product.price;
      }
      
      filteredUpdates.totalPrice = totalPrice;
    }

    await ctx.db.patch(id, filteredUpdates);
    return await ctx.db.get(id);
  },
});

// Mutation to add a product to a gift box
export const addProduct = mutation({
  args: {
    id: v.id("giftBoxes"),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const giftBox = await ctx.db.get(args.id);
    if (!giftBox) {
      throw new Error("Gift box not found");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.stock <= 0) {
      throw new Error(`Product out of stock: ${product.name}`);
    }

    // Check if product is already in the gift box
    if (giftBox.items.includes(args.productId)) {
      throw new Error("Product is already in this gift box");
    }

    const updatedItems = [...giftBox.items, args.productId];
    const updatedTotalPrice = giftBox.totalPrice + product.price;

    await ctx.db.patch(args.id, {
      items: updatedItems,
      totalPrice: updatedTotalPrice,
    });

    return await ctx.db.get(args.id);
  },
});

// Mutation to remove a product from a gift box
export const removeProduct = mutation({
  args: {
    id: v.id("giftBoxes"),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const giftBox = await ctx.db.get(args.id);
    if (!giftBox) {
      throw new Error("Gift box not found");
    }

    const productIndex = giftBox.items.indexOf(args.productId);
    if (productIndex === -1) {
      throw new Error("Product not found in gift box");
    }

    if (giftBox.items.length === 1) {
      throw new Error("Cannot remove the last product from gift box");
    }

    const product = await ctx.db.get(args.productId);
    const productPrice = product?.price || 0;

    const updatedItems = giftBox.items.filter(id => id !== args.productId);
    const updatedTotalPrice = giftBox.totalPrice - productPrice;

    await ctx.db.patch(args.id, {
      items: updatedItems,
      totalPrice: Math.max(0, updatedTotalPrice), // Ensure price doesn't go negative
    });

    return await ctx.db.get(args.id);
  },
});

// Mutation to delete a gift box
export const remove = mutation({
  args: { id: v.id("giftBoxes") },
  handler: async (ctx, args) => {
    const giftBox = await ctx.db.get(args.id);
    if (!giftBox) {
      throw new Error("Gift box not found");
    }

    await ctx.db.delete(args.id);
    return { success: true, deletedId: args.id };
  },
});