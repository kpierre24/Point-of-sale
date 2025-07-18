import type { PAYMENT_METHODS } from '@/config/constants';

export interface Location {
  id: string;
  name: string;
  address?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number; // Selling price
  costOfGoodsSold?: number; // Cost to produce/acquire
  stockByLocation: Record<string, number>; // Replaces stockQuantity: { [locationId: string]: quantity }
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
  suggestionReason?: string; // AI Suggestion reason
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
  locationId: string; // Added for location tracking
}

export const USER_ROLES = ["Front Staff", "Manager", "Owner", "Administrator", "Catering"] as const;
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
export type DiscountType = 'percentage' | 'fixed' | 'none';

export interface Sale {
  id: string;
  name: string; 
  price: number; // Unit price
  quantity: number;
  subtotalBeforeDiscount: number; // price * quantity
  discountType?: DiscountType;
  discountValue?: number; // The percentage (e.g., 10) or fixed amount
  discountAmount?: number; // Calculated monetary value of the discount
  subtotal: number; // Subtotal after discount
  taxAmount: number;
  total: number;
  timestamp: string; 
  productId?: string; 
  locationId: string; // Added for location tracking
  costOfGoodsSoldAtTimeOfSale?: number; // Added for P&L
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
  id: string; // This is the Firestore document ID
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
  amount: number; // Positive for Top-Up/Creation, negative for Purchase
  balanceBefore: number;
  balanceAfter: number;
  staffMember?: string; // Name or ID of staff, optional
  notes?: string;
  paymentMethod?: PaymentMethod;
  locationId?: string;
}

// App Settings
export interface AppSettings {
  storeName: string;
  taxRate: string; // Stored as string, e.g., "10" for 10%
  receiptFooter: string;
  darkMode: boolean;
  storeAddress?: string;
  storePhone?: string;
  storeWebsite?: string;
}

// Chart Data Types
export interface DailySalesData {
  date: string;
  totalSales: number;
}

export interface ProductCategorySalesData {
  category: string;
  quantitySold: number;
}

export interface Reconciliation {
    id: string; // e.g., 'locationId-YYYY-MM-DD'
    date: string; // YYYY-MM-DD
    locationId: string;
    expectedCash: number;
    countedCash: number;
    variance: number;
    totalCashSales: number;
    totalCashTopUps: number;
    createdAt: string; // ISO timestamp
}
