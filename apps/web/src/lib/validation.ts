/**
 * Enhanced validation library for robust data validation
 * Provides comprehensive validation with detailed error messages and error codes
 */

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class ValidationException extends Error {
  public readonly errors: ValidationError[];
  public readonly code: string;

  constructor(errors: ValidationError[], message?: string) {
    super(message || `Validation failed with ${errors.length} error(s)`);
    this.name = 'ValidationException';
    this.errors = errors;
    this.code = 'VALIDATION_ERROR';
  }
}

/**
 * Enhanced validation utilities
 */
export class Validator {
  private errors: ValidationError[] = [];

  /**
   * Add validation error
   */
  private addError(field: string, code: string, message: string, value?: any): void {
    this.errors.push({ field, code, message, value });
  }

  /**
   * Reset validation state
   */
  reset(): void {
    this.errors = [];
  }

  /**
   * Get validation result
   */
  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors]
    };
  }

  /**
   * Throw if validation failed
   */
  throwIfInvalid(): void {
    if (this.errors.length > 0) {
      throw new ValidationException(this.errors);
    }
  }

  /**
   * Enhanced price validation
   */
  validatePrice(value: any, field: string = 'price'): this {
    if (value === null || value === undefined) {
      this.addError(field, 'PRICE_REQUIRED', 'Price is required');
      return this;
    }

    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      this.addError(field, 'PRICE_INVALID_TYPE', 'Price must be a valid number', value);
      return this;
    }

    if (value <= 0) {
      this.addError(field, 'PRICE_TOO_LOW', 'Price must be greater than 0', value);
      return this;
    }

    if (value > 999999.99) {
      this.addError(field, 'PRICE_TOO_HIGH', 'Price exceeds maximum allowed value of $999,999.99', value);
      return this;
    }

    // Check for reasonable decimal precision (max 2 decimal places)
    if (Math.round(value * 100) !== value * 100) {
      this.addError(field, 'PRICE_INVALID_PRECISION', 'Price cannot have more than 2 decimal places', value);
    }

    return this;
  }

  /**
   * Enhanced stock validation
   */
  validateStock(value: any, field: string = 'stock'): this {
    if (value === null || value === undefined) {
      this.addError(field, 'STOCK_REQUIRED', 'Stock quantity is required');
      return this;
    }

    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      this.addError(field, 'STOCK_INVALID_TYPE', 'Stock must be a valid number', value);
      return this;
    }

    if (value < 0) {
      this.addError(field, 'STOCK_NEGATIVE', 'Stock cannot be negative', value);
      return this;
    }

    if (!Number.isInteger(value)) {
      this.addError(field, 'STOCK_NOT_INTEGER', 'Stock must be a whole number', value);
    }

    if (value > 1000000) {
      this.addError(field, 'STOCK_TOO_HIGH', 'Stock quantity exceeds maximum allowed value', value);
    }

    return this;
  }

  /**
   * Enhanced email validation
   */
  validateEmail(value: any, field: string = 'email'): this {
    if (!value) {
      this.addError(field, 'EMAIL_REQUIRED', 'Email address is required');
      return this;
    }

    if (typeof value !== 'string') {
      this.addError(field, 'EMAIL_INVALID_TYPE', 'Email must be a string', value);
      return this;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      this.addError(field, 'EMAIL_EMPTY', 'Email address cannot be empty');
      return this;
    }

    if (trimmed.length > 254) {
      this.addError(field, 'EMAIL_TOO_LONG', 'Email address is too long (max 254 characters)', trimmed.length);
      return this;
    }

    // Enhanced email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(trimmed)) {
      this.addError(field, 'EMAIL_INVALID_FORMAT', 'Email address format is invalid', trimmed);
    }

    return this;
  }

  /**
   * Enhanced phone number validation
   */
  validatePhoneNumber(value: any, field: string = 'phone_number'): this {
    if (!value) {
      this.addError(field, 'PHONE_REQUIRED', 'Phone number is required');
      return this;
    }

    if (typeof value !== 'string') {
      this.addError(field, 'PHONE_INVALID_TYPE', 'Phone number must be a string', value);
      return this;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      this.addError(field, 'PHONE_EMPTY', 'Phone number cannot be empty');
      return this;
    }

    // Allow international formats: +1-555-123-4567, (555) 123-4567, etc.
    const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{10,20}$/;
    if (!phoneRegex.test(trimmed)) {
      this.addError(field, 'PHONE_INVALID_FORMAT', 'Phone number format is invalid', trimmed);
    }

    return this;
  }

  /**
   * String validation with length constraints
   */
  validateString(value: any, field: string, options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  } = {}): this {
    const { required = true, minLength = 0, maxLength = 1000, pattern } = options;

    if (!value && required) {
      this.addError(field, 'STRING_REQUIRED', `${field} is required`);
      return this;
    }

    if (!value && !required) {
      return this; // Optional field that's not provided
    }

    if (typeof value !== 'string') {
      this.addError(field, 'STRING_INVALID_TYPE', `${field} must be a string`, value);
      return this;
    }

    const trimmed = value.trim();

    if (required && trimmed.length === 0) {
      this.addError(field, 'STRING_EMPTY', `${field} cannot be empty`);
      return this;
    }

    if (trimmed.length < minLength) {
      this.addError(field, 'STRING_TOO_SHORT', `${field} must be at least ${minLength} characters long`, trimmed.length);
    }

    if (trimmed.length > maxLength) {
      this.addError(field, 'STRING_TOO_LONG', `${field} must not exceed ${maxLength} characters`, trimmed.length);
    }

    if (pattern && !pattern.test(trimmed)) {
      this.addError(field, 'STRING_INVALID_PATTERN', `${field} format is invalid`, trimmed);
    }

    return this;
  }

  /**
   * Quantity validation
   */
  validateQuantity(value: any, field: string = 'quantity'): this {
    if (value === null || value === undefined) {
      this.addError(field, 'QUANTITY_REQUIRED', 'Quantity is required');
      return this;
    }

    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      this.addError(field, 'QUANTITY_INVALID_TYPE', 'Quantity must be a valid number', value);
      return this;
    }

    if (value <= 0) {
      this.addError(field, 'QUANTITY_TOO_LOW', 'Quantity must be greater than 0', value);
      return this;
    }

    if (!Number.isInteger(value)) {
      this.addError(field, 'QUANTITY_NOT_INTEGER', 'Quantity must be a whole number', value);
    }

    if (value > 1000) {
      this.addError(field, 'QUANTITY_TOO_HIGH', 'Quantity exceeds maximum allowed value of 1000', value);
    }

    return this;
  }

  /**
   * Array validation
   */
  validateArray(value: any, field: string, options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  } = {}): this {
    const { required = true, minLength = 0, maxLength = 1000 } = options;

    if (!value && required) {
      this.addError(field, 'ARRAY_REQUIRED', `${field} is required`);
      return this;
    }

    if (!value && !required) {
      return this; // Optional field
    }

    if (!Array.isArray(value)) {
      this.addError(field, 'ARRAY_INVALID_TYPE', `${field} must be an array`, value);
      return this;
    }

    if (value.length < minLength) {
      this.addError(field, 'ARRAY_TOO_SHORT', `${field} must have at least ${minLength} item(s)`, value.length);
    }

    if (value.length > maxLength) {
      this.addError(field, 'ARRAY_TOO_LONG', `${field} must not have more than ${maxLength} item(s)`, value.length);
    }

    return this;
  }
}

