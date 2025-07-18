// src/ai/flows/tools.ts
/**
 * @fileOverview This file defines the tools that the AI assistant can use
 * to interact with the Firestore database and answer questions.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Product, Sale, Location } from '@/types';
import { format, startOfDay, endOfDay } from 'date-fns';

const PRODUCTS_COLLECTION = 'products';
const SALES_COLLECTION = 'sales';
const LOCATIONS_COLLECTION = 'locations';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};


export const getProductStock = ai.defineTool(
  {
    name: 'getProductStock',
    description: 'Get the current stock quantity for a specific product, optionally filtered by location.',
    inputSchema: z.object({
      productName: z.string().describe('The name of the product to check stock for.'),
      locationName: z.string().optional().describe('The name of the location to check stock at. If not provided, checks all locations.'),
    }),
    outputSchema: z.object({
      stockInfo: z.string().describe('A summary of the stock level for the product.'),
    }),
  },
  async ({ productName, locationName }) => {
    if (!db) return { stockInfo: "Database is not available." };
    
    const locationsSnapshot = await getDocs(collection(db, LOCATIONS_COLLECTION));
    const locations: Location[] = locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));

    const productQuery = query(collection(db, PRODUCTS_COLLECTION), where("name", "==", productName));
    const productSnapshot = await getDocs(productQuery);

    if (productSnapshot.empty) {
      return { stockInfo: `Product "${productName}" not found.` };
    }
    const product = productSnapshot.docs[0].data() as Product;

    if (locationName) {
      const location = locations.find(l => l.name.toLowerCase() === locationName.toLowerCase());
      if (!location) {
        return { stockInfo: `Location "${locationName}" not found.` };
      }
      const stock = product.stockByLocation?.[location.id] || 0;
      return { stockInfo: `There are ${stock} units of ${productName} at the ${locationName} location.` };
    } else {
      const totalStock = Object.values(product.stockByLocation || {}).reduce((sum, qty) => sum + qty, 0);
      const stockByLocationStr = locations
        .map(loc => `${loc.name}: ${product.stockByLocation?.[loc.id] || 0}`)
        .join(', ');
      return { stockInfo: `There is a total of ${totalStock} units of ${productName}. Stock by location: ${stockByLocationStr}.` };
    }
  }
);


export const getTodaysSales = ai.defineTool(
  {
    name: 'getTodaysSales',
    description: "Get the total sales revenue and transaction count for today.",
    inputSchema: z.object({}),
    outputSchema: z.object({
      salesSummary: z.string().describe('A summary of today\'s sales.'),
    }),
  },
  async () => {
    if (!db) return { salesSummary: "Database is not available." };
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const salesQuery = query(
        collection(db, SALES_COLLECTION), 
        where("timestamp", ">=", start.toISOString()),
        where("timestamp", "<=", end.toISOString())
    );
    const salesSnapshot = await getDocs(salesQuery);

    if (salesSnapshot.empty) {
        return { salesSummary: "There have been no sales yet today." };
    }

    const sales = salesSnapshot.docs.map(doc => doc.data() as Sale);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const transactionCount = sales.length;
    
    return { salesSummary: `Today's sales total is ${formatCurrency(totalRevenue)} from ${transactionCount} transactions.` };
  }
);

export const getLowStockProducts = ai.defineTool(
    {
      name: 'getLowStockProducts',
      description: 'Get a list of products that are low in stock, defined as having fewer than 10 units at any single location.',
      inputSchema: z.object({}),
      outputSchema: z.object({
        lowStockSummary: z.string().describe('A summary of products with low stock levels.'),
      }),
    },
    async () => {
      if (!db) return { lowStockSummary: "Database is not available." };
      
      const productsSnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
      const products = productsSnapshot.docs.map(doc => doc.data() as Product);
      
      const locationsSnapshot = await getDocs(collection(db, LOCATIONS_COLLECTION));
      const locations = locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));

      const lowStockProducts: { name: string, location: string, stock: number }[] = [];

      products.forEach(product => {
        if (product.stockByLocation) {
          for (const locationId in product.stockByLocation) {
            if (product.stockByLocation[locationId] < 10) {
              const locationName = locations.find(l => l.id === locationId)?.name || 'Unknown Location';
              lowStockProducts.push({ name: product.name, location: locationName, stock: product.stockByLocation[locationId] });
            }
          }
        }
      });
  
      if (lowStockProducts.length === 0) {
        return { lowStockSummary: 'All products are well-stocked. No items are currently below the low stock threshold of 10 units.' };
      }
  
      const summaryString = lowStockProducts
        .map(p => `${p.name} at ${p.location} (only ${p.stock} left)`)
        .join('; ');
  
      return { lowStockSummary: `The following products are running low: ${summaryString}.` };
    }
  );
