// src/app/card-lookup/layout.tsx
import type { Metadata } from 'next';
import { APP_TITLE } from '@/config/constants';

export const metadata: Metadata = {
  title: `Card Lookup - ${APP_TITLE}`,
  description: 'Check your top-up card balance and transaction history.',
};

export default function CardLookupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/40 flex flex-col items-center py-8 md:py-12">
      <main className="container mx-auto max-w-2xl px-4">
        {children}
      </main>
      <footer className="mt-auto py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} {APP_TITLE}.
      </footer>
    </div>
  );
}