/**
 * Domain-specific validation functions
 */
export class DomainValidator {
  /**
   * Validate product data
   */
  static validateProduct(data: any): ValidationResult {
    const validator = new Validator();

    validator
      .validateString(data.name, 'name', { minLength: 1, maxLength: 200 })
      .validateString(data.description, 'description', { minLength: 1, maxLength: 2000 })
      .validatePrice(data.price)
      .validateStock(data.stock)
      .validateArray(data.images, 'images', { required: false })
      .validateArray(data.videos, 'videos', { required: false })
      .validateArray(data.customization_options, 'customization_options', { required: false });

    return validator.getResult();
  }

  /**
   * Validate customer data
   */
  static validateCustomer(data: any): ValidationResult {
    const validator = new Validator();

    validator
      .validateString(data.name, 'name', { minLength: 1, maxLength: 100 })
      .validateEmail(data.email)
      .validatePhoneNumber(data.phone_number);

    // Validate address structure
    if (data.address) {
      ['billing', 'shipping'].forEach(addressType => {
        const address = data.address[addressType];
        if (address) {
          validator
            .validateString(address.street, `address.${addressType}.street`, { maxLength: 100 })
            .validateString(address.city, `address.${addressType}.city`, { maxLength: 50 })
            .validateString(address.state, `address.${addressType}.state`, { maxLength: 50 })
            .validateString(address.zip, `address.${addressType}.zip`, { maxLength: 20 })
            .validateString(address.country, `address.${addressType}.country`, { maxLength: 2, minLength: 2 });
        }
      });
    }

    return validator.getResult();
  }

  /**
   * Validate order data
   */
  static validateOrder(data: any): ValidationResult {
    const validator = new Validator();

    validator
      .validateArray(data.items, 'items', { minLength: 1, maxLength: 100 })
      .validatePrice(data.total_price, 'total_price');

    // Validate order items
    if (Array.isArray(data.items)) {
      data.items.forEach((item: any, index: number) => {
        validator.validateQuantity(item.quantity, `items[${index}].quantity`);
        
        if (item.personalization) {
          validator.validateString(
            item.personalization.text, 
            `items[${index}].personalization.text`, 
            { maxLength: 100 }
          );
        }
      });
    }

    // Validate shipping info
    if (data.shipping_info) {
      validator
        .validateString(data.shipping_info.street, 'shipping_info.street', { maxLength: 100 })
        .validateString(data.shipping_info.city, 'shipping_info.city', { maxLength: 50 })
        .validateString(data.shipping_info.state, 'shipping_info.state', { maxLength: 50 })
        .validateString(data.shipping_info.zip, 'shipping_info.zip', { maxLength: 20 })
        .validateString(data.shipping_info.country, 'shipping_info.country', { maxLength: 2, minLength: 2 });
    }

    return validator.getResult();
  }
}