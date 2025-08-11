/**
 * User-friendly error message system
 * Converts technical errors into clear, actionable messages for business users
 */

export interface ErrorContext {
  action?: string;
  resource?: string;
  details?: string;
  code?: string;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  suggestion?: string;
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * Common error types in business applications
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  PERMISSION: 'PERMISSION',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  SERVER: 'SERVER',
  TIMEOUT: 'TIMEOUT',
  STORAGE: 'STORAGE',
  PAYMENT: 'PAYMENT',
  INVENTORY: 'INVENTORY',
} as const;

export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];

/**
 * Maps technical error codes to user-friendly messages
 */
const ERROR_MESSAGE_MAP: Record<string, (context?: ErrorContext) => UserFriendlyError> = {
  // Network Errors
  'NETWORK_ERROR': (context) => ({
    title: 'Connection Problem',
    message: 'Unable to connect to the server. Please check your internet connection.',
    suggestion: 'Try refreshing the page or check your network connection.',
  }),
  
  'TIMEOUT_ERROR': (context) => ({
    title: 'Request Timed Out',
    message: 'The request is taking longer than expected.',
    suggestion: 'Please try again. If the problem persists, contact support.',
  }),

  // Validation Errors
  'VALIDATION_ERROR': (context) => ({
    title: 'Invalid Information',
    message: context?.details || 'Please check the information you entered.',
    suggestion: 'Review the highlighted fields and correct any errors.',
  }),

  'REQUIRED_FIELD': (context) => ({
    title: 'Missing Information',
    message: `${context?.resource || 'This field'} is required.`,
    suggestion: 'Please fill in all required fields before continuing.',
  }),

  // Permission Errors
  'PERMISSION_DENIED': (context) => ({
    title: 'Access Denied',
    message: `You don't have permission to ${context?.action || 'perform this action'}.`,
    suggestion: 'Contact your manager or system administrator for access.',
  }),

  'UNAUTHORIZED': (context) => ({
    title: 'Please Sign In',
    message: 'Your session has expired or you need to sign in.',
    suggestion: 'Please sign in again to continue.',
  }),

  // Resource Errors
  'NOT_FOUND': (context) => ({
    title: `${context?.resource || 'Item'} Not Found`,
    message: `The ${context?.resource?.toLowerCase() || 'item'} you're looking for doesn't exist.`,
    suggestion: 'Please check the information and try again.',
  }),

  'ALREADY_EXISTS': (context) => ({
    title: `${context?.resource || 'Item'} Already Exists`,
    message: `A ${context?.resource?.toLowerCase() || 'item'} with this information already exists.`,
    suggestion: 'Please use different information or update the existing item.',
  }),

  // Server Errors
  'SERVER_ERROR': (context) => ({
    title: 'System Error',
    message: 'Something went wrong on our end.',
    suggestion: 'Please try again in a few moments. If the problem continues, contact support.',
  }),

  'MAINTENANCE': (context) => ({
    title: 'System Maintenance',
    message: 'The system is currently undergoing maintenance.',
    suggestion: 'Please try again later. We apologize for the inconvenience.',
  }),

  // Business-Specific Errors
  'INSUFFICIENT_STOCK': (context) => ({
    title: 'Not Enough Stock',
    message: `Only ${context?.details || '0'} items available in stock.`,
    suggestion: 'Please reduce the quantity or check with inventory management.',
  }),

  'PAYMENT_FAILED': (context) => ({
    title: 'Payment Failed',
    message: context?.details || 'The payment could not be processed.',
    suggestion: 'Please check payment details and try again, or use a different payment method.',
  }),

  'INSUFFICIENT_BALANCE': (context) => ({
    title: 'Insufficient Balance',
    message: `The card balance is not enough for this transaction.`,
    suggestion: 'Please use a different payment method or add funds to the card.',
  }),

  'CARD_NOT_FOUND': (context) => ({
    title: 'Card Not Found',
    message: `No card found with ID ${context?.details || 'provided'}.`,
    suggestion: 'Please check the card ID and try again, or scan the QR code.',
  }),

  // Data Storage Errors
  'SAVE_FAILED': (context) => ({
    title: 'Save Failed',
    message: `Could not save ${context?.resource?.toLowerCase() || 'the information'}.`,
    suggestion: 'Please try again. If the problem persists, contact support.',
  }),

  'DELETE_FAILED': (context) => ({
    title: 'Delete Failed',
    message: `Could not delete ${context?.resource?.toLowerCase() || 'the item'}.`,
    suggestion: 'Please try again. The item may be in use elsewhere.',
  }),

  'LOAD_FAILED': (context) => ({
    title: 'Loading Failed',
    message: `Could not load ${context?.resource?.toLowerCase() || 'the information'}.`,
    suggestion: 'Please refresh the page or try again later.',
  }),
};

