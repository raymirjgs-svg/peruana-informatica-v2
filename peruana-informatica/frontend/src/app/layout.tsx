// ============================================
// 1. src/app/layout.tsx
// ============================================
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import { CartProvider } from '@/hooks/useCart';
import { WishlistProvider } from '@/hooks/useWishlist';
import { CompareProvider } from '@/hooks/useCompare';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Peruana de Informática | Equipos Tecnológicos en Perú',
  description: 'Venta de laptops, monitores, periféricos y equipos informáticos de calidad en todo Perú',
  keywords: 'laptop, computadora, monitor, periféricos, tecnología, Perú',
  openGraph: {
    title: 'Peruana de Informática',
    description: 'Tu tienda de tecnología de confianza',
    url: 'https://peruanainformatica.com',
    type: 'website',
    locale: 'es_ES',
  },
};

import { SettingsProvider } from '@/context/SettingsContext';
import { FaviconUpdater } from '@/components/common/FaviconUpdater';
import NextAuthProvider from '@/components/providers/NextAuthProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} font-sans bg-gray-50`} suppressHydrationWarning={true}>
        <NextAuthProvider>
          <SettingsProvider>
            <FaviconUpdater />
            <ErrorBoundary>
              <CompareProvider>
                <WishlistProvider>
                  <CartProvider>
                    <LayoutWrapper>{children}</LayoutWrapper>
                  </CartProvider>
                </WishlistProvider>
              </CompareProvider>
            </ErrorBoundary>
          </SettingsProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
