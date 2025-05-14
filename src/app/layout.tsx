import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { APP_TITLE } from '@/config/constants';
import { Toaster } from '@/components/ui/toaster';
import { ClientLayoutWrapper } from '@/components/ClientLayoutWrapper';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

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
        <AuthProvider> {/* Wrap with AuthProvider */}
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
