// src/app/layout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { APP_TITLE } from '@/config/constants';
import { Toaster } from '@/components/ui/toaster';
import { ClientLayoutWrapper } from '@/components/ClientLayoutWrapper';

export const metadata: Metadata = {
  title: APP_TITLE,
  description: 'Point of Sale system with AI-powered suggestions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if the children are for the splash page.
  // This is a way to conditionally apply the main layout.
  // A more robust solution might involve different root layouts for different route groups.
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
          {children}
        </ClientLayoutWrapper>
        <Toaster />
      </body>
    </html>
  );
}
