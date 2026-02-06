import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
