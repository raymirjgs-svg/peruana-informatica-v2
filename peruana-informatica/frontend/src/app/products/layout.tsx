import type { Metadata } from "next";
import { getApiBase as getApiHost } from '@/lib/apiBase';

function getApiBase() {
  return `${getApiHost()}/api`;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Catálogo de productos | Peruana de Informática",
  description: "Laptops, monitores, periféricos y componentes de las mejores marcas.",
  alternates: { canonical: `${siteUrl}/products` },
  openGraph: {
    title: "Catálogo de productos | Peruana de Informática",
    description: "Laptops, monitores, periféricos y componentes de las mejores marcas.",
    url: `${siteUrl}/products`,
    type: "website",
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
