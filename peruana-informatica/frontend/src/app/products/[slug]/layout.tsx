import type { Metadata } from "next";
import Script from "next/script";

function getApiBase() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  try {
    const res = await fetch(`${getApiBase()}/products/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok)
      return {
        title: `Producto | Peruana Informática`,
        description: "Detalle de producto",
      };
    const p = await res.json();
    const rawTitle: string = p.seo_title || p.name;
    const rawDesc: string = p.seo_description || p.description || "";
    const title = `${rawTitle} | Peruana Informática`;
    const description = rawDesc.toString().substring(0, 160);
    const image = p.image || `/images/no-image.svg`;
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
  let jsonLd: any = null;
  try {
    const res = await fetch(`${getApiBase()}/products/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const p = await res.json();
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const url = `${siteUrl}/products/${slug}`;
      const image = p.image || `/images/no-image.svg`;
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
          name: p.name,
          description: p.description,
          image: [image],
          sku: String(p.id),
          url,
          brand: p.productBrand?.name
            ? { "@type": "Brand", name: p.productBrand.name }
            : undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: "PEN",
            price: String(p.price),
            availability:
              (p.stock ?? 0) > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url,
          },
        },
      ];
    }
  } catch {}

  return (
    <>
      {jsonLd && (
        <Script
          id="product-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
