
// src/app/migrate-data/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import type { Product, SoldProduct, Customer, User, BuiltProductRecipe, PurchaseOrder, TopUpCard, CardTransaction, AppSettings, Location } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, Database, Info, Server, Sparkles } from 'lucide-react';

const LOCAL_STORAGE_KEYS = {
  products: 'pos-products',
  sales: 'pos-sales',
  customers: 'pos-customers',
  users: 'pos-users',
  recipes: 'pos-recipes',
  purchaseOrders: 'pos-purchase-orders',
  topUpCards: 'pos-topup-cards',
  cardTransactions: 'pos-card-transactions',
  appSettings: 'pos-app-settings', // Single object, not an array
};

const FIRESTORE_COLLECTIONS = {
  products: 'products',
  sales: 'sales',
  customers: 'customers',
  users: 'users',
  recipes: 'recipes',
  purchaseOrders: 'purchaseOrders',
  topUpCards: 'topUpCards',
  cardTransactions: 'cardTransactions',
  appSettings: 'appSettings', // Collection name
};

const newProductsSeed: Omit<Product, 'id' | 'stockByLocation'>[] = [
  { name: "Fried Pie (Potato)", price: 12.00, category: "Bakery", costOfGoodsSold: 4.50 },
  { name: "Fried Pie (Beef)", price: 12.00, category: "Bakery", costOfGoodsSold: 5.00 },
  { name: "Cheese Twist", price: 10.00, category: "Bakery", costOfGoodsSold: 3.50 },
  { name: "Chicken Pot Pie", price: 20.00, category: "Meals", costOfGoodsSold: 8.00 },
  { name: "Spinach and Cheese Flaky Pie", price: 18.00, category: "Bakery", costOfGoodsSold: 7.00 },
  { name: "Jamaican Patty", price: 20.00, category: "Savory", costOfGoodsSold: 7.50 },
  { name: "Hotdog", price: 15.00, category: "Fast Food", costOfGoodsSold: 5.50 },
  { name: "Beef Burger", price: 25.00, category: "Fast Food", costOfGoodsSold: 10.00 },
  { name: "Chicken Burger", price: 25.00, category: "Fast Food", costOfGoodsSold: 9.50 },
  { name: "Pizza (Slice)", price: 15.00, category: "Fast Food", costOfGoodsSold: 5.00 },
  { name: "Pizza (Large)", price: 80.00, category: "Fast Food", costOfGoodsSold: 35.00 },
  { name: "Tuna Sandwich", price: 15.00, category: "Sandwiches", costOfGoodsSold: 6.00 },
  { name: "Chicken Sandwich", price: 15.00, category: "Sandwiches", costOfGoodsSold: 6.50 },
  { name: "Cheese Sandwich", price: 15.00, category: "Sandwiches", costOfGoodsSold: 5.50 },
];

type MigrationStatus = 'idle' | 'migrating' | 'success' | 'error' | 'no-data';
type SeedStatus = 'idle' | 'seeding' | 'success' | 'error';

interface MigrationItem {
  key: keyof typeof LOCAL_STORAGE_KEYS;
  name: string;
  status: MigrationStatus;
  count: number | null;
  error?: string;
}

