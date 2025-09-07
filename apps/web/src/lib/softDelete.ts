/**
 * Soft delete implementation for important entities
 * Allows recovery of deleted data and maintains referential integrity
 */

export interface SoftDeleteFields {
  isDeleted?: boolean;
  deletedAt?: number;
  deletedBy?: string;
  deletionReason?: string;
}

export interface SoftDeleteOptions {
  userId?: string;
  reason?: string;
  permanent?: boolean;
}

/**
 * Soft delete utilities
 */
export class SoftDeleteManager {
  /**
   * Mark record as soft deleted
   */
  static markDeleted(options: SoftDeleteOptions = {}): SoftDeleteFields {
    const { userId, reason } = options;
    
    return {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: userId,
      deletionReason: reason || 'User initiated deletion',
    };
  }

  /**
   * Restore soft deleted record
   */
  static markRestored(): Partial<SoftDeleteFields> {
    return {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      deletionReason: undefined,
    };
  }

  /**
   * Check if record is soft deleted
   */
  static isDeleted(record: SoftDeleteFields): boolean {
    return record.isDeleted === true;
  }

  /**
   * Filter out soft deleted records
   */
  static filterActive<T extends SoftDeleteFields>(records: T[]): T[] {
    return records.filter(record => !this.isDeleted(record));
  }

  /**
   * Filter only soft deleted records
   */
  static filterDeleted<T extends SoftDeleteFields>(records: T[]): T[] {
    return records.filter(record => this.isDeleted(record));
  }

  /**
   * Get deletion info for audit
   */
  static getDeletionInfo(record: SoftDeleteFields): {
    deletedAt: Date | null;
    deletedBy: string | null;
    reason: string | null;
  } {
    return {
      deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
      deletedBy: record.deletedBy || null,
      reason: record.deletionReason || null,
    };
  }

  /**
   * Calculate days since deletion
   */
  static daysSinceDeletion(record: SoftDeleteFields): number | null {
    if (!record.deletedAt) return null;
    
    const now = Date.now();
    const diffMs = now - record.deletedAt;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if record is eligible for permanent deletion
   */
  static canPermanentlyDelete(
    record: SoftDeleteFields, 
    retentionDays: number = 30
  ): boolean {
    const daysSince = this.daysSinceDeletion(record);
    return daysSince !== null && daysSince >= retentionDays;
  }
}

/**
 * Enhanced query builders that handle soft deletes
 */
export class SoftDeleteQueryBuilder {
  /**
   * Build filter for active records only
   */
  static activeOnly() {
    return (q: any) => q.filter(q => q.eq(q.field('isDeleted'), false));
  }

  /**
   * Build filter for deleted records only
   */
  static deletedOnly() {
    return (q: any) => q.filter(q => q.eq(q.field('isDeleted'), true));
  }

  /**
   * Build filter for all records (including deleted)
   */
  static includeDeleted() {
    return null; // No filter - include all records
  }

  /**
   * Build filter for recently deleted records
   */
  static recentlyDeleted(days: number = 7) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return (q: any) => q.filter(q => 
      q.and(
        q.eq(q.field('isDeleted'), true),
        q.gte(q.field('deletedAt'), cutoff)
      )
    );
  }
}

/**
 * Soft delete configuration for different entity types
 */
export const SoftDeleteConfig = {
  // Entities that should use soft delete
  customers: {
    enabled: true,
    retentionDays: 90, // Keep deleted customers for 90 days
    cascadeDelete: ['orders', 'corporateBillingInfo'], // Related entities to also soft delete
  },
  orders: {
    enabled: true,
    retentionDays: 365, // Keep deleted orders for 1 year for audit
    cascadeDelete: [],
  },
  products: {
    enabled: true,
    retentionDays: 30, // Keep deleted products for 30 days
    cascadeDelete: [],
  },
  // Entities that should use hard delete
  giftBoxes: {
    enabled: false, // Gift boxes can be permanently deleted immediately
  },
  corporateBillingInfo: {
    enabled: true,
    retentionDays: 365, // Keep billing info for compliance
    cascadeDelete: [],
  },
} as const;

/**
 * Cleanup utilities for permanent deletion
 */
export class SoftDeleteCleanup {
  /**
   * Find records eligible for permanent deletion
   */
  static findEligibleForCleanup<T extends SoftDeleteFields>(
    records: T[],
    retentionDays: number = 30
  ): T[] {
    return records.filter(record => 
      SoftDeleteManager.isDeleted(record) &&
      SoftDeleteManager.canPermanentlyDelete(record, retentionDays)
    );
  }

  /**
   * Log cleanup operation for audit
   */
  static logCleanupOperation(
    entityType: string,
    recordId: string,
    record: SoftDeleteFields
  ): void {
    const deletionInfo = SoftDeleteManager.getDeletionInfo(record);
    console.log(`AUDIT: Permanent cleanup of ${entityType} ${recordId}`, {
      originalDeletionDate: deletionInfo.deletedAt?.toISOString(),
      originalDeletedBy: deletionInfo.deletedBy,
      daysSinceDeletion: SoftDeleteManager.daysSinceDeletion(record),
    });
  }

  /**
   * Generate cleanup report
   */
  static generateCleanupReport<T extends SoftDeleteFields>(
    entityType: string,
    records: T[],
    retentionDays: number = 30
  ): {
    totalDeleted: number;
    eligibleForCleanup: number;
    cleanupCandidates: Array<{
      id: string;
      deletedAt: Date;
      daysSinceDeletion: number;
    }>;
  } {
    const deleted = records.filter(r => SoftDeleteManager.isDeleted(r));
    const eligible = this.findEligibleForCleanup(records, retentionDays);

    return {
      totalDeleted: deleted.length,
      eligibleForCleanup: eligible.length,
      cleanupCandidates: eligible.map(record => ({
        id: (record as any)._id || 'unknown',
        deletedAt: new Date(record.deletedAt!),
        daysSinceDeletion: SoftDeleteManager.daysSinceDeletion(record)!,
      }))
    };
  }
}

/**
 * Validation for soft delete operations
 */
export class SoftDeleteValidator {
  /**
   * Validate soft delete request
   */
  static validateDeletion(
    entityType: string,
    record: any,
    options: SoftDeleteOptions = {}
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = SoftDeleteConfig[entityType as keyof typeof SoftDeleteConfig];

    // Check if soft delete is enabled for this entity
    if (!config || !config.enabled) {
      errors.push(`Soft delete is not enabled for ${entityType}`);
    }

    // Check if already deleted
    if (SoftDeleteManager.isDeleted(record)) {
      errors.push(`${entityType} is already deleted`);
    }

    // Validate deletion reason if required
    if (!options.reason || options.reason.trim().length === 0) {
      // Reason is optional but recommended
    } else if (options.reason.length > 500) {
      errors.push('Deletion reason cannot exceed 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate restoration request
   */
  static validateRestoration(
    entityType: string,
    record: any
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if record is actually deleted
    if (!SoftDeleteManager.isDeleted(record)) {
      errors.push(`${entityType} is not deleted and cannot be restored`);
    }

    // Check if within restoration window
    const daysSince = SoftDeleteManager.daysSinceDeletion(record);
    if (daysSince !== null && daysSince > 90) {
      errors.push(`${entityType} was deleted more than 90 days ago and cannot be restored`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}