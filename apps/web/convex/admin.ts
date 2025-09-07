import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Admin utilities for data management
 * Provides administrative functions for managing the database
 */

/**
 * Get database statistics and health information
 */
export const getDatabaseStats = query({
  args: {},
  handler: async (ctx) => {
    console.log("📊 Gathering database statistics...");
    const startTime = Date.now();

    try {
      // Get counts for all tables
      const [
        products,
        customers,
        orders, 
        giftBoxes,
        corporateBilling
      ] = await Promise.all([
        ctx.db.query("products").collect(),
        ctx.db.query("customers").collect(),
        ctx.db.query("orders").collect(),
        ctx.db.query("giftBoxes").collect(),
        ctx.db.query("corporateBillingInfo").collect()
      ]);

      // Calculate active vs deleted counts
      const stats = {
        products: {
          total: products.length,
          active: products.filter(p => !p.isDeleted).length,
          deleted: products.filter(p => p.isDeleted).length,
          totalValue: products
            .filter(p => !p.isDeleted)
            .reduce((sum, p) => sum + (p.price * p.stock), 0),
          lowStock: products
            .filter(p => !p.isDeleted && p.stock < 10).length
        },
        customers: {
          total: customers.length,
          active: customers.filter(c => !c.isDeleted).length,
          deleted: customers.filter(c => c.isDeleted).length,
          withCorporateAccounts: customers.filter(c => 
            !c.isDeleted && corporateBilling.some(b => b.customer_id === c._id)
          ).length
        },
        orders: {
          total: orders.length,
          active: orders.filter(o => !o.isDeleted).length,
          deleted: orders.filter(o => o.isDeleted).length,
          byStatus: {
            pending: orders.filter(o => !o.isDeleted && o.status === "pending").length,
            processing: orders.filter(o => !o.isDeleted && o.status === "processing").length,
            shipped: orders.filter(o => !o.isDeleted && o.status === "shipped").length,
            delivered: orders.filter(o => !o.isDeleted && o.status === "delivered").length,
            cancelled: orders.filter(o => !o.isDeleted && o.status === "cancelled").length,
          },
          totalValue: orders
            .filter(o => !o.isDeleted)
            .reduce((sum, o) => sum + o.total_price, 0),
          recentOrders: orders
            .filter(o => !o.isDeleted && o.created_at > (Date.now() - 7 * 24 * 60 * 60 * 1000))
            .length
        },
        giftBoxes: {
          total: giftBoxes.length,
          totalValue: giftBoxes.reduce((sum, g) => sum + g.totalPrice, 0),
          averageItems: giftBoxes.length > 0 
            ? giftBoxes.reduce((sum, g) => sum + g.items.length, 0) / giftBoxes.length 
            : 0
        },
        corporateBilling: {
          total: corporateBilling.length,
          active: corporateBilling.filter(b => !b.isDeleted).length,
          deleted: corporateBilling.filter(b => b.isDeleted).length,
        }
      };

      const duration = Date.now() - startTime;
      
      return {
        stats,
        metadata: {
          generatedAt: new Date().toISOString(),
          queryDuration: duration
        }
      };

    } catch (error) {
      console.error("❌ Failed to gather database statistics:", error);
      throw error;
    }
  }
});

/**
 * Bulk operations for administrative tasks
 */