/**
 * Converts a technical error into a user-friendly message
 */
export function createUserFriendlyError(
  errorCode: string,
  context?: ErrorContext
): UserFriendlyError {
  const errorFactory = ERROR_MESSAGE_MAP[errorCode];
  
  if (errorFactory) {
    return errorFactory(context);
  }

  // Fallback for unknown errors
  return {
    title: 'Unexpected Error',
    message: context?.details || 'Something unexpected happened.',
    suggestion: 'Please try again or contact support if the problem continues.',
  };
}

/**
 * Common error patterns for business operations
 */
export const BUSINESS_ERRORS = {
  // Sales Operations
  SALE_VALIDATION: (field: string) => createUserFriendlyError('VALIDATION_ERROR', {
    resource: field,
    details: `Please enter a valid ${field.toLowerCase()}.`
  }),

  INSUFFICIENT_STOCK: (available: number, requested: number, product: string) => 
    createUserFriendlyError('INSUFFICIENT_STOCK', {
      resource: product,
      details: `${available} of ${requested} requested`
    }),

  PAYMENT_CARD_ERROR: (cardId: string) => createUserFriendlyError('CARD_NOT_FOUND', {
    details: cardId
  }),

  INSUFFICIENT_CARD_BALANCE: (balance: number, required: number) => 
    createUserFriendlyError('INSUFFICIENT_BALANCE', {
      details: `Balance: $${balance.toFixed(2)}, Required: $${required.toFixed(2)}`
    }),

  // Product Management
  PRODUCT_NOT_FOUND: (productName: string) => createUserFriendlyError('NOT_FOUND', {
    resource: 'Product',
    details: productName
  }),

  PRODUCT_SAVE_ERROR: () => createUserFriendlyError('SAVE_FAILED', {
    resource: 'Product'
  }),

  // General Operations
  NETWORK_CONNECTION: () => createUserFriendlyError('NETWORK_ERROR'),
  
  PERMISSION_ERROR: (action: string) => createUserFriendlyError('PERMISSION_DENIED', {
    action
  }),

  FORM_VALIDATION: (message: string) => createUserFriendlyError('VALIDATION_ERROR', {
    details: message
  }),
} as const;

/**
 * Utility function to extract error information from various error types
 */
export function extractErrorInfo(error: unknown): { code: string; message: string; details?: string } {
  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('fetch')) {
      return { code: 'NETWORK_ERROR', message: error.message };
    }
    if (error.message.includes('timeout')) {
      return { code: 'TIMEOUT_ERROR', message: error.message };
    }
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return { code: 'PERMISSION_DENIED', message: error.message };
    }
    
    return { code: 'SERVER_ERROR', message: error.message };
  }

  if (typeof error === 'string') {
    return { code: 'SERVER_ERROR', message: error };
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    return {
      code: errorObj.code || 'SERVER_ERROR',
      message: errorObj.message || 'Unknown error',
      details: errorObj.details
    };
  }

  return { code: 'SERVER_ERROR', message: 'An unexpected error occurred' };
}
