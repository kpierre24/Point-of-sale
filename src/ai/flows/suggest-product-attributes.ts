// src/ai/flows/suggest-product-attributes.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting product attributes
 * (description, category) based on a product name.
 *
 * - suggestProductAttributes - A function that triggers the product attribute suggestion flow.
 * - SuggestProductAttributesInput - The input type for the suggestProductAttributes function.
 * - SuggestProductAttributesOutput - The return type for the suggestProductAttributes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// ProductAttributeSuggestion is already defined as SuggestProductAttributesOutput in this file.
// If it were meant to be imported from '@/types', the import would be:
// import type { ProductAttributeSuggestion } from '@/types';

// Define the input schema
const SuggestProductAttributesInputSchema = z.object({
  productName: z.string().describe('The name of the product for which attributes are to be suggested.'),
  existingCategory: z.string().optional().describe('An optional existing category for context.'),
});
export type SuggestProductAttributesInput = z.infer<typeof SuggestProductAttributesInputSchema>;

// Define the output schema
const SuggestProductAttributesOutputSchema = z.object({
  description: z.string().describe('A concise and appealing product description (1-2 sentences).'),
  category: z.string().describe('A single, relevant category term for the product.'),
});
export type SuggestProductAttributesOutput = z.infer<typeof SuggestProductAttributesOutputSchema>;

// Exported function to trigger the flow
export async function suggestProductAttributes(input: SuggestProductAttributesInput): Promise<SuggestProductAttributesOutput> {
  // Now actually calls the Genkit flow.
  return suggestProductAttributesFlow(input);
}

// Define the prompt
const productAttributesPrompt = ai.definePrompt({
  name: 'productAttributesPrompt',
  input: {schema: SuggestProductAttributesInputSchema},
  output: {schema: SuggestProductAttributesOutputSchema},
  prompt: `Given the product name: {{{productName}}}{{#if existingCategory}} and existing category (for context): {{{existingCategory}}}{{/if}},
  suggest an appealing product description and a suitable category.

  Product Name: {{{productName}}}
  {{#if existingCategory}}Current Category (for context): {{{existingCategory}}}{{/if}}

  Generate a product description and a category.
  Description should be 1-2 sentences.
  Category should be a single relevant term.
  `,
});

// Define the flow
const suggestProductAttributesFlow = ai.defineFlow(
  {
    name: 'suggestProductAttributesFlow',
    inputSchema: SuggestProductAttributesInputSchema,
    outputSchema: SuggestProductAttributesOutputSchema,
  },
  async (input) => {
    // Call the defined prompt with the input
    const {output} = await productAttributesPrompt(input);
    // Ensure output is not null or undefined before returning
    if (!output) {
      throw new Error("The AI model did not return an output for product attribute suggestions.");
    }
    return output;
  }
);
