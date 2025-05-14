export const TAX_RATE = 0.10; // 10% tax rate
export const APP_TITLE = "Point of Sale Pro";

export const PAYMENT_METHODS = ["Cash", "Card", "Online Transfer", "Other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Placeholder for current user context in sales, similar to users/page.tsx DUMMY_CURRENT_USER_ID
// In a real app, this would come from an authentication system.
export const DUMMY_CURRENT_USER_ID_FOR_SALES = "default-admin-id"; 
