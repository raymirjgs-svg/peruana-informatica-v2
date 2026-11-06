'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { PromoModal } from '@/components/promo/PromoModal';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Si estamos en rutas de admin o login, solo renderizar children sin wrapper
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Para páginas públicas, incluir Header, Navbar, Footer y container
  return (
    <>
      <Header />
      <main className="min-h-screen max-w-[1920px] mx-auto px-4 md:px-6 py-8">{children}</main>
      <Footer />
      <PromoModal />
    </>
  );
}
