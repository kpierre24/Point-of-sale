// src/app/export/page.tsx
"use client";

import { useState } from 'react';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { Download, HardDriveDownload, Loader2 } from 'lucide-react';

const PRODUCTS_COLLECTION = 'products';

const fetchProducts = async (): Promise<Product[]> => {
  if (!db) throw new Error("Firestore not available");
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

const generateProductSql = (products: Product[]): string => {
  if (products.length === 0) return "-- No products to export.";

  const escapeSql = (str: string | null | undefined): string => {
    if (str === null || str === undefined) return 'NULL';
    // Simple escape: replace single quotes with two single quotes
    return `'${str.replace(/'/g, "''")}'`;
  };
  
  const now = new Date().toISOString();
  
  let sql = `-- SQL Product Export\n`;
  sql += `-- Generated on: ${now}\n`;
  sql += `-- Total Products: ${products.length}\n\n`;

  sql += `DROP TABLE IF EXISTS products;\n`;
  sql += `CREATE TABLE products (\n`;
  sql += `  id VARCHAR(255) PRIMARY KEY,\n`;
  sql += `  name VARCHAR(255) NOT NULL,\n`;
  sql += `  description TEXT,\n`;
  sql += `  price DECIMAL(10, 2) NOT NULL,\n`;
  sql += `  costOfGoodsSold DECIMAL(10, 2),\n`;
  sql += `  category VARCHAR(255),\n`;
  sql += `  imageUrl TEXT,\n`;
  sql += `  recipeId VARCHAR(255)\n`;
  sql += `);\n\n`;
  
  sql += `DROP TABLE IF EXISTS product_stock;\n`;
  sql += `CREATE TABLE product_stock (\n`;
  sql += `  product_id VARCHAR(255) NOT NULL,\n`;
  sql += `  location_id VARCHAR(255) NOT NULL,\n`;
  sql += `  quantity INT NOT NULL,\n`;
  sql += `  PRIMARY KEY (product_id, location_id),\n`;
  sql += `  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE\n`;
  sql += `);\n\n`;

  sql += `-- Inserting Products\n`;
  products.forEach(p => {
    sql += `INSERT INTO products (id, name, description, price, costOfGoodsSold, category, imageUrl, recipeId) VALUES (${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.description)}, ${p.price || 0}, ${p.costOfGoodsSold || 'NULL'}, ${escapeSql(p.category)}, ${escapeSql(p.imageUrl)}, ${escapeSql(p.recipeId)});\n`;
    
    if (p.stockByLocation) {
        Object.entries(p.stockByLocation).forEach(([locationId, quantity]) => {
            sql += `INSERT INTO product_stock (product_id, location_id, quantity) VALUES (${escapeSql(p.id)}, ${escapeSql(locationId)}, ${quantity || 0});\n`;
        });
    }
  });

  return sql;
};


export default function ExportPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[], Error>({
    queryKey: [PRODUCTS_COLLECTION],
    queryFn: fetchProducts,
    enabled: !!db,
  });

  const handleExportProductsSql = () => {
    if (!products) {
      toast({ title: "No Data", description: "Product data is not loaded yet.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    
    try {
      const sqlContent = generateProductSql(products);
      const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.sql`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: "Export Successful", description: "Product SQL file has been downloaded." });
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
          <CardTitle>Export Products to SQL</CardTitle>
          <CardDescription>
            This will generate a SQL file with CREATE TABLE statements and INSERT commands for all your products and their stock levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportProductsSql} disabled={isLoadingProducts || isGenerating}>
            {isLoadingProducts || isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isLoadingProducts ? 'Loading Products...' : isGenerating ? 'Generating...' : `Export ${products?.length || 0} Products`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
