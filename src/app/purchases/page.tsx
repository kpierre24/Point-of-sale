// src/app/purchases/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function PurchasesPage() {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
            <p className="text-muted-foreground text-md">
            Manage your inventory purchases and suppliers.
            </p>
        </div>
        <Button disabled> {/* Feature not yet implemented */}
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Purchase Order
        </Button>
      </header>
      
      <Card>
        <CardHeader>
            <CardTitle>Feature Under Development</CardTitle>
            <CardDescription>This section is currently being built. Check back soon for updates on managing your purchase orders and inventory replenishment.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            Soon, you'll be able to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Record new stock purchases from suppliers.</li>
                <li>Track purchase order history.</li>
                <li>Manage supplier information.</li>
                <li>Automatically update product stock levels upon receiving goods.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
