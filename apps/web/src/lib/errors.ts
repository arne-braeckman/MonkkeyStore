/**
 * Enhanced error handling with error codes for better frontend integration
 * Provides structured error responses with codes, messages, and context
 */

export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  value?: any;
  context?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: ErrorDetails;
  timestamp: string;
  requestId?: string;
}

/**
 * Base application error class
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly field?: string;
  readonly value?: any;
  readonly context?: Record<string, any>;

  constructor(
    message: string, 
    field?: string, 
    value?: any, 
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.field = field;
    this.value = value;
    this.context = context;
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      field: this.field,
      value: this.value,
      context: this.context,
    };
  }

  toApiResponse(requestId?: string): ApiErrorResponse {
    return {
      success: false,
      error: this.toJSON(),
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
}

/**
 * Validation error classes
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

export class RequiredFieldError extends AppError {
  readonly code = 'REQUIRED_FIELD';
  readonly statusCode = 400;

  constructor(field: string) {
    super(`${field} is required`, field);
  }
}

export class InvalidFormatError extends AppError {
  readonly code = 'INVALID_FORMAT';
  readonly statusCode = 400;

  constructor(field: string, value?: any, expectedFormat?: string) {
    const message = expectedFormat 
      ? `${field} format is invalid. Expected: ${expectedFormat}`
      : `${field} format is invalid`;
    super(message, field, value);
  }
}

export class OutOfRangeError extends AppError {
  readonly code = 'OUT_OF_RANGE';
  readonly statusCode = 400;

  constructor(field: string, value: any, min?: number, max?: number) {
    let message = `${field} value is out of range`;
    if (min !== undefined && max !== undefined) {
      message += ` (must be between ${min} and ${max})`;
    } else if (min !== undefined) {
      message += ` (must be at least ${min})`;
    } else if (max !== undefined) {
      message += ` (must be at most ${max})`;
    }
    super(message, field, value);
  }
}

/**
 * Business logic error classes
 */
export class BusinessRuleError extends AppError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly statusCode = 400;
}

export class InsufficientStockError extends AppError {
  readonly code = 'INSUFFICIENT_STOCK';
  readonly statusCode = 400;

  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product. Requested: ${requested}, Available: ${available}`,
      'stock',
      { productId, requested, available }
    );
  }
}

export class DuplicateResourceError extends AppError {
  readonly code = 'DUPLICATE_RESOURCE';
  readonly statusCode = 409;

  constructor(resource: string, field: string, value: any) {
    super(`${resource} with ${field} '${value}' already exists`, field, value);
  }
}

export class InvalidStatusTransitionError extends AppError {
  readonly code = 'INVALID_STATUS_TRANSITION';
  readonly statusCode = 400;

  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Cannot transition from '${currentStatus}' to '${targetStatus}'`,
      'status',
      { currentStatus, targetStatus }
    );
  }
}

/**
 * Resource error classes
 */
export class ResourceNotFoundError extends AppError {
  readonly code = 'RESOURCE_NOT_FOUND';
  readonly statusCode = 404;

  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    super(message, 'id', id);
  }
}

export class ResourceDeleteError extends AppError {
  readonly code = 'RESOURCE_DELETE_ERROR';
  readonly statusCode = 400;

  constructor(resource: string, reason: string) {
    super(`Cannot delete ${resource}: ${reason}`);
  }
}

/**
 * Permission error classes
 */
export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message: string = 'Unauthorized access') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(resource?: string, action?: string) {
    const message = resource && action
      ? `Access denied: Cannot ${action} ${resource}`
      : 'Access denied';
    super(message);
  }
}

/**
 * System error classes
 */
export class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;

  constructor(operation: string, table?: string, originalError?: Error) {
    const message = table
      ? `Database error during ${operation} on ${table}`
      : `Database error during ${operation}`;
    super(message, undefined, undefined, { originalError: originalError?.message });
  }
}

export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly statusCode = 502;

  constructor(service: string, operation: string) {
    super(`${service} service error during ${operation}`);
  }
}

