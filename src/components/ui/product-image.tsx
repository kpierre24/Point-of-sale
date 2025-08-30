// src/components/ui/product-image.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ImageIcon, Package, AlertCircle } from "lucide-react";

interface ProductImageProps {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
  showBorder?: boolean;
  rounded?: boolean;
}

const sizeMap = {
  sm: { width: 40, height: 40, className: "w-10 h-10" },
  md: { width: 60, height: 60, className: "w-16 h-16" },
  lg: { width: 80, height: 80, className: "w-20 h-20" },
  xl: { width: 120, height: 120, className: "w-30 h-30" },
};

export function ProductImage({
  src,
  alt,
  size = "md",
  className,
  fallbackIcon: FallbackIcon = Package,
  showBorder = true,
  rounded = true,
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeConfig = sizeMap[size];
  const iconSize = size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : size === "lg" ? "h-8 w-8" : "h-10 w-10";

  const containerClasses = cn(
    sizeConfig.className,
    "relative overflow-hidden flex items-center justify-center",
    showBorder && "border-2",
    rounded && "rounded-lg",
    "bg-gradient-to-br from-slate-50 to-slate-100",
    showBorder && "border-slate-200",
    className
  );

  // Show placeholder if no src or if image failed to load
  if (!src || imageError) {
    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center justify-center text-slate-400">
          <FallbackIcon className={iconSize} />
          {size === "lg" || size === "xl" ? (
            <span className="text-xs mt-1 text-center">No Image</span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
          <ImageIcon className={cn(iconSize, "text-slate-400")} />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={sizeConfig.width}
        height={sizeConfig.height}
        className={cn(
          "object-cover transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
        data-ai-hint="product item visual"
      />
    </div>
  );
}

// Enhanced version with hover effects and additional features
export function EnhancedProductImage({
  src,
  alt,
  size = "md",
  className,
  showBorder = true,
  rounded = true,
  showHoverEffect = false,
  onClick,
}: ProductImageProps & {
  showHoverEffect?: boolean;
  onClick?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeConfig = sizeMap[size];
  const iconSize = size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : size === "lg" ? "h-8 w-8" : "h-10 w-10";

  const containerClasses = cn(
    sizeConfig.className,
    "relative overflow-hidden flex items-center justify-center",
    showBorder && "border-2",
    rounded && "rounded-lg",
    "bg-gradient-to-br from-slate-50 to-slate-100",
    showBorder && "border-slate-200",
    showHoverEffect && "transition-all duration-200 hover:shadow-md hover:scale-105",
    onClick && "cursor-pointer",
    className
  );

  // Show placeholder if no src or if image failed to load
  if (!src || imageError) {
    return (
      <div className={containerClasses} onClick={onClick}>
        <div className="flex flex-col items-center justify-center text-slate-400">
          <Package className={iconSize} />
          {size === "lg" || size === "xl" ? (
            <span className="text-xs mt-1 text-center">No Image</span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} onClick={onClick}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
          <ImageIcon className={cn(iconSize, "text-slate-400")} />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={sizeConfig.width}
        height={sizeConfig.height}
        className={cn(
          "object-cover transition-all duration-200",
          isLoading ? "opacity-0" : "opacity-100",
          showHoverEffect && "hover:scale-110"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
        data-ai-hint="product item visual"
      />
      {showHoverEffect && (
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200" />
      )}
    </div>
  );
}
