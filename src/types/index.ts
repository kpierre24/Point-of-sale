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

// Represents the custom user profile stored locally
export interface User {
  id: string; // UUID
  name: string;
  email: string; 
  role: UserRole;
  isActive: boolean;
  pin?: string; // 6-digit PIN, optional
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
  staffId?: string; // Optional: ID of the staff member
  staffName?: string; // Optional: Name of the staff member
  cardIdUsed?: string; // ID of the top-up card used for payment
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

// Types for Top-Up Card Feature
export interface TopUpCard {
  id: string; // Internal UUID for React keys, NOT the cardId for QR
  cardId: string; // User-facing, unique, human-readable ID for QR code
  customerId?: string; // Optional link to existing Customer
  currentBalance: number;
  qrCodeValue: string; // This will just be the cardId
  createdAt: string; // ISO Date string
  lastUpdatedAt: string; // ISO Date string
}

export interface CardTransaction {
  id: string; // UUID for the transaction itself
  cardId: string; // Links to TopUpCard.cardId (the user-facing ID)
  timestamp: string; // ISO Date string
  type: 'Creation' | 'Top-Up' | 'Purchase' | 'Adjustment';
  amount: number; // Positive for Top-Up/Creation, can be negative for Purchase/Adjustment if needed for flexibility, but UI will enforce positive for deduct
  balanceBefore: number;
  balanceAfter: number;
  staffMember?: string; // Name or ID of staff, optional
  notes?: string;
}
