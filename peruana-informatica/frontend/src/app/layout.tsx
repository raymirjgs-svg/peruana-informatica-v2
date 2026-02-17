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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://peruanainformatica.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Peruana Informática | Tecnología y Equipos en Perú',
    template: '%s | Peruana Informática',
  },
  description: 'Tienda líder en venta de laptops, computadoras, monitores, periféricos y accesorios tecnológicos en Perú. Envíos a todo el país. ¡Compra ahora!',
  keywords: ['laptop', 'computadora', 'monitor', 'periféricos', 'tecnología', 'Perú', 'tienda online', 'hardware', 'accesorios pc', 'gaming'],
  authors: [{ name: 'Peruana Informática' }],
  creator: 'Peruana Informática',
  publisher: 'Peruana Informática',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: SITE_URL,
    siteName: 'Peruana Informática',
    title: 'Peruana Informática | Tecnología y Equipos en Perú',
    description: 'Tienda líder en venta de laptops, computadoras, monitores, periféricos y accesorios tecnológicos en Perú.',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Peruana Informática - Tu tienda de tecnología',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Peruana Informática | Tecnología y Equipos en Perú',
    description: 'Tienda líder en venta de laptops, computadoras, monitores y accesorios tecnológicos en Perú.',
    images: [`${SITE_URL}/og-image.jpg`],
    creator: '@peruanainformatica',
  },
  verification: {
    google: 'google-site-verification-code',
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'es-PE': SITE_URL,
    },
  },
  category: 'technology',
  classification: 'E-commerce',
};

import { SettingsProvider } from '@/context/SettingsContext';
import { FaviconUpdater } from '@/components/common/FaviconUpdater';
import NextAuthProvider from '@/components/providers/NextAuthProvider';
import { OrganizationSchema, WebSiteSchema, LocalBusinessSchema } from '@/components/seo/SchemaMarkup';
import { Toaster } from 'sileo';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://200.58.98.122';

  return (
    <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href={SITE_URL} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={SITE_URL} />
        <OrganizationSchema />
        <WebSiteSchema />
        <LocalBusinessSchema />
      </head>
      <body className={`${inter.variable} font-sans bg-gray-50`} suppressHydrationWarning={true}>
        <NextAuthProvider>
          <SettingsProvider>
            <FaviconUpdater />
            <ErrorBoundary>
              <CompareProvider>
                <WishlistProvider>
                  <CartProvider>
                    <Toaster position="top-right" />
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
