import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
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
    // Soft delete fields
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.string()),
    deletionReason: v.optional(v.string()),
  }).index("by_active", ["isDeleted"]),

  customers: defineTable({
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
    // Soft delete fields
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.string()),
    deletionReason: v.optional(v.string()),
  }).index("by_email", ["email"]).index("by_active", ["isDeleted"]),

  orders: defineTable({
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
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    total_price: v.number(),
    shipping_info: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zip: v.string(),
      country: v.string(),
    }),
    created_at: v.number(),
    updated_at: v.number(),
    // Soft delete fields
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.string()),
    deletionReason: v.optional(v.string()),
  })
    .index("by_customer", ["customer_id"])
    .index("by_status", ["status"])
    .index("by_created_at", ["created_at"])
    .index("by_active", ["isDeleted"]),

  giftBoxes: defineTable({
    items: v.array(v.id("products")),
    totalPrice: v.number(),
    personalizationMessage: v.string(),
    created_at: v.number(),
  }),

  corporateBillingInfo: defineTable({
    customer_id: v.id("customers"),
    company_name: v.string(),
    tax_id: v.string(),
    billing_contact: v.object({
      name: v.string(),
      email: v.string(),
    }),
    // Soft delete fields
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.string()),
    deletionReason: v.optional(v.string()),
  }).index("by_customer", ["customer_id"]).index("by_active", ["isDeleted"]),
});