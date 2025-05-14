// src/app/page.tsx
"use client"; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the splash screen page which handles auth and further redirection
    router.replace('/(splash)');
  }, [router]);

  // Render null or a minimal loader while redirecting
  return null; 
}
