// User types
export interface User {
  id: string;
  email: string;
  name: string;
}

// Enhanced Convex-based types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  videos: string[];
  stock: number;
  customization_options: CustomizationOption[];
}

export interface CustomizationOption {
  area: string;
  type: string;
  options: string[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  address: Address;
}

export interface Address {
  billing: AddressDetails;
  shipping: AddressDetails;
}

export interface AddressDetails {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  customer_id: string;
  items: OrderItem[];
  status: OrderStatus;
  total_price: number;
  shipping_info: AddressDetails;
  created_at: number;
  updated_at: number;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  personalization?: Personalization;
}

export interface Personalization {
  area: string;
  text: string;
  font?: string;
  color?: string;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface GiftBox {
  id: string;
  items: string[]; // product IDs
  totalPrice: number;
  personalizationMessage: string;
  created_at: number;
}

export interface CorporateBillingInfo {
  id: string;
  customer_id: string;
  company_name: string;
  tax_id: string;
  billing_contact: BillingContact;
}

export interface BillingContact {
  name: string;
  email: string;
}

// Database operation result types
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  deletedId: string;
}

// Performance monitoring types
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  status: 'success' | 'error';
}