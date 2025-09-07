import { ConvexProvider, ConvexReactClient } from "convex/react";
import React, { ReactNode } from "react";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_URL environment variable.\n" +
    "Set it in your .env.local file.\n" +
    "You can get the URL by running `npx convex dev` and copying the deployment URL."
  );
}

// Create the Convex client
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Performance monitoring as per story requirements
console.time('convex-connection');

// Verify connection and log timing
convex.onTransition((state) => {
  if (state === 'synced') {
    console.timeEnd('convex-connection');
    console.log('✅ Convex connection established successfully');
  } else if (state === 'disconnected') {
    console.warn('⚠️ Convex connection lost');
  }
});

export { convex };

// Convex Provider wrapper component
interface ConvexProviderWrapperProps {
  children: ReactNode;
}

export function ConvexProviderWrapper({ children }: ConvexProviderWrapperProps) {
  return React.createElement(ConvexProvider, { client: convex }, children);
}

// Utility function to validate environment variables on startup
export function validateConvexEnvironment() {
  const requiredEnvVars = {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all Convex variables are set.'
    );
  }

  console.log('✅ Convex environment variables validated');
  return true;
}

// Data export utility for vendor lock-in mitigation
export interface ExportOptions {
  format: 'json' | 'csv';
  includeMetadata?: boolean;
}

export class ConvexDataExporter {
  private client: ConvexReactClient;

  constructor(client: ConvexReactClient) {
    this.client = client;
  }

  /**
   * Export all data from a specific table
   * This is a utility function to help with potential future migrations
   */
  async exportTable(tableName: string, options: ExportOptions = { format: 'json' }) {
    console.warn(
      `Data export is a utility function for migration planning. ` +
      `Table: ${tableName}, Format: ${options.format}`
    );
    
    // This is a placeholder for actual export functionality
    // In a real implementation, you would use Convex queries to fetch all data
    return {
      tableName,
      exportedAt: new Date().toISOString(),
      format: options.format,
      note: 'Export functionality placeholder - implement based on specific migration needs'
    };
  }

  /**
   * Get schema information for documentation purposes
   */
  getSchemaInfo() {
    return {
      tables: [
        'products',
        'customers', 
        'orders',
        'giftBoxes',
        'corporateBillingInfo'
      ],
      relationships: {
        'orders -> customers': 'Many-to-One via customer_id',
        'orders -> products': 'Many-to-Many via items array',
        'giftBoxes -> products': 'Many-to-Many via items array',
        'corporateBillingInfo -> customers': 'One-to-One via customer_id'
      },
      convexFeatures: [
        'Type-safe queries and mutations',
        'Real-time subscriptions',
        'Serverless scaling',
        'Built-in validation with v schema',
        'Indexed queries for performance',
        'Automatic code generation'
      ]
    };
  }
}