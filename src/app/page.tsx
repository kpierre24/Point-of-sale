// src/app/page.tsx
"use client"; // Required for using `useEffect` and `useRouter`

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the sales page, which is the main functionality for now
    router.replace('/sales');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg">Loading Point of Sale Pro...</p>
    </div>
  );
}
