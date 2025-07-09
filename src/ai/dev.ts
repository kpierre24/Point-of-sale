import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-product-details.ts';
import '@/ai/flows/suggest-product-attributes.ts';
import '@/ai/flows/suggest-purchase-order-items.ts'; // Add new flow
