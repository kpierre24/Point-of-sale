// src/app/customers/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
            <p className="text-muted-foreground text-md">
            View, add, and manage your customer database.
            </p>
        </div>
        <Button disabled> {/* Feature not yet implemented */}
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </header>
      
      <Card>
        <CardHeader>
            <CardTitle>Feature Under Development</CardTitle>
            <CardDescription>This section is currently being built. Soon you will be able to manage your customer information here.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            Planned features include:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Adding new customers with details like name, email, phone, and address.</li>
                <li>Viewing a list of all customers.</li>
                <li>Editing existing customer information.</li>
                <li>Viewing customer purchase history.</li>
                <li>Searching and filtering customers.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
