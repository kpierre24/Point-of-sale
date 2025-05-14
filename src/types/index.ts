export interface SoldProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  timestamp: string; // ISO string for easy serialization and sorting
}

export interface ProductSuggestion {
  productName: string;
  productPrice: number;
}
