import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

function getApiBase() {
  const baseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://backend:3001";
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://peruanadeinformatica.com.pe"
).replace(/\/+$/, "");

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
  { url: `${siteUrl}/products`, changeFrequency: "daily", priority: 0.9 },
  { url: `${siteUrl}/categories`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/contacto`, changeFrequency: "monthly", priority: 0.7 },
];

const PAGE_SIZE = 100;
const MAX_PRODUCTS = 5000;

async function fetchAllProducts() {
  const products: any[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && products.length < MAX_PRODUCTS) {
    const res = await fetch(
      `${getApiBase()}/products?page=${page}&limit=${PAGE_SIZE}`,
      { cache: "no-store" },
    );
    if (!res.ok) break;

    const data = await res.json();
    const batch = Array.isArray(data) ? data : data.products || [];
    if (batch.length === 0) break;

    products.push(...batch);
    totalPages = Number(data.totalPages) || page;
    page += 1;
  }

  return products.slice(0, MAX_PRODUCTS);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [...STATIC_ROUTES];
  const now = new Date();

  try {
    const products = await fetchAllProducts();

    for (const product of products) {
      if (!product?.slug) continue;

      routes.push({
        url: `${siteUrl}/products/${product.slug}`,
        lastModified: product.updated_at
          ? new Date(product.updated_at)
          : product.createdAt
            ? new Date(product.createdAt)
            : now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  const uniqueRoutes = routes.filter(
    (route, index, self) =>
      index === self.findIndex((r) => r.url === route.url),
  );

  return uniqueRoutes.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
