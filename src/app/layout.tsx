// src/app/layout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { APP_TITLE } from '@/config/constants';
import { Toaster } from '@/components/ui/toaster';
import { ClientLayoutWrapper } from '@/components/ClientLayoutWrapper';
import React from 'react';

export const metadata: Metadata = {
  title: APP_TITLE,
  description: 'Point of Sale system with AI-powered suggestions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The logic to differentiate splash page vs app pages is now handled inside ClientLayoutWrapper
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className={`font-sans antialiased`}>
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
        <Toaster />
      </body>
    </html>
  );
}
