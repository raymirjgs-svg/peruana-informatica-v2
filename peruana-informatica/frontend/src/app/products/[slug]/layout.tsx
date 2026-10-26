import type { Metadata } from "next";
import Script from "next/script";
import { escapeJsonLd } from "@/lib/sanitize";
import apiClient from '@/utils/api';

interface ProductSeo {
  id?: number | string;
  name?: string;
  description?: string;
  seo_title?: string;
  seo_description?: string;
  image?: string;
  price?: number;
  stock?: number;
  productBrand?: { name?: string };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  try {
    const p = await apiClient.request<ProductSeo>(`/api/products/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    const rawTitle: string = p.seo_title || p.name || "";
    const rawDesc: string = p.seo_description || p.description || "";
    const title = rawTitle ? `${rawTitle} | Peruana Informática | Venta en Perú` : "Producto | Peruana Informática | Venta en Perú";
    const description = (rawDesc.toString().substring(0, 160) || "Compra online en Peruana Informática. Venta y despacho en Lima. Envíos a todo el Perú.").replace(/<[^>]+>/g, '');
    const image = p.image || `https://placehold.co/1200x630?text=Imagen+no+disponible`;
    const urlBase = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const url = `${urlBase}/products/${slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: "website",
        images: [{ url: image, width: 1200, height: 630, alt: p.name }],
      },
      alternates: { canonical: url },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: `Producto | Peruana Informática`,
      description: "Detalle de producto",
    };
  }
}

export default async function ProductSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  let jsonLd: unknown[] | null = null;
  try {
    const p = await apiClient.request<ProductSeo>(`/api/products/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const url = `${siteUrl}/products/${slug}`;
    const image = p.image || `https://placehold.co/1200x630?text=Imagen+no+disponible`;
    const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Productos",
            item: `${siteUrl}/products`,
          },
          { "@type": "ListItem", position: 3, name: p.name, item: url },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": url,
        name: p.name,
        description: p.description,
        image: [image],
        sku: String(p.id),
        url,
        itemCondition: "https://schema.org/NewCondition",
        brand: p.productBrand?.name
          ? { "@type": "Brand", name: p.productBrand.name, url: siteUrl }
          : undefined,
        seller: {
          "@type": "Organization",
          name: "Peruana Informática",
          url: siteUrl,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "PEN",
          price: String(p.price),
          availability:
            (p.stock ?? 0) > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url,
          priceValidUntil,
          itemCondition: "https://schema.org/NewCondition",
          areaServed: {
            "@type": "Country",
            name: "PE",
          },
        },
      },
    ];
  } catch (error) {
    console.error("Failed to build product JSON-LD", error);
  }

  return (
    <>
      {jsonLd && (
        <Script
          id="product-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
