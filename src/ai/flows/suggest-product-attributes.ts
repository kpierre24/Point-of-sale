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
import type { ProductAttributeSuggestion } from '@/types'; // Using the one from global types

// Define the input schema
const SuggestProductAttributesInputSchema = z.object({
  productName: z.string().describe('The name of the product for which attributes are to be suggested.'),
  existingCategory: z.string().optional().describe('An optional existing category for context.'),
});
export type SuggestProductAttributesInput = z.infer<typeof SuggestProductAttributesInputSchema>;

// Define the output schema (matches ProductAttributeSuggestion in types/index.ts)
const SuggestProductAttributesOutputSchema = z.object({
  description: z.string().describe('A concise and appealing product description.'),
  category: z.string().describe('A suitable category for the product.'),
});
export type SuggestProductAttributesOutput = z.infer<typeof SuggestProductAttributesOutputSchema>;

// Exported function to trigger the flow
export async function suggestProductAttributes(input: SuggestProductAttributesInput): Promise<ProductAttributeSuggestion> {
  // Basic stub implementation for now
  // In a real scenario, this would call the Genkit flow.
  // For now, we return a placeholder or a very simple heuristic.
  if (input.productName.toLowerCase().includes("apple")) {
    return {
      description: `Fresh and juicy ${input.productName}. Perfect for a healthy snack or baking.`,
      category: input.existingCategory || "Fruits",
    };
  }
  if (input.productName.toLowerCase().includes("shirt")) {
     return {
      description: `Comfortable and stylish ${input.productName}. Made from high-quality fabric.`,
      category: input.existingCategory || "Apparel",
    };
  }
  return {
    description: `High-quality ${input.productName}.`,
    category: input.existingCategory || "General",
  };
  // return suggestProductAttributesFlow(input); // Uncomment when flow is fully implemented
}

// Define the prompt (example, actual prompt needs refinement)
const productAttributesPrompt = ai.definePrompt({
  name: 'productAttributesPrompt',
  input: {schema: SuggestProductAttributesInputSchema},
  output: {schema: SuggestProductAttributesOutputSchema},
  prompt: `Given the product name: {{{productName}}}{{#if existingCategory}} and existing category: {{{existingCategory}}}{{/if}},
  suggest an appealing product description and a suitable category.

  Product Name: {{{productName}}}
  {{#if existingCategory}}Current Category (for context): {{{existingCategory}}}{{/if}}

  Generate a product description and a category.
  Description should be 1-2 sentences.
  Category should be a single relevant term.
  `,
});

// Define the flow (stubbed)
const suggestProductAttributesFlow = ai.defineFlow(
  {
    name: 'suggestProductAttributesFlow',
    inputSchema: SuggestProductAttributesInputSchema,
    outputSchema: SuggestProductAttributesOutputSchema,
  },
  async (input) => {
    // This is a stub. Replace with actual AI call.
    // const {output} = await productAttributesPrompt(input);
    // return output!;
    
    // For now, returning placeholder based on input.
    // This part would involve an actual LLM call in a full implementation.
    let description = `A high-quality ${input.productName}.`;
    let category = input.existingCategory || "General";

    if (input.productName.toLowerCase().includes("organic")) {
        description = `Premium organic ${input.productName}, sourced responsibly.`;
        if (!input.existingCategory) category = "Organic Products";
    } else if (input.productName.toLowerCase().includes("handmade")) {
        description = `Beautifully handmade ${input.productName}, crafted with care.`;
        if (!input.existingCategory) category = "Handmade";
    }
    
    return {
      description: description,
      category: category,
    };
  }
);
