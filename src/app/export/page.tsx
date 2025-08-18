// src/app/export/page.tsx
"use client";

import { useState } from 'react';
import type { Product, Sale, Customer, User, BuiltProductRecipe, PurchaseOrder, TopUpCard, CardTransaction, AppSettings, Location } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { Download, HardDriveDownload, Loader2 } from 'lucide-react';

const COLLECTIONS = {
  products: 'products',
  sales: 'sales',
  customers: 'customers',
  users: 'users',
  recipes: 'recipes',
  purchaseOrders: 'purchaseOrders',
  topUpCards: 'topUpCards',
  cardTransactions: 'cardTransactions',
  appSettings: 'appSettings',
  locations: 'locations',
};

// Generic fetcher
const fetchCollection = async <T>(collectionName: string): Promise<T[]> => {
  if (!db) throw new Error("Firestore not available");
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

const escapeSql = (str: string | number | boolean | null | undefined): string => {
    if (str === null || str === undefined || str === '') return 'NULL';
    if (typeof str === 'number') return str.toString();
    if (typeof str === 'boolean') return str ? '1' : '0';
    // Simple escape: replace single quotes with two single quotes and wrap in quotes
    return `'${String(str).replace(/'/g, "''")}'`;
};

const generateFullDatabaseSql = (data: { [key: string]: any[] }): string => {
    let sql = `-- Full Database Export\n`;
    sql += `-- Generated on: ${new Date().toISOString()}\n\n`;

    // Locations
    sql += `DROP TABLE IF EXISTS locations;\n`;
    sql += `CREATE TABLE locations (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), address TEXT);\n`;
    (data.locations as Location[]).forEach(l => {
        sql += `INSERT INTO locations (id, name, address) VALUES (${escapeSql(l.id)}, ${escapeSql(l.name)}, ${escapeSql(l.address)});\n`;
    });
    sql += `\n`;

    // Products and Stock
    sql += `DROP TABLE IF EXISTS products;\n`;
    sql += `CREATE TABLE products (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description TEXT, price DECIMAL(10,2), costOfGoodsSold DECIMAL(10,2), category VARCHAR(255), imageUrl TEXT, recipeId VARCHAR(255));\n`;
    sql += `DROP TABLE IF EXISTS product_stock;\n`;
    sql += `CREATE TABLE product_stock (product_id VARCHAR(255), location_id VARCHAR(255), quantity INT, PRIMARY KEY (product_id, location_id));\n`;
    (data.products as Product[]).forEach(p => {
        sql += `INSERT INTO products (id, name, description, price, costOfGoodsSold, category, imageUrl, recipeId) VALUES (${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.description)}, ${p.price || 0}, ${escapeSql(p.costOfGoodsSold)}, ${escapeSql(p.category)}, ${escapeSql(p.imageUrl)}, ${escapeSql(p.recipeId)});\n`;
        if (p.stockByLocation) {
            Object.entries(p.stockByLocation).forEach(([locationId, quantity]) => {
                sql += `INSERT INTO product_stock (product_id, location_id, quantity) VALUES (${escapeSql(p.id)}, ${escapeSql(locationId)}, ${quantity || 0});\n`;
            });
        }
    });
    sql += `\n`;

    // Customers
    sql += `DROP TABLE IF EXISTS customers;\n`;
    sql += `CREATE TABLE customers (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), phone VARCHAR(255), address TEXT, createdAt VARCHAR(255));\n`;
    (data.customers as Customer[]).forEach(c => {
        sql += `INSERT INTO customers (id, name, email, phone, address, createdAt) VALUES (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.email)}, ${escapeSql(c.phone)}, ${escapeSql(c.address)}, ${escapeSql(c.createdAt)});\n`;
    });
    sql += `\n`;
    
    // Sales
    sql += `DROP TABLE IF EXISTS sales;\n`;
    sql += `CREATE TABLE sales (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), price DECIMAL(10,2), quantity INT, subtotalBeforeDiscount DECIMAL(10,2), discountType VARCHAR(255), discountValue DECIMAL(10,2), discountAmount DECIMAL(10,2), subtotal DECIMAL(10,2), taxAmount DECIMAL(10,2), total DECIMAL(10,2), timestamp VARCHAR(255), productId VARCHAR(255), locationId VARCHAR(255), costOfGoodsSoldAtTimeOfSale DECIMAL(10,2), customerId VARCHAR(255), paymentMethod VARCHAR(255), staffId VARCHAR(255), staffName VARCHAR(255), cardIdUsed VARCHAR(255));\n`;
    (data.sales as Sale[]).forEach(s => {
        sql += `INSERT INTO sales VALUES (${escapeSql(s.id)}, ${escapeSql(s.name)}, ${escapeSql(s.price)}, ${escapeSql(s.quantity)}, ${escapeSql(s.subtotalBeforeDiscount)}, ${escapeSql(s.discountType)}, ${escapeSql(s.discountValue)}, ${escapeSql(s.discountAmount)}, ${escapeSql(s.subtotal)}, ${escapeSql(s.taxAmount)}, ${escapeSql(s.total)}, ${escapeSql(s.timestamp)}, ${escapeSql(s.productId)}, ${escapeSql(s.locationId)}, ${escapeSql(s.costOfGoodsSoldAtTimeOfSale)}, ${escapeSql(s.customerId)}, ${escapeSql(s.paymentMethod)}, ${escapeSql(s.staffId)}, ${escapeSql(s.staffName)}, ${escapeSql(s.cardIdUsed)});\n`;
    });
    sql += `\n`;

    // Users
    sql += `DROP TABLE IF EXISTS users;\n`;
    sql += `CREATE TABLE users (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), role VARCHAR(255), isActive BOOLEAN, pin VARCHAR(255));\n`;
    (data.users as User[]).forEach(u => {
        sql += `INSERT INTO users (id, name, email, role, isActive, pin) VALUES (${escapeSql(u.id)}, ${escapeSql(u.name)}, ${escapeSql(u.email)}, ${escapeSql(u.role)}, ${escapeSql(u.isActive)}, ${escapeSql(u.pin)});\n`;
    });
    sql += `\n`;

    // Recipes
    sql += `DROP TABLE IF EXISTS recipes;\n`;
    sql += `CREATE TABLE recipes (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), notes TEXT, outputProductName VARCHAR(255), outputProductDescription TEXT, totalIngredientsCost DECIMAL(10,2), totalLabourCost DECIMAL(10,2), totalPackagingCost DECIMAL(10,2), totalCalculatedCost DECIMAL(10,2));\n`;
    (data.recipes as BuiltProductRecipe[]).forEach(r => {
        sql += `INSERT INTO recipes VALUES (${escapeSql(r.id)}, ${escapeSql(r.name)}, ${escapeSql(r.notes)}, ${escapeSql(r.outputProductName)}, ${escapeSql(r.outputProductDescription)}, ${escapeSql(r.totalIngredientsCost)}, ${escapeSql(r.totalLabourCost)}, ${escapeSql(r.totalPackagingCost)}, ${escapeSql(r.totalCalculatedCost)});\n`;
    });
    sql += `\n`;
    
    // Purchase Orders
    sql += `DROP TABLE IF EXISTS purchase_orders;\n`;
    sql += `CREATE TABLE purchase_orders (id VARCHAR(255) PRIMARY KEY, supplierName VARCHAR(255), orderDate VARCHAR(255), receivedDate VARCHAR(255), status VARCHAR(255), grandTotal DECIMAL(10,2), notes TEXT, locationId VARCHAR(255));\n`;
    sql += `DROP TABLE IF EXISTS purchase_order_items;\n`;
    sql += `CREATE TABLE purchase_order_items (id VARCHAR(255) PRIMARY KEY, order_id VARCHAR(255), productId VARCHAR(255), productName VARCHAR(255), quantity INT, costPerItem DECIMAL(10,2), totalCost DECIMAL(10,2));\n`;
    (data.purchaseOrders as PurchaseOrder[]).forEach(po => {
        sql += `INSERT INTO purchase_orders (id, supplierName, orderDate, receivedDate, status, grandTotal, notes, locationId) VALUES (${escapeSql(po.id)}, ${escapeSql(po.supplierName)}, ${escapeSql(po.orderDate)}, ${escapeSql(po.receivedDate)}, ${escapeSql(po.status)}, ${escapeSql(po.grandTotal)}, ${escapeSql(po.notes)}, ${escapeSql(po.locationId)});\n`;
        po.items.forEach(item => {
             sql += `INSERT INTO purchase_order_items (id, order_id, productId, productName, quantity, costPerItem, totalCost) VALUES (${escapeSql(item.id)}, ${escapeSql(po.id)}, ${escapeSql(item.productId)}, ${escapeSql(item.productName)}, ${escapeSql(item.quantity)}, ${escapeSql(item.costPerItem)}, ${escapeSql(item.totalCost)});\n`;
        });
    });
    sql += `\n`;

    // Top-Up Cards & Transactions
    sql += `DROP TABLE IF EXISTS top_up_cards;\n`;
    sql += `CREATE TABLE top_up_cards (id VARCHAR(255) PRIMARY KEY, cardId VARCHAR(255) UNIQUE, customerId VARCHAR(255), currentBalance DECIMAL(10,2), qrCodeValue TEXT, createdAt VARCHAR(255), lastUpdatedAt VARCHAR(255));\n`;
    (data.topUpCards as TopUpCard[]).forEach(c => {
        sql += `INSERT INTO top_up_cards VALUES (${escapeSql(c.id)}, ${escapeSql(c.cardId)}, ${escapeSql(c.customerId)}, ${escapeSql(c.currentBalance)}, ${escapeSql(c.qrCodeValue)}, ${escapeSql(c.createdAt)}, ${escapeSql(c.lastUpdatedAt)});\n`;
    });
    sql += `\n`;
    sql += `DROP TABLE IF EXISTS card_transactions;\n`;
    sql += `CREATE TABLE card_transactions (id VARCHAR(255) PRIMARY KEY, cardId VARCHAR(255), timestamp VARCHAR(255), type VARCHAR(255), amount DECIMAL(10,2), balanceBefore DECIMAL(10,2), balanceAfter DECIMAL(10,2), staffMember VARCHAR(255), notes TEXT, paymentMethod VARCHAR(255), locationId VARCHAR(255));\n`;
    (data.cardTransactions as CardTransaction[]).forEach(tx => {
        sql += `INSERT INTO card_transactions VALUES (${escapeSql(tx.id)}, ${escapeSql(tx.cardId)}, ${escapeSql(tx.timestamp)}, ${escapeSql(tx.type)}, ${escapeSql(tx.amount)}, ${escapeSql(tx.balanceBefore)}, ${escapeSql(tx.balanceAfter)}, ${escapeSql(tx.staffMember)}, ${escapeSql(tx.notes)}, ${escapeSql(tx.paymentMethod)}, ${escapeSql(tx.locationId)});\n`;
    });
    sql += `\n`;

    // App Settings
    sql += `DROP TABLE IF EXISTS app_settings;\n`;
    sql += `CREATE TABLE app_settings (id VARCHAR(255) PRIMARY KEY, storeName VARCHAR(255), taxRate VARCHAR(255), receiptFooter TEXT, darkMode BOOLEAN, storeAddress TEXT, storePhone VARCHAR(255), storeWebsite VARCHAR(255));\n`;
    (data.appSettings as AppSettings[]).forEach(s => {
        sql += `INSERT INTO app_settings VALUES ('current', ${escapeSql(s.storeName)}, ${escapeSql(s.taxRate)}, ${escapeSql(s.receiptFooter)}, ${escapeSql(s.darkMode)}, ${escapeSql(s.storeAddress)}, ${escapeSql(s.storePhone)}, ${escapeSql(s.storeWebsite)});\n`;
    });
    sql += `\n`;

    return sql;
};


export default function ExportPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({ queryKey: [COLLECTIONS.products], queryFn: () => fetchCollection<Product>(COLLECTIONS.products) });
  const { data: sales = [], isLoading: isLoadingSales } = useQuery({ queryKey: [COLLECTIONS.sales], queryFn: () => fetchCollection<Sale>(COLLECTIONS.sales) });
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({ queryKey: [COLLECTIONS.customers], queryFn: () => fetchCollection<Customer>(COLLECTIONS.customers) });
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({ queryKey: [COLLECTIONS.users], queryFn: () => fetchCollection<User>(COLLECTIONS.users) });
  const { data: recipes = [], isLoading: isLoadingRecipes } = useQuery({ queryKey: [COLLECTIONS.recipes], queryFn: () => fetchCollection<BuiltProductRecipe>(COLLECTIONS.recipes) });
  const { data: purchaseOrders = [], isLoading: isLoadingPOs } = useQuery({ queryKey: [COLLECTIONS.purchaseOrders], queryFn: () => fetchCollection<PurchaseOrder>(COLLECTIONS.purchaseOrders) });
  const { data: topUpCards = [], isLoading: isLoadingTopUpCards } = useQuery({ queryKey: [COLLECTIONS.topUpCards], queryFn: () => fetchCollection<TopUpCard>(COLLECTIONS.topUpCards) });
  const { data: cardTransactions = [], isLoading: isLoadingCardTxns } = useQuery({ queryKey: [COLLECTIONS.cardTransactions], queryFn: () => fetchCollection<CardTransaction>(COLLECTIONS.cardTransactions) });
  const { data: appSettings = [], isLoading: isLoadingAppSettings } = useQuery({ queryKey: [COLLECTIONS.appSettings], queryFn: () => fetchCollection<AppSettings>(COLLECTIONS.appSettings) });
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({ queryKey: [COLLECTIONS.locations], queryFn: () => fetchCollection<Location>(COLLECTIONS.locations) });

  const isLoading = isLoadingProducts || isLoadingSales || isLoadingCustomers || isLoadingUsers || isLoadingRecipes || isLoadingPOs || isLoadingTopUpCards || isLoadingCardTxns || isLoadingAppSettings || isLoadingLocations;

  const handleExportAllSql = () => {
    setIsGenerating(true);
    try {
      const allData = { products, sales, customers, users, recipes, purchaseOrders, topUpCards, cardTransactions, appSettings, locations };
      const sqlContent = generateFullDatabaseSql(allData);
      const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `full_database_export_${new Date().toISOString().split('T')[0]}.sql`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: "Export Successful", description: "Full database SQL file has been downloaded." });
    } catch (error: any) {
      toast({ title: "Export Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <HardDriveDownload className="mr-3 h-8 w-8 text-primary" />
          Data Export
        </h1>
        <p className="text-muted-foreground text-md">
          Generate and download your store data in various formats.
        </p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Export Full Database to SQL</CardTitle>
          <CardDescription>
            This will generate a single SQL file with all data from your Firestore database, including tables and insert statements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportAllSql} disabled={isLoading || isGenerating}>
            {isLoading || isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Loading All Data...' : isGenerating ? 'Generating...' : 'Export Full Database'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
