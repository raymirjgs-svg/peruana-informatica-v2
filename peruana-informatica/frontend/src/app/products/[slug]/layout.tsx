import type { Metadata } from "next";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://peruanadeinformatica.com.pe"
).replace(/\/+$/, "");

function getApiBase() {
  const baseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://backend:3001";
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function stripHtml(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toAbsoluteImage(image: unknown): string {
  if (typeof image !== "string" || !image) return `${siteUrl}/no-image.svg`;
  if (image.startsWith("http")) return image;
  return `${siteUrl}${image.startsWith("/") ? "" : "/"}${image}`;
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
        title: "Producto",
        description: "Detalle de producto",
      };
    const p = await res.json();
    const rawTitle: string = p.seo_title || p.name;
    const rawDesc: string = stripHtml(
      p.seo_description || p.short_description || p.description || "",
    );
    const description = rawDesc.substring(0, 160);
    const image = toAbsoluteImage(p.image);
    const url = `${siteUrl}/products/${slug}`;

    return {
      title: rawTitle,
      description,
      openGraph: {
        title: rawTitle,
        description,
        url,
        type: "website",
        images: [{ url: image, width: 1200, height: 630, alt: p.name }],
      },
      alternates: { canonical: url },
      twitter: {
        card: "summary_large_image",
        title: rawTitle,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Producto",
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
      const url = `${siteUrl}/products/${slug}`;
      const image = toAbsoluteImage(p.image);
      const sku = p.cod_producto ?? p.codigo_interno ?? "";
      const price = p.price_web ?? p.price;

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
          description: stripHtml(p.description),
          image: [image],
          ...(sku !== "" ? { sku: String(sku) } : {}),
          ...(p.codigo_interno ? { mpn: String(p.codigo_interno) } : {}),
          url,
          ...(p.productBrand?.name
            ? { brand: { "@type": "Brand", name: p.productBrand.name } }
            : {}),
          offers: {
            "@type": "Offer",
            priceCurrency: "PEN",
            ...(price !== undefined && price !== null && price !== ""
              ? { price: String(price) }
              : {}),
            itemCondition: "https://schema.org/NewCondition",
            availability:
              (p.stock ?? 0) > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url,
            seller: {
              "@type": "Organization",
              name: "Peruana Informática",
            },
          },
        },
      ];
    }
  } catch {}

  return (
    <>
      {jsonLd && (
        <script
          id="product-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
