export const TAX_RATE = 0.10; // 10% tax rate
export const APP_TITLE = "Point of Sale Pro";

export const PAYMENT_METHODS = ["Cash", "Card", "Online Transfer", "Other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// DUMMY_CURRENT_USER_ID_FOR_SALES removed as real authentication will provide user context.
