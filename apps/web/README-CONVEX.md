# Convex Database Setup - Implementation Guide

## Quick Start

1. **Install Dependencies** (Already completed)
   ```bash
   npm install convex
   ```

2. **Environment Configuration**
   ```bash
   # Copy the example environment file
   cp .env.local.example .env.local
   
   # Run Convex development server to get your deployment URL
   npx convex dev
   
   # Copy the displayed URL to your .env.local file
   # Example: NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```

3. **Development Workflow**
   ```bash
   # Start Convex development server (watches for changes)
   npx convex dev
   
   # In another terminal, start Next.js
   npm run dev
   ```

## Project Structure

```
convex/
├── schema.ts              # Database schema definitions
├── products.ts           # Product CRUD operations
├── customers.ts          # Customer CRUD operations  
├── orders.ts            # Order CRUD operations
├── giftBoxes.ts         # Gift box CRUD operations
├── corporateBilling.ts  # Corporate billing CRUD operations
├── testOperations.ts    # CRUD operation tests
├── validateSchema.ts    # Schema validation tests
└── _generated/          # Auto-generated types and API (gitignored)

src/lib/
└── convex.ts           # Client configuration and utilities
```

## Database Schema

### Tables Implemented:
- **products**: Product catalog with customization options
- **customers**: Customer information with billing/shipping addresses  
- **orders**: Orders with items, status tracking, and relationships
- **giftBoxes**: Gift box collections with personalization
- **corporateBillingInfo**: Corporate customer billing details

### Key Features:
- Type-safe queries and mutations
- Built-in validation with business rules
- Indexed queries for performance
- Real-time subscriptions
- Automatic relationship handling

## Testing

### Running Tests

Tests are implemented as Convex mutations that can be run in the Convex dashboard:

1. Open your Convex dashboard (URL shown when running `npx convex dev`)
2. Navigate to "Functions" tab
3. Run these test functions:
   - `testOperations:runTests` - Complete CRUD operation test
   - `validateSchema:testSchemaValidation` - Schema validation test

### Performance Monitoring

The implementation includes performance monitoring:
- Connection initialization timing (< 2 second requirement)
- CRUD operation response times (< 100ms requirement)  
- Console logging of performance metrics

## Key Implementation Details

### Repository Pattern
- All Convex operations are abstracted through the functions
- Client code uses `useQuery` and `useMutation` hooks
- Easy to migrate to different database if needed

### Validation
- Schema-level validation using Convex validators
- Business rule validation in function handlers
- Proper error messages for debugging

### Performance Optimizations
- Strategic database indexes on commonly queried fields
- Efficient queries with proper filtering
- Pagination support for large datasets

## Environment Variables

### Development
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Production (Additional)
```bash
CONVEX_DEPLOY_KEY=your-production-deploy-key
```

## Migration Planning

### Data Export Utilities
The `ConvexDataExporter` class provides utilities for potential future migrations:
- Export table data to JSON/CSV
- Schema documentation 
- Feature usage tracking

### Convex-Specific Features Used
- Type-safe schema definitions with `v` validators
- Index definitions for query optimization  
- Real-time subscriptions (when implemented in UI)
- Serverless function deployment
- Automatic code generation

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
   - Ensure `npx convex dev` is running
   - Check network connectivity

2. **Type Errors**
   - Run `npx convex dev` to regenerate types
   - Ensure schema changes are deployed

3. **Build Issues**
   - Verify TypeScript configuration
   - Check for missing dependencies

### Performance Validation

Expected performance benchmarks:
- Database connection: < 2 seconds
- CRUD operations: < 100ms average
- Build impact: < 10% increase

## Next Steps

1. **Run Setup**: Execute `npx convex dev` to complete setup
2. **Add to Layout**: Integrate `ConvexProviderWrapper` in app layout
3. **Implement UI**: Create components using `useQuery`/`useMutation` hooks
4. **Add Authentication**: Integrate with NextAuth.js (Story 1.3)
5. **Testing**: Run comprehensive test suite

## Security Notes

- Environment variables properly configured
- Type-safe queries prevent basic injection attacks
- Generated files excluded from git (`.convex/` directory)
- Authentication intentionally deferred to later stories per architecture