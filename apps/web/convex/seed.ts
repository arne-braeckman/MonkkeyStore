import { mutation } from "./_generated/server";

/**
 * Database seeding for development environments
 * Creates sample data for testing and development
 */

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🌱 Starting database seeding...");
    const startTime = Date.now();

    try {
      // Check if data already exists
      const existingProducts = await ctx.db.query("products").collect();
      if (existingProducts.length > 0) {
        console.log("⚠️ Database already contains data. Skipping seed.");
        return { success: false, message: "Database already seeded" };
      }

      // Seed Products
      console.log("📦 Seeding products...");
      const productIds = [];

      const sampleProducts = [
        {
          name: "Custom Photo Frame",
          description: "Beautiful wooden photo frame with custom engraving options",
          price: 29.99,
          images: [
            "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400",
            "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800"
          ],
          videos: [],
          stock: 50,
          customization_options: [
            {
              area: "front",
              type: "engraving",
              options: ["Name", "Date", "Message"]
            }
          ],
          isDeleted: false
        },
        {
          name: "Personalized Mug",
          description: "High-quality ceramic mug with photo and text customization",
          price: 15.99,
          images: [
            "https://images.unsplash.com/photo-1514228742587-6b1558fcf93c?w=400"
          ],
          videos: [],
          stock: 100,
          customization_options: [
            {
              area: "side",
              type: "photo",
              options: ["Upload Photo", "Add Text"]
            }
          ],
          isDeleted: false
        },
        {
          name: "Custom T-Shirt",
          description: "Premium cotton t-shirt with custom printing",
          price: 24.99,
          images: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"
          ],
          videos: [],
          stock: 75,
          customization_options: [
            {
              area: "front",
              type: "print",
              options: ["Text", "Logo", "Design"]
            },
            {
              area: "back",
              type: "print",
              options: ["Text", "Logo"]
            }
          ],
          isDeleted: false
        },
        {
          name: "Engraved Watch",
          description: "Elegant watch with custom engraving on the back",
          price: 149.99,
          images: [
            "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400"
          ],
          videos: [],
          stock: 25,
          customization_options: [
            {
              area: "back",
              type: "engraving",
              options: ["Name", "Date", "Message", "Initials"]
            }
          ],
          isDeleted: false
        },
        {
          name: "Custom Phone Case",
          description: "Protective phone case with personalized design",
          price: 19.99,
          images: [
            "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400"
          ],
          videos: [],
          stock: 200,
          customization_options: [
            {
              area: "back",
              type: "print",
              options: ["Photo", "Pattern", "Text", "Monogram"]
            }
          ],
          isDeleted: false
        }
      ];

      for (const product of sampleProducts) {
        const id = await ctx.db.insert("products", product);
        productIds.push(id);
        console.log(`✓ Created product: ${product.name}`);
      }

      // Seed Customers
      console.log("👥 Seeding customers...");
      const customerIds = [];

      const sampleCustomers = [
        {
          name: "John Smith",
          email: "john.smith@example.com",
          phone_number: "+1-555-0101",
          address: {
            billing: {
              street: "123 Main St",
              city: "New York",
              state: "NY",
              zip: "10001",
              country: "US"
            },
            shipping: {
              street: "123 Main St",
              city: "New York", 
              state: "NY",
              zip: "10001",
              country: "US"
            }
          },
          isDeleted: false
        },
        {
          name: "Sarah Johnson",
          email: "sarah.johnson@example.com",
          phone_number: "+1-555-0102",
          address: {
            billing: {
              street: "456 Oak Ave",
              city: "Los Angeles",
              state: "CA",
              zip: "90210",
              country: "US"
            },
            shipping: {
              street: "789 Pine St",
              city: "Los Angeles",
              state: "CA", 
              zip: "90211",
              country: "US"
            }
          },
          isDeleted: false
        },
        {
          name: "Mike Davis",
          email: "mike.davis@example.com",
          phone_number: "+1-555-0103",
          address: {
            billing: {
              street: "321 Elm St",
              city: "Chicago",
              state: "IL",
              zip: "60601",
              country: "US"
            },
            shipping: {
              street: "321 Elm St",
              city: "Chicago",
              state: "IL",
              zip: "60601",
              country: "US"
            }
          },
          isDeleted: false
        }
      ];

      for (const customer of sampleCustomers) {
        const id = await ctx.db.insert("customers", customer);
        customerIds.push(id);
        console.log(`✓ Created customer: ${customer.name}`);
      }

      // Seed Orders
      console.log("📋 Seeding orders...");
      const orderIds = [];

      const now = Date.now();
      const sampleOrders = [
        {
          customer_id: customerIds[0],
          items: [
            {
              product_id: productIds[0],
              quantity: 1,
              personalization: {
                area: "front",
                text: "John & Jane Forever",
                font: "Script",
                color: "Gold"
              }
            }
          ],
          status: "processing",
          total_price: 29.99,
          shipping_info: {
            street: "123 Main St",
            city: "New York",
            state: "NY", 
            zip: "10001",
            country: "US"
          },
          created_at: now - (7 * 24 * 60 * 60 * 1000), // 7 days ago
          updated_at: now - (6 * 24 * 60 * 60 * 1000), // 6 days ago
          isDeleted: false
        },
        {
          customer_id: customerIds[1],
          items: [
            {
              product_id: productIds[1],
              quantity: 2,
              personalization: {
                area: "side",
                text: "World's Best Mom"
              }
            },
            {
              product_id: productIds[4],
              quantity: 1,
              personalization: {
                area: "back",
                text: "SJ"
              }
            }
          ],
          status: "delivered",
          total_price: 51.97, // 2 * 15.99 + 19.99
          shipping_info: {
            street: "789 Pine St",
            city: "Los Angeles",
            state: "CA",
            zip: "90211",
            country: "US"
          },
          created_at: now - (14 * 24 * 60 * 60 * 1000), // 14 days ago
          updated_at: now - (10 * 24 * 60 * 60 * 1000), // 10 days ago
          isDeleted: false
        },
        {
          customer_id: customerIds[2],
          items: [
            {
              product_id: productIds[3],
              quantity: 1,
              personalization: {
                area: "back",
                text: "Happy Anniversary\n2020-2025",
                font: "Classic"
              }
            }
          ],
          status: "pending",
          total_price: 149.99,
          shipping_info: {
            street: "321 Elm St",
            city: "Chicago",
            state: "IL",
            zip: "60601", 
            country: "US"
          },
          created_at: now - (2 * 24 * 60 * 60 * 1000), // 2 days ago
          updated_at: now - (2 * 24 * 60 * 60 * 1000), // 2 days ago
          isDeleted: false
        }
      ];

      for (const order of sampleOrders) {
        const id = await ctx.db.insert("orders", order);
        orderIds.push(id);
        console.log(`✓ Created order with ${order.items.length} items`);
      }

      // Seed Gift Boxes
      console.log("🎁 Seeding gift boxes...");
      const giftBoxIds = [];

      const sampleGiftBoxes = [
        {
          items: [productIds[0], productIds[1]],
          totalPrice: 45.98, // 29.99 + 15.99
          personalizationMessage: "Happy Birthday! Hope you love these personalized gifts.",
          created_at: now - (3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        {
          items: [productIds[2], productIds[4]],
          totalPrice: 44.98, // 24.99 + 19.99
          personalizationMessage: "Congratulations on your graduation!",
          created_at: now - (5 * 24 * 60 * 60 * 1000) // 5 days ago
        }
      ];

      for (const giftBox of sampleGiftBoxes) {
        const id = await ctx.db.insert("giftBoxes", giftBox);
        giftBoxIds.push(id);
        console.log(`✓ Created gift box with ${giftBox.items.length} items`);
      }

      // Seed Corporate Billing Info
      console.log("🏢 Seeding corporate billing info...");

      const corporateBilling = {
        customer_id: customerIds[1], // Sarah Johnson
        company_name: "Johnson Marketing LLC",
        tax_id: "12-3456789",
        billing_contact: {
          name: "Sarah Johnson",
          email: "billing@johnsonmarketing.com"
        },
        isDeleted: false
      };

      const billingId = await ctx.db.insert("corporateBillingInfo", corporateBilling);
      console.log(`✓ Created corporate billing for ${corporateBilling.company_name}`);

      const duration = Date.now() - startTime;
      console.log(`🎉 Database seeding completed in ${duration}ms`);

      return {
        success: true,
        message: "Database seeded successfully",
        data: {
          products: productIds.length,
          customers: customerIds.length,
          orders: orderIds.length,
          giftBoxes: giftBoxIds.length,
          corporateBilling: 1
        },
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Database seeding failed after ${duration}ms:`, error);
      throw error;
    }
  }
});

/**
 * Clear all data (for development/testing)
 */
export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🗑️ Clearing database...");
    const startTime = Date.now();

    try {
      // Clear in reverse dependency order to avoid foreign key issues
      const tables = [
        "corporateBillingInfo",
        "giftBoxes", 
        "orders",
        "customers",
        "products"
      ];

      let totalDeleted = 0;

      for (const table of tables) {
        const records = await ctx.db.query(table as any).collect();
        for (const record of records) {
          await ctx.db.delete(record._id);
          totalDeleted++;
        }
        console.log(`✓ Cleared ${records.length} records from ${table}`);
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 Database cleared: ${totalDeleted} records deleted in ${duration}ms`);

      return {
        success: true,
        message: `Database cleared: ${totalDeleted} records deleted`,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Database clearing failed after ${duration}ms:`, error);
      throw error;
    }
  }
});

/**
 * Seed specific entity type with custom data
 */
export const seedCustomData = mutation({
  args: {
    entityType: v.string(),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    console.log(`🌱 Seeding ${args.count} ${args.entityType} records...`);
    
    // This is a placeholder for custom seeding logic
    // Can be expanded based on specific needs
    
    return {
      success: true,
      message: `Custom seeding for ${args.entityType} would be implemented here`,
      entityType: args.entityType,
      count: args.count
    };
  }
});

import { v } from "convex/values";