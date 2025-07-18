// src/ai/flows/ask-assistant-flow.ts
'use server';
/**
 * @fileOverview A conversational AI assistant flow for answering business questions.
 *
 * - askAssistant - A function that handles the conversational process.
 * - AskAssistantInput - The input type for the askAssistant function.
 * - AskAssistantOutput - The return type for the askAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  getProductStock,
  getTodaysSales,
  getLowStockProducts,
} from './tools';

// Define the input schema
const AskAssistantInputSchema = z.object({
  query: z.string().describe('The user\'s question about the business.'),
});
export type AskAssistantInput = z.infer<typeof AskAssistantInputSchema>;

// Define the output schema
const AskAssistantOutputSchema = z.object({
  answer: z.string().describe('The AI\'s answer to the user\'s question.'),
});
export type AskAssistantOutput = z.infer<typeof AskAssistantOutputSchema>;

// Define the prompt with tools
const assistantPrompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: AskAssistantInputSchema },
  output: { schema: AskAssistantOutputSchema },
  tools: [getProductStock, getTodaysSales, getLowStockProducts],
  system: `You are a helpful business assistant for a Point of Sale application.
  Your goal is to answer the user's questions about their business by using the provided tools.
  Be friendly, concise, and helpful in your responses.
  If you don't have a tool to answer the question, say so politely.
  When reporting sales figures, always format them as currency (e.g., $123.45).
  When asked about stock, if a specific location isn't mentioned, assume you should check all locations or provide a summary.
  `,
  prompt: `Answer the following question: {{{query}}}`,
});

// Define the flow
const askAssistantFlow = ai.defineFlow(
  {
    name: 'askAssistantFlow',
    inputSchema: AskAssistantInputSchema,
    outputSchema: AskAssistantOutputSchema,
  },
  async (input) => {
    const llmResponse = await assistantPrompt.generate({
      input: { query: input.query },
    });
    
    const output = llmResponse.output();
    if (!output) {
      throw new Error("The AI model did not return a structured output.");
    }
    
    return { answer: output.answer };
  }
);


// Exported function to trigger the flow
export async function askAssistant(input: AskAssistantInput): Promise<AskAssistantOutput> {
  return askAssistantFlow(input);
}
