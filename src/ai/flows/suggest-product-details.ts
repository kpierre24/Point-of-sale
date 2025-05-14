// Use server directive.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting product details
 * (name, price) based on user input and past sales history.
 *
 * - suggestProductDetails - A function that triggers the product suggestion flow.
 * - SuggestProductDetailsInput - The input type for the suggestProductDetails function.
 * - SuggestProductDetailsOutput - The return type for the suggestProductDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const SuggestProductDetailsInputSchema = z.object({
  userInput: z.string().describe('The user input, which could be a partial product name or description.'),
  salesHistory: z.string().describe('A string containing the sales history, including product names and prices.'),
});
export type SuggestProductDetailsInput = z.infer<typeof SuggestProductDetailsInputSchema>;

// Define the output schema
const SuggestProductDetailsOutputSchema = z.object({
  productName: z.string().describe('The suggested product name.'),
  productPrice: z.number().describe('The suggested product price.'),
});
export type SuggestProductDetailsOutput = z.infer<typeof SuggestProductDetailsOutputSchema>;

// Exported function to trigger the flow
export async function suggestProductDetails(input: SuggestProductDetailsInput): Promise<SuggestProductDetailsOutput> {
  return suggestProductDetailsFlow(input);
}

// Define the prompt
const suggestProductDetailsPrompt = ai.definePrompt({
  name: 'suggestProductDetailsPrompt',
  input: {schema: SuggestProductDetailsInputSchema},
  output: {schema: SuggestProductDetailsOutputSchema},
  prompt: `Based on the user input and the sales history, suggest the product name and price.

Sales History: {{{salesHistory}}}

User Input: {{{userInput}}}

Suggest product details:
`,
});

// Define the flow
const suggestProductDetailsFlow = ai.defineFlow(
  {
    name: 'suggestProductDetailsFlow',
    inputSchema: SuggestProductDetailsInputSchema,
    outputSchema: SuggestProductDetailsOutputSchema,
  },
  async input => {
    const {output} = await suggestProductDetailsPrompt(input);
    return output!;
  }
);
