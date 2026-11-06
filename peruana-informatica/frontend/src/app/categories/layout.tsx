import type { Metadata } from "next";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://peruanadeinformatica.com.pe"
).replace(/\/+$/, "");

export async function generateMetadata(): Promise<Metadata> {
  const title = "Categorías";
  const description =
    "Explora todas las categorías disponibles y descubre productos por cada sección.";
  const url = `${siteUrl}/categories`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Categorías", item: `${siteUrl}/categories` },
    ],
  };
  return (
    <>
      <script
        id="categories-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
