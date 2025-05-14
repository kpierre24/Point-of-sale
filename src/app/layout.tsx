import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
// Removed GeistMono import as it was causing an error and not explicitly used.
// If mono font is needed later, ensure 'geist/font/mono' is correctly installed/pathed.
import './globals.css';
import { APP_TITLE } from '@/config/constants';
import { Toaster } from '@/components/ui/toaster';
import { ClientLayoutWrapper } from '@/components/ClientLayoutWrapper'; // Import the wrapper

export const metadata: Metadata = {
  title: APP_TITLE,
  description: 'Point of Sale system with AI-powered suggestions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
