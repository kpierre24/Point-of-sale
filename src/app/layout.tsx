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
  // Check if the page is the splash page by looking for a prop passed up
  // from ClientLayoutWrapper. This is more robust than checking the segment name.
  if ((children as React.ReactElement)?.props?.childProp?.segment === '__PAGE__') {
     return (
        <html lang="en" className={`${GeistSans.variable}`}>
            <body className="font-sans antialiased">
                {children}
                <Toaster />
            </body>
        </html>
     );
  }

  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className={`font-sans antialiased`}>
        <ClientLayoutWrapper>
          {React.cloneElement(children as React.ReactElement, { selectedLocationId: null, isAppPage: true })}
        </ClientLayoutWrapper>
        <Toaster />
      </body>
    </html>
  );
}
