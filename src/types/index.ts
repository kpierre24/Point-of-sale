import type { PAYMENT_METHODS } from '@/config/constants';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  category?: string;
  imageUrl?: string; // Placeholder for product image
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Purchase {
  id: string;
  productId: string;
  productName?: string; // Denormalized for easy display
  quantity: number;
  costPerItem: number;
  totalCost: number;
  supplier?: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'cashier'; // Example roles
  // Add other user-specific fields like email, password hash (not in scope for localStorage)
}

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface SoldProduct {
  id: string;
  name: string; // Could be custom item or product name
  price: number; // Unit price at the time of sale
  quantity: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  timestamp: string; // ISO string for easy serialization and sorting
  productId?: string; // Link to Product if sold from inventory
  customerId?: string; // Link to Customer
  paymentMethod: PaymentMethod;
}

// Suggestion from AI for product name and price based on user input and sales history
export interface ProductSuggestion {
  productName: string;
  productPrice: number;
}

// Suggestion from AI for product description and category based on product name
export interface ProductAttributeSuggestion {
  description: string;
  category: string;
}
