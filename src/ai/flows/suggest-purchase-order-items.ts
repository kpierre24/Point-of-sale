// src/ai/flows/suggest-purchase-order-items.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting items to include
 * in a purchase order based on current stock levels and recent sales history.
 *
 * - suggestPurchaseOrderItems - A function that triggers the suggestion flow.
 * - SuggestPurchaseOrderItemsInput - The input type for the flow.
 * - SuggestPurchaseOrderItemsOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define a representation of a product for the input
const ProductInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  stockQuantity: z.number(),
  costOfGoodsSold: z.number().optional(),
});

// Define a representation of a sale for the input
const SaleInfoSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  timestamp: z.string(),
});

// Define the input schema for the flow
const SuggestPurchaseOrderItemsInputSchema = z.object({
  products: z.array(ProductInfoSchema).describe('The list of all available products with their current stock levels.'),
  salesHistory: z.array(SaleInfoSchema).describe('A list of recent sales transactions.'),
  // supplier: z.string().optional().describe('Optional: Name of the supplier to filter suggestions.'),
});
export type SuggestPurchaseOrderItemsInput = z.infer<typeof SuggestPurchaseOrderItemsInputSchema>;

// Define the schema for a single suggested item in the output
const SuggestedItemSchema = z.object({
  productId: z.string().describe('The ID of the suggested product to reorder.'),
  quantity: z.number().describe('The suggested quantity to reorder.'),
  costPerItem: z.number().optional().describe('The last known cost per item for this product.'),
  suggestionReason: z.string().describe('A brief reason for the suggestion (e.g., "Low stock" or "High sales velocity").'),
});

// Define the output schema for the flow
const SuggestPurchaseOrderItemsOutputSchema = z.object({
  suggestedItems: z.array(SuggestedItemSchema).describe('A list of suggested items for the purchase order.'),
});
export type SuggestPurchaseOrderItemsOutput = z.infer<typeof SuggestPurchaseOrderItemsOutputSchema>;

// Exported function to trigger the flow
export async function suggestPurchaseOrderItems(input: SuggestPurchaseOrderItemsInput): Promise<SuggestPurchaseOrderItemsOutput> {
  return suggestPurchaseOrderItemsFlow(input);
}

// Define the prompt
const suggestPurchaseOrderItemsPrompt = ai.definePrompt({
  name: 'suggestPurchaseOrderItemsPrompt',
  input: {schema: SuggestPurchaseOrderItemsInputSchema},
  output: {schema: SuggestPurchaseOrderItemsOutputSchema},
  prompt: `You are an expert inventory manager for a retail store.
Your task is to analyze the current product inventory and recent sales history to suggest items for a new purchase order.

Here is the data you will use:

**Current Product Inventory:**
{{#each products}}
- Product: "{{name}}" (ID: {{id}}), Current Stock: {{stockQuantity}}, Last Cost: {{#if costOfGoodsSold}}{{costOfGoodsSold}}{{else}}N/A{{/if}}
{{/each}}

**Recent Sales History (last 30 days):**
{{#each salesHistory}}
- Sold {{quantity}} of Product ID {{productId}} on {{timestamp}}
{{/each}}

**Your Goal:**
Identify products that should be reordered. Prioritize items that are low in stock or have high sales velocity.
A product is considered "low stock" if its quantity is below 10.
A product has "high sales velocity" if more than 20 units have been sold in the last month.

For each product you suggest reordering, provide the product ID, a recommended reorder quantity, and a brief reason for the suggestion.
- The reorder quantity should typically aim to bring stock levels up to a 30-day supply based on recent sales, but be reasonable (e.g., suggest reordering in multiples of 10 or 12).
- Use the last known cost if available.
- If a product has zero sales and low stock, it might not need reordering unless it's a new product. Use your judgment.
- Do not suggest more than 10 products to reorder at a time to keep the purchase order manageable.

Generate a list of suggested items.
`,
});

// Define the flow
const suggestPurchaseOrderItemsFlow = ai.defineFlow(
  {
    name: 'suggestPurchaseOrderItemsFlow',
    inputSchema: SuggestPurchaseOrderItemsInputSchema,
    outputSchema: SuggestPurchaseOrderItemsOutputSchema,
  },
  async (input) => {
    // Call the defined prompt with the input
    const {output} = await suggestPurchaseOrderItemsPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return an output for purchase order suggestions.");
    }
    return output;
  }
);
