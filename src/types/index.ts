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
  address?: string;
}

// Renamed from Purchase to PurchaseOrderItem as it represents an item in a PurchaseOrder
export interface PurchaseOrderItem {
  id: string; // Unique ID for the line item itself, if needed for React keys or direct manipulation
  productId: string; 
  productName: string; // Denormalized product name at the time of purchase
  quantity: number;
  costPerItem: number;
  totalCost: number; // quantity * costPerItem
}

export interface PurchaseOrder {
  id: string; // Unique ID for the purchase order
  supplierName: string; // For simplicity, not a full Supplier object yet
  orderDate: string; // ISO string
  receivedDate?: string; // ISO string, set when status becomes 'Received'
  status: 'Pending' | 'Received' | 'Cancelled';
  items: PurchaseOrderItem[];
  grandTotal: number; // Sum of totalCost for all items
  notes?: string;
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

// Represents a recipe or build configuration for a product
export interface BuiltProductRecipe {
  id: string;
  name: string; // Name of the recipe, e.g., "Deluxe Burger Recipe"
  
  // Simplified costs for this iteration
  totalIngredientsCost: number;
  totalLabourCost: number;
  totalPackagingCost: number;
  
  totalCalculatedCost: number; // Will be sum of the above three, calculated automatically
  
  notes?: string;
  outputProductName?: string; // Suggested name for the final product if different from recipe name
  outputProductDescription?: string; // Suggested description for the final product
}

