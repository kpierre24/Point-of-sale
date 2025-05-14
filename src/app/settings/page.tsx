// src/app/settings/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-md">
          Configure application settings and preferences.
        </p>
      </header>
      
      <Card>
        <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage basic application configurations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" placeholder="Your Store Name" defaultValue="Point of Sale Pro" disabled />
            </div>
            <div className="space-y-2">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input id="taxRate" type="number" placeholder="10" defaultValue="10" disabled />
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="darkMode" disabled />
                <Label htmlFor="darkMode">Enable Dark Mode (Coming Soon)</Label>
            </div>
             <Button disabled>Save Settings</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
            <CardTitle>Feature Under Development</CardTitle>
            <CardDescription>More settings options will be available here in the future, including receipt customization, payment gateway integrations, and more.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            This section is currently a placeholder.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
