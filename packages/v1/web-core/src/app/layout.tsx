import type { Metadata } from 'next';
import './globals.css';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Toaster } from '@/components/organisms/Toaster';

export const metadata: Metadata = {
  title: 'Duck Engine Web Core',
  description: 'Web core for Duck Engine (assets, scenes, tools)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          {children}
          <Toaster />
        </NotificationProvider>
      </body>
    </html>
  );
}
