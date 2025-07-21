// src/components/ui/low-stock-alert.tsx
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Product } from "@/types";
import { CompactStockIndicator } from "./stock-indicator";
import { CategoryBadge } from "./category-badge";
import { ProductImage } from "./product-image";
import Link from "next/link";

interface LowStockItem {
  product: Product;
  stockLevel: number;
  locationName?: string;
}

interface LowStockAlertProps {
  products: Product[];
  selectedLocationId?: string | null;
  locations?: Array<{ id: string; name: string }>;
  lowStockThreshold?: number;
  outOfStockThreshold?: number;
  className?: string;
}

export function LowStockAlert({
  products,
  selectedLocationId,
  locations = [],
  lowStockThreshold = 10,
  outOfStockThreshold = 0,
  className,
}: LowStockAlertProps) {
  const getLowStockItems = (): LowStockItem[] => {
    const lowStockItems: LowStockItem[] = [];

    products.forEach(product => {
      if (selectedLocationId) {
        // Check stock for specific location
        const stockLevel = product.stockByLocation?.[selectedLocationId] || 0;
        if (stockLevel <= lowStockThreshold && stockLevel > outOfStockThreshold) {
          const location = locations.find(l => l.id === selectedLocationId);
          lowStockItems.push({
            product,
            stockLevel,
            locationName: location?.name,
          });
        }
      } else {
        // Check total stock across all locations
        const totalStock = Object.values(product.stockByLocation || {}).reduce((sum, qty) => sum + qty, 0);
        if (totalStock <= lowStockThreshold && totalStock > outOfStockThreshold) {
          lowStockItems.push({
            product,
            stockLevel: totalStock,
          });
        }
      }
    });

    return lowStockItems.sort((a, b) => a.stockLevel - b.stockLevel);
  };

  const getOutOfStockItems = (): LowStockItem[] => {
    const outOfStockItems: LowStockItem[] = [];

    products.forEach(product => {
      if (selectedLocationId) {
        // Check stock for specific location
        const stockLevel = product.stockByLocation?.[selectedLocationId] || 0;
        if (stockLevel <= outOfStockThreshold) {
          const location = locations.find(l => l.id === selectedLocationId);
          outOfStockItems.push({
            product,
            stockLevel,
            locationName: location?.name,
          });
        }
      } else {
        // Check total stock across all locations
        const totalStock = Object.values(product.stockByLocation || {}).reduce((sum, qty) => sum + qty, 0);
        if (totalStock <= outOfStockThreshold) {
          outOfStockItems.push({
            product,
            stockLevel: totalStock,
          });
        }
      }
    });

    return outOfStockItems;
  };

  const lowStockItems = getLowStockItems();
  const outOfStockItems = getOutOfStockItems();

  if (lowStockItems.length === 0 && outOfStockItems.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Out of Stock Alert - High Priority */}
      {outOfStockItems.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="flex items-center justify-between">
            <span>Critical: {outOfStockItems.length} Product{outOfStockItems.length > 1 ? 's' : ''} Out of Stock</span>
            <Button asChild variant="outline" size="sm" className="ml-4">
              <Link href="/products">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Inventory
              </Link>
            </Button>
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {outOfStockItems.slice(0, 3).map(({ product, stockLevel, locationName }) => (
                <div key={product.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-md">
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.name}
                    size="sm"
                    showBorder={false}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-red-900">{product.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={product.category || ""} size="sm" showIcon={false} />
                      {locationName && (
                        <Badge variant="outline" className="text-xs">
                          {locationName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CompactStockIndicator
                    stockLevel={stockLevel}
                    lowStockThreshold={lowStockThreshold}
                    outOfStockThreshold={outOfStockThreshold}
                  />
                </div>
              ))}
              {outOfStockItems.length > 3 && (
                <div className="text-sm text-red-700 font-medium">
                  +{outOfStockItems.length - 3} more items out of stock
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Low Stock Warning */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span>Low Stock Warning</span>
                <Badge variant="secondary" className="bg-amber-200 text-amber-800">
                  {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}
                </Badge>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/products">
                  <Package className="mr-2 h-4 w-4" />
                  Restock
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {lowStockItems.map(({ product, stockLevel, locationName }) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-white rounded-md border border-amber-200">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      size="sm"
                      showBorder={false}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <CategoryBadge category={product.category || ""} size="sm" showIcon={false} />
                        {locationName && (
                          <Badge variant="outline" className="text-xs">
                            {locationName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CompactStockIndicator
                      stockLevel={stockLevel}
                      lowStockThreshold={lowStockThreshold}
                      outOfStockThreshold={outOfStockThreshold}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactLowStockAlert({
  products,
  selectedLocationId,
  locations = [],
  lowStockThreshold = 10,
  outOfStockThreshold = 0,
}: LowStockAlertProps) {
  const getLowStockCount = () => {
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(product => {
      if (selectedLocationId) {
        const stockLevel = product.stockByLocation?.[selectedLocationId] || 0;
        if (stockLevel <= outOfStockThreshold) {
          outOfStockCount++;
        } else if (stockLevel <= lowStockThreshold) {
          lowStockCount++;
        }
      } else {
        const totalStock = Object.values(product.stockByLocation || {}).reduce((sum, qty) => sum + qty, 0);
        if (totalStock <= outOfStockThreshold) {
          outOfStockCount++;
        } else if (totalStock <= lowStockThreshold) {
          lowStockCount++;
        }
      }
    });

    return { lowStockCount, outOfStockCount };
  };

  const { lowStockCount, outOfStockCount } = getLowStockCount();

  if (lowStockCount === 0 && outOfStockCount === 0) {
    return null;
  }

  return (
    <Alert variant={outOfStockCount > 0 ? "destructive" : "default"} className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-sm">
        Inventory Alert
      </AlertTitle>
      <AlertDescription className="text-sm">
        {outOfStockCount > 0 && (
          <span className="text-red-600 font-medium">
            {outOfStockCount} out of stock
          </span>
        )}
        {outOfStockCount > 0 && lowStockCount > 0 && <span className="mx-2">•</span>}
        {lowStockCount > 0 && (
          <span className="text-amber-600 font-medium">
            {lowStockCount} low stock
          </span>
        )}
        <Button asChild variant="link" size="sm" className="p-0 h-auto ml-2">
          <Link href="/products">View Details</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}