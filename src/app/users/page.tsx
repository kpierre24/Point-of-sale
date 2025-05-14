// src/app/users/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCog } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground text-md">
            Manage staff accounts and permissions.
            </p>
        </div>
        <Button disabled> {/* Feature not yet implemented */}
          <UserCog className="mr-2 h-4 w-4" />
          Add Staff User
        </Button>
      </header>
      
      <Card>
        <CardHeader>
            <CardTitle>Feature Under Development</CardTitle>
            <CardDescription>Staff user management is currently under development. This section will allow administrators to add and manage staff accounts.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            Future capabilities will include:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Creating new staff user accounts.</li>
                <li>Assigning roles and permissions (e.g., Admin, Cashier).</li>
                <li>Editing user details.</li>
                <li>Deactivating or deleting user accounts.</li>
            </ul>
            <p className="text-muted-foreground mt-4">
            For now, user authentication and distinct user roles are not implemented. All actions are performed as a single operator.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