export default function MigrateDataPage() {
  const { toast } = useToast();
  const [migrationItems, setMigrationItems] = useState<MigrationItem[]>([
    { key: 'products', name: 'Products', status: 'idle', count: null },
    { key: 'sales', name: 'Sales', status: 'idle', count: null },
    { key: 'customers', name: 'Customers', status: 'idle', count: null },
    { key: 'users', name: 'Users', status: 'idle', count: null },
    { key: 'recipes', name: 'Recipes', status: 'idle', count: null },
    { key: 'purchaseOrders', name: 'Purchase Orders', status: 'idle', count: null },
    { key: 'topUpCards', name: 'Top-Up Cards', status: 'idle', count: null },
    { key: 'cardTransactions', name: 'Card Transactions', status: 'idle', count: null },
    { key: 'appSettings', name: 'App Settings', status: 'idle', count: null },
  ]);
  const [seedStatus, setSeedStatus] = useState<SeedStatus>('idle');

  const updateItemStatus = (key: keyof typeof LOCAL_STORAGE_KEYS, status: MigrationStatus, count?: number | null, error?: string) => {
    setMigrationItems(prev =>
      prev.map(item => (item.key === key ? { ...item, status, count: count === undefined ? item.count : count, error } : item))
    );
  };

  const handleSeedProducts = async () => {
    if (!db) {
      toast({ title: 'Firestore Error', description: 'Firebase Firestore is not initialized.', variant: 'destructive' });
      return;
    }
    setSeedStatus('seeding');
    try {
      const batch = writeBatch(db);
      const productsCollection = collection(db, FIRESTORE_COLLECTIONS.products);
      
      const locationsSnapshot = await collection(db, 'locations').get();
      const locationIds = locationsSnapshot.docs.map(doc => doc.id);
      
      newProductsSeed.forEach(productData => {
        const newDocRef = doc(productsCollection); // Auto-generate ID
        
        const stockByLocation: Record<string, number> = {};
        if (locationIds.length > 0) {
            // Give a default stock of 10 to the first location found
            stockByLocation[locationIds[0]] = 10;
        }

        const newProduct: Product = {
            ...productData,
            id: newDocRef.id,
            stockByLocation: stockByLocation,
        };
        batch.set(newDocRef, newProduct);
      });

      await batch.commit();
      setSeedStatus('success');
      toast({ title: 'Products Seeded', description: `${newProductsSeed.length} new products have been added to Firestore.` });
    } catch (error: any) {
      setSeedStatus('error');
      console.error("Error seeding products:", error);
      toast({ title: 'Seeding Error', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
    }
  };

  const migrateData = async (itemKey: keyof typeof LOCAL_STORAGE_KEYS) => {
    if (!db) {
      toast({ title: 'Firestore Error', description: 'Firebase Firestore is not initialized.', variant: 'destructive' });
      updateItemStatus(itemKey, 'error', 0, 'Firestore not initialized.');
      return;
    }

    updateItemStatus(itemKey, 'migrating');
    const localStorageKey = LOCAL_STORAGE_KEYS[itemKey];
    const firestoreCollectionName = FIRESTORE_COLLECTIONS[itemKey];

    try {
      const localDataString = localStorage.getItem(localStorageKey);
      if (!localDataString) {
        toast({ title: 'No Data', description: `No data found in local storage for ${migrationItems.find(m=>m.key === itemKey)?.name}.`, variant: 'default' });
        updateItemStatus(itemKey, 'no-data', 0);
        return;
      }

      const data = JSON.parse(localDataString);

      if (itemKey === 'appSettings') {
        const appSettingsData = data as AppSettings;
        if (typeof appSettingsData !== 'object' || appSettingsData === null) {
          throw new Error('App Settings data is not a valid object.');
        }
        const settingsDocRef = doc(db, firestoreCollectionName, 'current');
        await setDoc(settingsDocRef, appSettingsData, { merge: true });
        toast({ title: 'Migration Success', description: 'App Settings migrated successfully.' });
        updateItemStatus(itemKey, 'success', 1);
      } else {
        const itemsArray = data as Array<any>;
        if (!Array.isArray(itemsArray)) {
          throw new Error('Data is not an array.');
        }
        if (itemsArray.length === 0) {
          toast({ title: 'No Data', description: `No items to migrate for ${migrationItems.find(m=>m.key === itemKey)?.name}.`, variant: 'default' });
          updateItemStatus(itemKey, 'no-data', 0);
          return;
        }

        const batch = writeBatch(db);
        itemsArray.forEach(item => {
          if (!item.id) {
             throw new Error(`Item in ${localStorageKey} is missing an ID. Cannot migrate reliably without one using setDoc(doc(db, collection, item.id)).`);
          }
          const itemDocRef = doc(db, firestoreCollectionName, item.id);
          batch.set(itemDocRef, item, { merge: true });
        });
        await batch.commit();
        toast({ title: 'Migration Success', description: `${itemsArray.length} ${migrationItems.find(m=>m.key === itemKey)?.name} migrated successfully.` });
        updateItemStatus(itemKey, 'success', itemsArray.length);
      }
    } catch (error: any) {
      console.error(`Error migrating ${localStorageKey}:`, error);
      const itemName = migrationItems.find(m=>m.key === itemKey)?.name || 'data';
      const errorMessage = error.message || `An unknown error occurred during migration of ${itemName}.`;
      toast({ title: 'Migration Error', description: `Failed to migrate ${itemName}: ${errorMessage}`, variant: 'destructive' });
      updateItemStatus(itemKey, 'error', 0, errorMessage);
    }
  };
  
  const migrateAll = async () => {
    for (const item of migrationItems) {
        if (item.status === 'idle' || item.status === 'error') {
            await migrateData(item.key);
        }
    }
     toast({ title: 'All Migrations Attempted', description: 'Check status for each item.', variant: 'default' });
  };

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Data Migration Utility</h1>
        <p className="text-muted-foreground text-md">
          Transfer data from Local Storage to Firebase Firestore. Use with caution.
        </p>
      </header>

      <Alert variant="destructive">
        <Info className="h-5 w-5" />
        <AlertTitle>Important Notice!</AlertTitle>
        <AlertDescription>
          This is a one-time utility. Ensure your Firebase project is correctly configured and security rules allow writes.
          This process may overwrite existing Firestore data if document IDs match.
          It's recommended to back up local storage data manually if it's critical.
          Remove this page after successful migration.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Seed New Products</CardTitle>
          <CardDescription>Click the button below to add a predefined list of new products to your Firestore database. This action is non-destructive and will not overwrite existing products.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeedProducts} disabled={seedStatus === 'seeding' || seedStatus === 'success'}>
            {seedStatus === 'seeding' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {seedStatus === 'success' ? 'Products Added!' : 'Add New Products to Firestore'}
            {seedStatus !== 'seeding' && <Sparkles className="ml-2 h-4 w-4" />}
          </Button>
          {seedStatus === 'error' && <p className="text-red-500 text-sm mt-2">An error occurred while seeding products. Please check the console.</p>}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Local Storage to Firestore Migration</CardTitle>
          <CardDescription>Click buttons to migrate data for each category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {migrationItems.map(item => (
            <Card key={item.key} className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                 <Database className="mr-3 h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Status: <span className={`font-medium ${
                      item.status === 'success' ? 'text-green-600' :
                      item.status === 'error' ? 'text-red-600' :
                      item.status === 'migrating' ? 'text-blue-600' :
                      item.status === 'no-data' ? 'text-yellow-600' : ''
                    }`}>
                      {item.status.toUpperCase()}
                      {item.status === 'success' && item.count !== null && ` (${item.count} migrated)`}
                      {item.status === 'no-data' && ` (0 found)`}
                    </span>
                  </p>
                  {item.status === 'error' && item.error && <p className="text-xs text-red-500">Error: {item.error}</p>}
                </div>
              </div>
              <Button
                onClick={() => migrateData(item.key)}
                disabled={item.status === 'migrating' || item.status === 'success'}
                variant={item.status === 'error' ? 'destructive' : 'outline'}
              >
                {item.status === 'migrating' ? 'Migrating...' : 
                 item.status === 'success' ? 'Done' :
                 item.status === 'no-data' ? 'No Data' :
                 item.status === 'error' ? 'Retry' :
                 'Migrate'}
                 {item.status !== 'migrating' && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </Card>
          ))}
           <div className="pt-4 border-t">
             <Button onClick={migrateAll} className="w-full" size="lg">
                <Server className="mr-2 h-5 w-5"/>
                Migrate All Pending/Errored
            </Button>
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Post-Migration Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <p>1. Verify data in your Firebase Firestore console for each collection.</p>
            <p>2. Test all application functionalities thoroughly to ensure they work with Firestore data.</p>
            <p>3. **Crucially:** Remove this migration page (`src/app/migrate-data/page.tsx`) and its link from the sidebar (`src/components/ClientLayoutWrapper.tsx`) from your project files.</p>
            <p>4. Review and tighten your Firestore Security Rules for production.</p>
        </CardContent>
      </Card>
    </div>
  );
}
