import { mutation } from "./_generated/server";

/**
 * Schema validation test - verifies business rules and data integrity
 * Tests various edge cases and validation scenarios
 */
export const testSchemaValidation = mutation({
  args: {},
  handler: async (ctx) => {
    const validationResults = [];

    try {
      // Test 1: Product validation
      console.log("Testing product validation...");
      
      try {
        // Should fail - negative price
        await ctx.db.insert("products", {
          name: "Invalid Product",
          description: "Test",
          price: -10,
          images: [],
          videos: [],
          stock: 0,
          customization_options: [],
        });
        validationResults.push({ test: "Product negative price", status: "FAIL - should have been rejected" });
      } catch (error) {
        validationResults.push({ test: "Product negative price", status: "PASS - correctly rejected" });
      }

      // Test 2: Customer email validation
      console.log("Testing customer validation...");

      try {
        // Should fail - invalid email
        await ctx.db.insert("customers", {
          name: "Test Customer",
          email: "invalid-email",
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
        validationResults.push({ test: "Customer invalid email", status: "FAIL - should have been rejected" });
      } catch (error) {
        validationResults.push({ test: "Customer invalid email", status: "PASS - correctly rejected" });
      }

      // Test 3: Order status validation
      console.log("Testing order status validation...");

      // First create valid dependencies
      const productId = await ctx.db.insert("products", {
        name: "Valid Product", 
        description: "Test",
        price: 29.99,
        images: [],
        videos: [],
        stock: 10,
        customization_options: [],
      });

      const customerId = await ctx.db.insert("customers", {
        name: "Valid Customer",
        email: "valid@example.com",
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

      try {
        // Should fail - invalid status
        await ctx.db.insert("orders", {
          customer_id: customerId,
          items: [{
            product_id: productId,
            quantity: 1,
          }],
          status: "invalid_status" as any,
          total_price: 29.99,
          shipping_info: {
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            zip: "12345",
            country: "US",
          },
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        validationResults.push({ test: "Order invalid status", status: "FAIL - should have been rejected" });
      } catch (error) {
        validationResults.push({ test: "Order invalid status", status: "PASS - correctly rejected" });
      }

      // Test 4: Gift box empty items validation
      console.log("Testing gift box validation...");

      try {
        // Should fail - empty items array  
        await ctx.db.insert("giftBoxes", {
          items: [],
          totalPrice: 0,
          personalizationMessage: "Test",
          created_at: Date.now(),
        });
        validationResults.push({ test: "Gift box empty items", status: "FAIL - should have been rejected" });
      } catch (error) {
        validationResults.push({ test: "Gift box empty items", status: "PASS - correctly rejected" });
      }

      // Test 5: Corporate billing duplicate customer validation
      console.log("Testing corporate billing validation...");

      // Create one valid corporate billing
      const billingId1 = await ctx.db.insert("corporateBillingInfo", {
        customer_id: customerId,
        company_name: "Test Corp",
        tax_id: "123-45-6789", 
        billing_contact: {
          name: "John Doe",
          email: "billing@testcorp.com",
        },
      });

      try {
        // Should fail - duplicate customer
        await ctx.db.insert("corporateBillingInfo", {
          customer_id: customerId,
          company_name: "Another Corp",
          tax_id: "987-65-4321",
          billing_contact: {
            name: "Jane Doe", 
            email: "billing2@testcorp.com",
          },
        });
        validationResults.push({ test: "Corporate billing duplicate customer", status: "FAIL - should have been rejected" });
      } catch (error) {
        validationResults.push({ test: "Corporate billing duplicate customer", status: "PASS - correctly rejected" });
      }

      // Test 6: Relationship validation
      console.log("Testing relationship validation...");

      try {
        // Should fail - non-existent customer reference
        await ctx.db.insert("orders", {
          customer_id: "non-existent-id" as any,
          items: [{
            product_id: productId,
            quantity: 1,
          }],
          status: "pending",
          total_price: 29.99,
          shipping_info: {
            street: "123 Test St",
            city: "Test City", 
            state: "Test State",
            zip: "12345",
            country: "US",
          },
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        validationResults.push({ test: "Order non-existent customer", status: "FAIL - should have been rejected" });
      } catch (error) {
        validationResults.push({ test: "Order non-existent customer", status: "PASS - correctly rejected" });
      }

      // Clean up test data
      await ctx.db.delete(billingId1);
      await ctx.db.delete(customerId);  
      await ctx.db.delete(productId);

      const passedTests = validationResults.filter(r => r.status.includes("PASS")).length;
      const totalTests = validationResults.length;

      return {
        summary: `Schema validation completed: ${passedTests}/${totalTests} tests passed`,
        results: validationResults,
        overall: passedTests === totalTests ? "PASS" : "REVIEW",
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      return {
        summary: "Schema validation test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        results: validationResults,
        timestamp: new Date().toISOString(),
      };
    }
  },
});