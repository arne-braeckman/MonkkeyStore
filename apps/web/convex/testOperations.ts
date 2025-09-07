import { mutation } from "./_generated/server";

/**
 * Test script to verify CRUD operations work correctly
 * This mutation should be run in the Convex dashboard to test functionality
 * 
 * Performance monitoring: Measures CRUD operation response times
 */
export const runTests = mutation({
  args: {},
  handler: async (ctx) => {
    const testResults = [];
    const startTime = performance.now();

    try {
      // Test 1: Product CRUD operations
      console.time('product-crud-test');
      
      // Create a test product
      const productId = await ctx.db.insert("products", {
        name: "Test Product",
        description: "A test product for validation",
        price: 29.99,
        images: ["https://example.com/image1.jpg"],
        videos: ["https://example.com/video1.mp4"],
        stock: 100,
        customization_options: [{
          area: "front",
          type: "text",
          options: ["Custom Text", "Logo"],
        }],
      });

      // Read the product
      const product = await ctx.db.get(productId);
      if (!product) throw new Error("Product not found after creation");

      // Update the product
      await ctx.db.patch(productId, { price: 34.99, stock: 95 });
      const updatedProduct = await ctx.db.get(productId);
      if (updatedProduct?.price !== 34.99) throw new Error("Product update failed");

      console.timeEnd('product-crud-test');
      testResults.push({ test: "Product CRUD", status: "PASS" });

      // Test 2: Customer CRUD operations
      console.time('customer-crud-test');

      const customerId = await ctx.db.insert("customers", {
        name: "Test Customer",
        email: "test@example.com",
        phone_number: "+1-555-0123",
        address: {
          billing: {
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            zip: "12345",
            country: "US",
          },
          shipping: {
            street: "123 Test St",
            city: "Test City",
            state: "Test State", 
            zip: "12345",
            country: "US",
          },
        },
      });

      const customer = await ctx.db.get(customerId);
      if (!customer) throw new Error("Customer not found after creation");

      console.timeEnd('customer-crud-test');
      testResults.push({ test: "Customer CRUD", status: "PASS" });

      // Test 3: Order CRUD operations
      console.time('order-crud-test');

      const now = Date.now();
      const orderId = await ctx.db.insert("orders", {
        customer_id: customerId,
        items: [{
          product_id: productId,
          quantity: 2,
          personalization: {
            area: "front",
            text: "Custom Text",
          },
        }],
        status: "pending",
        total_price: 69.98,
        shipping_info: {
          street: "123 Test St",
          city: "Test City",
          state: "Test State",
          zip: "12345",
          country: "US",
        },
        created_at: now,
        updated_at: now,
      });

      const order = await ctx.db.get(orderId);
      if (!order) throw new Error("Order not found after creation");

      // Update order status
      await ctx.db.patch(orderId, { 
        status: "processing", 
        updated_at: Date.now() 
      });

      console.timeEnd('order-crud-test');
      testResults.push({ test: "Order CRUD", status: "PASS" });

      // Test 4: Gift Box operations
      console.time('giftbox-crud-test');

      const giftBoxId = await ctx.db.insert("giftBoxes", {
        items: [productId],
        totalPrice: 34.99,
        personalizationMessage: "Happy Birthday!",
        created_at: Date.now(),
      });

      const giftBox = await ctx.db.get(giftBoxId);
      if (!giftBox) throw new Error("Gift box not found after creation");

      console.timeEnd('giftbox-crud-test');
      testResults.push({ test: "GiftBox CRUD", status: "PASS" });

      // Test 5: Corporate Billing operations
      console.time('corporate-billing-crud-test');

      const billingId = await ctx.db.insert("corporateBillingInfo", {
        customer_id: customerId,
        company_name: "Test Corp",
        tax_id: "123-45-6789",
        billing_contact: {
          name: "John Doe",
          email: "billing@testcorp.com",
        },
      });

      const billing = await ctx.db.get(billingId);
      if (!billing) throw new Error("Corporate billing not found after creation");

      console.timeEnd('corporate-billing-crud-test');
      testResults.push({ test: "Corporate Billing CRUD", status: "PASS" });

      // Test 6: Index queries
      console.time('index-queries-test');

      // Test customer by email index
      const customerByEmail = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", "test@example.com"))
        .first();
      
      if (!customerByEmail) throw new Error("Customer index query failed");

      // Test orders by customer index
      const ordersByCustomer = await ctx.db
        .query("orders")
        .withIndex("by_customer", (q) => q.eq("customer_id", customerId))
        .collect();
      
      if (ordersByCustomer.length === 0) throw new Error("Order index query failed");

      console.timeEnd('index-queries-test');
      testResults.push({ test: "Index Queries", status: "PASS" });

      // Clean up test data
      await ctx.db.delete(billingId);
      await ctx.db.delete(giftBoxId);
      await ctx.db.delete(orderId);
      await ctx.db.delete(customerId);
      await ctx.db.delete(productId);

      const totalTime = performance.now() - startTime;
      
      return {
        summary: "All CRUD operations completed successfully",
        totalTime: `${totalTime.toFixed(2)}ms`,
        results: testResults,
        performance: {
          requirement: "< 100ms per operation",
          actual: `${(totalTime / testResults.length).toFixed(2)}ms average`,
          status: totalTime / testResults.length < 100 ? "PASS" : "REVIEW",
        },
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      return {
        summary: "Test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        results: testResults,
        timestamp: new Date().toISOString(),
      };
    }
  },
});