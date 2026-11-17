import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Peruana de Informática',
  description: 'Artículos, guías y novedades sobre tecnología, equipos y soluciones informáticas.',
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://peruanainformatica.com'}/blog` },
  openGraph: {
    title: 'Blog | Peruana de Informática',
    description: 'Artículos, guías y novedades sobre tecnología, equipos y soluciones informáticas.',
    type: 'website',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