export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;

  constructor(limit: number, window: string) {
    super(`Rate limit exceeded: ${limit} requests per ${window}`);
  }
}

/**
 * Error factory functions for common database operations
 */
export class DatabaseErrorFactory {
  static productNotFound(id: string): ResourceNotFoundError {
    return new ResourceNotFoundError('Product', id);
  }

  static customerNotFound(id: string): ResourceNotFoundError {
    return new ResourceNotFoundError('Customer', id);
  }

  static orderNotFound(id: string): ResourceNotFoundError {
    return new ResourceNotFoundError('Order', id);
  }

  static duplicateEmail(email: string): DuplicateResourceError {
    return new DuplicateResourceError('Customer', 'email', email);
  }

  static insufficientStock(productId: string, requested: number, available: number): InsufficientStockError {
    return new InsufficientStockError(productId, requested, available);
  }

  static invalidPrice(price: any): ValidationError {
    if (typeof price !== 'number') {
      return new ValidationError('Price must be a number', 'price', price);
    }
    if (price <= 0) {
      return new ValidationError('Price must be greater than 0', 'price', price);
    }
    if (price > 999999.99) {
      return new ValidationError('Price exceeds maximum allowed value', 'price', price);
    }
    return new ValidationError('Invalid price', 'price', price);
  }

  static invalidStock(stock: any): ValidationError {
    if (typeof stock !== 'number') {
      return new ValidationError('Stock must be a number', 'stock', stock);
    }
    if (stock < 0) {
      return new ValidationError('Stock cannot be negative', 'stock', stock);
    }
    if (!Number.isInteger(stock)) {
      return new ValidationError('Stock must be a whole number', 'stock', stock);
    }
    return new ValidationError('Invalid stock quantity', 'stock', stock);
  }

  static invalidOrderStatus(status: string): ValidationError {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    return new ValidationError(
      `Invalid order status. Must be one of: ${validStatuses.join(', ')}`,
      'status',
      status
    );
  }

  static cannotDeleteCustomerWithOrders(customerId: string): ResourceDeleteError {
    return new ResourceDeleteError('Customer', 'customer has existing orders');
  }

  static invalidStatusTransition(current: string, target: string): InvalidStatusTransitionError {
    return new InvalidStatusTransitionError(current, target);
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Handle and format errors consistently
   */
  static handle(error: unknown, context?: Record<string, any>): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      // Convert known error patterns to app errors
      if (error.message.includes('not found')) {
        return new ResourceNotFoundError('Resource');
      }
      if (error.message.includes('validation')) {
        return new ValidationError(error.message);
      }
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        return new DuplicateResourceError('Resource', 'field', 'value');
      }
      
      // Generic database error
      return new DatabaseError('operation', undefined, error);
    }

    // Unknown error
    return new DatabaseError('unknown operation', undefined, new Error(String(error)));
  }

  /**
   * Check if error should be logged as critical
   */
  static isCritical(error: AppError): boolean {
    return error.statusCode >= 500;
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError): string {
    // Return generic messages for security-sensitive errors
    if (error.statusCode >= 500) {
      return 'An internal error occurred. Please try again later.';
    }
    
    return error.message;
  }
}

/**
 * Common error response creators
 */
export class ErrorResponse {
  static validation(errors: ErrorDetails[]): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERRORS',
        message: `Validation failed with ${errors.length} error(s)`,
        context: { errors }
      },
      timestamp: new Date().toISOString(),
    };
  }

  static notFound(resource: string, id?: string): ApiErrorResponse {
    const error = new ResourceNotFoundError(resource, id);
    return error.toApiResponse();
  }

  static unauthorized(): ApiErrorResponse {
    const error = new UnauthorizedError();
    return error.toApiResponse();
  }

  static forbidden(resource?: string, action?: string): ApiErrorResponse {
    const error = new ForbiddenError(resource, action);
    return error.toApiResponse();
  }

  static internalError(): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred. Please try again later.',
      },
      timestamp: new Date().toISOString(),
    };
  }
}