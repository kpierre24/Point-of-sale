// src/components/ui/category-badge.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Coffee, 
  Utensils, 
  ShoppingBag, 
  Shirt, 
  Laptop, 
  Heart, 
  Home, 
  Car,
  Book,
  Gamepad2,
  Music,
  Camera,
  Dumbbell,
  Palette,
  Package
} from "lucide-react";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

// Category color mapping for consistent visual organization
const getCategoryInfo = (category: string) => {
  const normalizedCategory = category.toLowerCase().trim();
  
  // Define category mappings with colors and icons
  const categoryMap: Record<string, { color: string; bgColor: string; icon: any }> = {
    // Food & Beverage
    "food": { color: "text-orange-700", bgColor: "bg-orange-100 border-orange-300", icon: Utensils },
    "beverage": { color: "text-blue-700", bgColor: "bg-blue-100 border-blue-300", icon: Coffee },
    "coffee": { color: "text-amber-700", bgColor: "bg-amber-100 border-amber-300", icon: Coffee },
    "drinks": { color: "text-blue-700", bgColor: "bg-blue-100 border-blue-300", icon: Coffee },
    
    // Retail
    "clothing": { color: "text-purple-700", bgColor: "bg-purple-100 border-purple-300", icon: Shirt },
    "apparel": { color: "text-purple-700", bgColor: "bg-purple-100 border-purple-300", icon: Shirt },
    "accessories": { color: "text-pink-700", bgColor: "bg-pink-100 border-pink-300", icon: ShoppingBag },
    
    // Electronics
    "electronics": { color: "text-indigo-700", bgColor: "bg-indigo-100 border-indigo-300", icon: Laptop },
    "technology": { color: "text-indigo-700", bgColor: "bg-indigo-100 border-indigo-300", icon: Laptop },
    "gadgets": { color: "text-indigo-700", bgColor: "bg-indigo-100 border-indigo-300", icon: Laptop },
    
    // Health & Beauty
    "health": { color: "text-green-700", bgColor: "bg-green-100 border-green-300", icon: Heart },
    "beauty": { color: "text-rose-700", bgColor: "bg-rose-100 border-rose-300", icon: Heart },
    "wellness": { color: "text-green-700", bgColor: "bg-green-100 border-green-300", icon: Heart },
    
    // Home & Garden
    "home": { color: "text-slate-700", bgColor: "bg-slate-100 border-slate-300", icon: Home },
    "garden": { color: "text-emerald-700", bgColor: "bg-emerald-100 border-emerald-300", icon: Home },
    "furniture": { color: "text-slate-700", bgColor: "bg-slate-100 border-slate-300", icon: Home },
    
    // Automotive
    "automotive": { color: "text-gray-700", bgColor: "bg-gray-100 border-gray-300", icon: Car },
    "auto": { color: "text-gray-700", bgColor: "bg-gray-100 border-gray-300", icon: Car },
    
    // Books & Media
    "books": { color: "text-teal-700", bgColor: "bg-teal-100 border-teal-300", icon: Book },
    "media": { color: "text-cyan-700", bgColor: "bg-cyan-100 border-cyan-300", icon: Music },
    "entertainment": { color: "text-violet-700", bgColor: "bg-violet-100 border-violet-300", icon: Gamepad2 },
    
    // Sports & Recreation
    "sports": { color: "text-red-700", bgColor: "bg-red-100 border-red-300", icon: Dumbbell },
    "fitness": { color: "text-red-700", bgColor: "bg-red-100 border-red-300", icon: Dumbbell },
    "recreation": { color: "text-orange-700", bgColor: "bg-orange-100 border-orange-300", icon: Gamepad2 },
    
    // Arts & Crafts
    "arts": { color: "text-fuchsia-700", bgColor: "bg-fuchsia-100 border-fuchsia-300", icon: Palette },
    "crafts": { color: "text-fuchsia-700", bgColor: "bg-fuchsia-100 border-fuchsia-300", icon: Palette },
    "art": { color: "text-fuchsia-700", bgColor: "bg-fuchsia-100 border-fuchsia-300", icon: Palette },
    
    // Photography
    "photography": { color: "text-stone-700", bgColor: "bg-stone-100 border-stone-300", icon: Camera },
    "camera": { color: "text-stone-700", bgColor: "bg-stone-100 border-stone-300", icon: Camera },
  };

  // Check for exact matches first
  if (categoryMap[normalizedCategory]) {
    return categoryMap[normalizedCategory];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return value;
    }
  }

  // Default fallback
  return {
    color: "text-slate-700",
    bgColor: "bg-slate-100 border-slate-300",
    icon: Package
  };
};

export function CategoryBadge({
  category,
  size = "md",
  showIcon = true,
  className,
}: CategoryBadgeProps) {
  if (!category || category.trim() === "") {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        {showIcon && <Package className="mr-1 h-3 w-3" />}
        Uncategorized
      </Badge>
    );
  }

  const categoryInfo = getCategoryInfo(category);
  const Icon = categoryInfo.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Badge
      className={cn(
        sizeClasses[size],
        categoryInfo.bgColor,
        categoryInfo.color,
        "border font-medium capitalize",
        className
      )}
    >
      {showIcon && <Icon className={cn(iconSizes[size], "mr-1")} />}
      {category}
    </Badge>
  );
}