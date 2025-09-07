/**
 * Input sanitization utilities for user-generated content
 * Prevents XSS attacks and ensures data integrity
 */

export interface SanitizationOptions {
  maxLength?: number;
  allowedTags?: string[];
  stripHtml?: boolean;
  preserveLineBreaks?: boolean;
}

/**
 * Sanitize text content to prevent XSS attacks
 */
export function sanitizeText(
  input: string, 
  options: SanitizationOptions = {}
): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  const {
    maxLength = 1000,
    stripHtml = true,
    preserveLineBreaks = false
  } = options;

  let sanitized = input;

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Strip HTML if requested (default behavior)
  if (stripHtml) {
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '');
  }

  // Handle line breaks
  if (preserveLineBreaks) {
    sanitized = sanitized.replace(/\r\n|\r|\n/g, '\n');
  } else {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }

  return sanitized;
}

/**
 * Sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    throw new Error('Email must be a string');
  }

  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w@.-]/g, '');
}

/**
 * Sanitize phone numbers
 */
export function sanitizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') {
    throw new Error('Phone number must be a string');
  }

  return phone
    .trim()
    .replace(/[^\d+()-\s]/g, '')
    .substring(0, 20); // Max reasonable phone length
}

/**
 * Sanitize personalization text for products
 */
export function sanitizePersonalizationText(text: string): string {
  return sanitizeText(text, {
    maxLength: 100,
    stripHtml: true,
    preserveLineBreaks: false
  });
}

/**
 * Sanitize company/business names
 */
export function sanitizeBusinessName(name: string): string {
  return sanitizeText(name, {
    maxLength: 200,
    stripHtml: true,
    preserveLineBreaks: false
  });
}

/**
 * Sanitize address fields
 */
export function sanitizeAddressField(field: string): string {
  return sanitizeText(field, {
    maxLength: 100,
    stripHtml: true,
    preserveLineBreaks: false
  });
}

/**
 * Validate and sanitize tax ID
 */
export function sanitizeTaxId(taxId: string): string {
  if (typeof taxId !== 'string') {
    throw new Error('Tax ID must be a string');
  }

  return taxId
    .trim()
    .replace(/[^\w-]/g, '')
    .substring(0, 50);
}

/**
 * Comprehensive input sanitizer for database operations
 */
export class InputSanitizer {
  static product(data: any) {
    return {
      ...data,
      name: data.name ? sanitizeText(data.name, { maxLength: 200 }) : data.name,
      description: data.description ? sanitizeText(data.description, { maxLength: 2000, preserveLineBreaks: true }) : data.description,
    };
  }

  static customer(data: any) {
    return {
      ...data,
      name: data.name ? sanitizeText(data.name, { maxLength: 100 }) : data.name,
      email: data.email ? sanitizeEmail(data.email) : data.email,
      phone_number: data.phone_number ? sanitizePhoneNumber(data.phone_number) : data.phone_number,
      address: data.address ? {
        billing: data.address.billing ? {
          street: sanitizeAddressField(data.address.billing.street),
          city: sanitizeAddressField(data.address.billing.city),
          state: sanitizeAddressField(data.address.billing.state),
          zip: sanitizeAddressField(data.address.billing.zip),
          country: sanitizeAddressField(data.address.billing.country),
        } : data.address.billing,
        shipping: data.address.shipping ? {
          street: sanitizeAddressField(data.address.shipping.street),
          city: sanitizeAddressField(data.address.shipping.city),
          state: sanitizeAddressField(data.address.shipping.state),
          zip: sanitizeAddressField(data.address.shipping.zip),
          country: sanitizeAddressField(data.address.shipping.country),
        } : data.address.shipping,
      } : data.address,
    };
  }

  static order(data: any) {
    return {
      ...data,
      items: data.items?.map((item: any) => ({
        ...item,
        personalization: item.personalization ? {
          ...item.personalization,
          text: sanitizePersonalizationText(item.personalization.text),
          font: item.personalization.font ? sanitizeText(item.personalization.font, { maxLength: 50 }) : item.personalization.font,
          color: item.personalization.color ? sanitizeText(item.personalization.color, { maxLength: 20 }) : item.personalization.color,
        } : item.personalization,
      })) || data.items,
      shipping_info: data.shipping_info ? {
        street: sanitizeAddressField(data.shipping_info.street),
        city: sanitizeAddressField(data.shipping_info.city),
        state: sanitizeAddressField(data.shipping_info.state),
        zip: sanitizeAddressField(data.shipping_info.zip),
        country: sanitizeAddressField(data.shipping_info.country),
      } : data.shipping_info,
    };
  }

  static giftBox(data: any) {
    return {
      ...data,
      personalizationMessage: data.personalizationMessage 
        ? sanitizeText(data.personalizationMessage, { maxLength: 500, preserveLineBreaks: true })
        : data.personalizationMessage,
    };
  }

  static corporateBilling(data: any) {
    return {
      ...data,
      company_name: data.company_name ? sanitizeBusinessName(data.company_name) : data.company_name,
      tax_id: data.tax_id ? sanitizeTaxId(data.tax_id) : data.tax_id,
      billing_contact: data.billing_contact ? {
        name: sanitizeText(data.billing_contact.name, { maxLength: 100 }),
        email: sanitizeEmail(data.billing_contact.email),
      } : data.billing_contact,
    };
  }
}