export const bulkUpdatePrices = mutation({
  args: {
    categoryFilter: v.optional(v.string()),
    priceAdjustment: v.number(), // percentage change (e.g., 1.1 for 10% increase)
  },
  handler: async (ctx, args) => {
    console.log(`💰 Bulk updating prices with ${args.priceAdjustment}x multiplier...`);
    const startTime = Date.now();

    try {
      const products = await ctx.db
        .query("products")
        .filter(q => q.eq(q.field("isDeleted"), false))
        .collect();

      let updatedCount = 0;

      for (const product of products) {
        // Apply category filter if specified
        if (args.categoryFilter && !product.name.toLowerCase().includes(args.categoryFilter.toLowerCase())) {
          continue;
        }

        const newPrice = Math.round(product.price * args.priceAdjustment * 100) / 100;
        
        // Ensure price doesn't exceed maximum
        const finalPrice = Math.min(newPrice, 999999.99);

        await ctx.db.patch(product._id, { price: finalPrice });
        updatedCount++;

        console.log(`✓ Updated ${product.name}: $${product.price} → $${finalPrice}`);
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 Bulk price update completed: ${updatedCount} products updated in ${duration}ms`);

      return {
        success: true,
        updatedCount,
        duration,
        adjustment: args.priceAdjustment
      };

    } catch (error) {
      console.error("❌ Bulk price update failed:", error);
      throw error;
    }
  }
});

/**
 * Bulk stock adjustment
 */
export const bulkStockAdjustment = mutation({
  args: {
    productIds: v.optional(v.array(v.id("products"))),
    stockChange: v.number(), // positive for increase, negative for decrease
    reason: v.string()
  },
  handler: async (ctx, args) => {
    console.log(`📦 Bulk adjusting stock by ${args.stockChange} units...`);
    const startTime = Date.now();

    try {
      let products;
      
      if (args.productIds && args.productIds.length > 0) {
        // Update specific products
        products = await Promise.all(
          args.productIds.map(id => ctx.db.get(id))
        );
        products = products.filter(p => p && !p.isDeleted);
      } else {
        // Update all active products
        products = await ctx.db
          .query("products")
          .filter(q => q.eq(q.field("isDeleted"), false))
          .collect();
      }

      let updatedCount = 0;

      for (const product of products) {
        if (!product) continue;

        const newStock = Math.max(0, product.stock + args.stockChange);
        
        await ctx.db.patch(product._id, { stock: newStock });
        updatedCount++;

        console.log(`✓ Updated ${product.name} stock: ${product.stock} → ${newStock}`);
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 Bulk stock adjustment completed: ${updatedCount} products updated in ${duration}ms`);

      // Log audit trail
      console.log(`AUDIT: Bulk stock adjustment`, {
        reason: args.reason,
        stockChange: args.stockChange,
        productsAffected: updatedCount,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        updatedCount,
        duration,
        stockChange: args.stockChange,
        reason: args.reason
      };

    } catch (error) {
      console.error("❌ Bulk stock adjustment failed:", error);
      throw error;
    }
  }
});

/**
 * Clean up soft deleted records beyond retention period
 */
export const cleanupSoftDeleted = mutation({
  args: {
    entityType: v.string(),
    retentionDays: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const retentionDays = args.retentionDays || 30;
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

    console.log(`🗑️ Cleaning up ${args.entityType} records older than ${retentionDays} days...`);
    const startTime = Date.now();

    try {
      let records: any[] = [];

      // Get soft deleted records based on entity type
      switch (args.entityType) {
        case "products":
          records = await ctx.db
            .query("products")
            .filter(q => q.and(
              q.eq(q.field("isDeleted"), true),
              q.lt(q.field("deletedAt"), cutoffTime)
            ))
            .collect();
          break;
        case "customers":
          records = await ctx.db
            .query("customers")
            .filter(q => q.and(
              q.eq(q.field("isDeleted"), true),
              q.lt(q.field("deletedAt"), cutoffTime)
            ))
            .collect();
          break;
        case "orders":
          records = await ctx.db
            .query("orders")
            .filter(q => q.and(
              q.eq(q.field("isDeleted"), true),
              q.lt(q.field("deletedAt"), cutoffTime)
            ))
            .collect();
          break;
        case "corporateBillingInfo":
          records = await ctx.db
            .query("corporateBillingInfo")
            .filter(q => q.and(
              q.eq(q.field("isDeleted"), true),
              q.lt(q.field("deletedAt"), cutoffTime)
            ))
            .collect();
          break;
        default:
          throw new Error(`Unsupported entity type: ${args.entityType}`);
      }

      let deletedCount = 0;

      for (const record of records) {
        // Log before permanent deletion
        console.log(`AUDIT: Permanent cleanup of ${args.entityType} ${record._id}`, {
          originalDeletionDate: new Date(record.deletedAt).toISOString(),
          originalDeletedBy: record.deletedBy,
          daysSinceDeletion: Math.floor((Date.now() - record.deletedAt) / (24 * 60 * 60 * 1000))
        });

        await ctx.db.delete(record._id);
        deletedCount++;
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 Cleanup completed: ${deletedCount} ${args.entityType} records permanently deleted in ${duration}ms`);

      return {
        success: true,
        entityType: args.entityType,
        deletedCount,
        retentionDays,
        duration
      };

    } catch (error) {
      console.error(`❌ Cleanup failed for ${args.entityType}:`, error);
      throw error;
    }
  }
});

/**
 * Generate data export for backup or migration
 */
export const exportData = query({
  args: {
    entityType: v.string(),
    includeDeleted: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    console.log(`📤 Exporting ${args.entityType} data...`);
    const startTime = Date.now();

    try {
      let records: any[] = [];
      const includeDeleted = args.includeDeleted || false;

      // Get records based on entity type
      switch (args.entityType) {
        case "products":
          records = includeDeleted
            ? await ctx.db.query("products").collect()
            : await ctx.db.query("products").filter(q => q.eq(q.field("isDeleted"), false)).collect();
          break;
        case "customers":
          records = includeDeleted
            ? await ctx.db.query("customers").collect()
            : await ctx.db.query("customers").filter(q => q.eq(q.field("isDeleted"), false)).collect();
          break;
        case "orders":
          records = includeDeleted
            ? await ctx.db.query("orders").collect()
            : await ctx.db.query("orders").filter(q => q.eq(q.field("isDeleted"), false)).collect();
          break;
        case "giftBoxes":
          records = await ctx.db.query("giftBoxes").collect();
          break;
        case "corporateBillingInfo":
          records = includeDeleted
            ? await ctx.db.query("corporateBillingInfo").collect()
            : await ctx.db.query("corporateBillingInfo").filter(q => q.eq(q.field("isDeleted"), false)).collect();
          break;
        default:
          throw new Error(`Unsupported entity type: ${args.entityType}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✓ Exported ${records.length} ${args.entityType} records in ${duration}ms`);

      return {
        entityType: args.entityType,
        recordCount: records.length,
        includeDeleted,
        data: records,
        metadata: {
          exportedAt: new Date().toISOString(),
          queryDuration: duration
        }
      };

    } catch (error) {
      console.error(`❌ Export failed for ${args.entityType}:`, error);
      throw error;
    }
  }
});

/**
 * System health check
 */
export const healthCheck = query({
  args: {},
  handler: async (ctx) => {
    console.log("🏥 Performing system health check...");
    const startTime = Date.now();

    try {
      const checks = {
        database: { status: "healthy", responseTime: 0 },
        dataIntegrity: { status: "healthy", issues: [] },
        performance: { status: "healthy", slowQueries: [] }
      };

      // Test database connectivity
      const dbStart = Date.now();
      await ctx.db.query("products").first();
      checks.database.responseTime = Date.now() - dbStart;

      if (checks.database.responseTime > 1000) {
        checks.database.status = "warning";
      }

      // Check data integrity (example checks)
      const orders = await ctx.db.query("orders").collect();
      const customers = await ctx.db.query("customers").collect();
      const products = await ctx.db.query("products").collect();

      // Check for orphaned orders
      const orphanedOrders = orders.filter(order => 
        !customers.some(customer => customer._id === order.customer_id)
      );

      if (orphanedOrders.length > 0) {
        checks.dataIntegrity.status = "warning";
        checks.dataIntegrity.issues.push(`${orphanedOrders.length} orphaned orders found`);
      }

      // Check for orders with invalid products
      const invalidOrderItems = orders.filter(order =>
        order.items.some(item => 
          !products.some(product => product._id === item.product_id)
        )
      );

      if (invalidOrderItems.length > 0) {
        checks.dataIntegrity.status = "warning";
        checks.dataIntegrity.issues.push(`${invalidOrderItems.length} orders with invalid product references`);
      }

      const duration = Date.now() - startTime;

      return {
        status: "completed",
        checks,
        summary: {
          overallHealth: Object.values(checks).every(check => check.status === "healthy") ? "healthy" : "warning",
          checkDuration: duration,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error("❌ Health check failed:", error);
      return {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      };
    }
  }
});