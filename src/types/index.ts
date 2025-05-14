import type { PAYMENT_METHODS } from '@/config/constants';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number; // Selling price
  costOfGoodsSold?: number; // Cost to produce/acquire
  stockQuantity: number;
  category?: string;
  imageUrl?: string; // Placeholder for product image
  recipeId?: string; // Optional link to a BuiltProductRecipe
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string; // Full address as a string for simplicity
}

export interface PurchaseOrderItem {
  id: string; 
  productId: string; 
  productName: string; 
  quantity: number;
  costPerItem: number;
  totalCost: number; 
}

export interface PurchaseOrder {
  id: string; 
  supplierName: string; 
  orderDate: string; 
  receivedDate?: string; 
  status: 'Pending' | 'Received' | 'Cancelled';
  items: PurchaseOrderItem[];
  grandTotal: number; 
  notes?: string;
}

export const USER_ROLES = ['Admin', 'Manager', 'Cashier', 'Staff'] as const;
export type UserRole = typeof USER_ROLES[number];

// Represents the custom user profile stored in Firestore
export interface User {
  id: string; // This will be the Firebase Auth UID
  name: string;
  email: string; // Firebase Auth email
  role: UserRole;
  isActive: boolean;
  pin?: string; // 6-digit PIN for login, optional
  // Password is not stored here; Firebase Auth handles it securely.
}

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface SoldProduct {
  id: string;
  name: string; 
  price: number; 
  quantity: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  timestamp: string; 
  productId?: string; 
  customerId?: string; 
  paymentMethod: PaymentMethod;
  staffId?: string; // ID of the staff member (Firebase UID)
  staffName?: string; // Name of the staff member (optional, for convenience)
}

export interface ProductSuggestion {
  productName: string;
  productPrice: number;
}

export interface ProductAttributeSuggestion {
  description: string;
  category: string;
}

export interface BuiltProductRecipe {
  id: string;
  name: string; 
  
  totalIngredientsCost: number;
  totalLabourCost: number;
  totalPackagingCost: number;
  
  totalCalculatedCost: number; 
  
  notes?: string;
  outputProductName?: string; 
  outputProductDescription?: string; 
}
