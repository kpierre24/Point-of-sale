// src/app/(splash)/layout.tsx
import type { Metadata } from 'next';
import { APP_TITLE } from '@/config/constants';

export const metadata: Metadata = {
  title: `${APP_TITLE} - Loading`,
  description: 'Initializing Point of Sale Pro application.',
};

export default function SplashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  );
}
