import type { MetadataRoute } from "next";
import apiClient from '@/utils/api';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  try {
    // Obtener posts publicados del blog (endpoint público)
    const blogData = await apiClient.request<{ data?: Array<{ slug?: string; updatedAt?: string; published_at?: string; createdAt?: string }> }>('/api/blog?limit=100', {
      next: { revalidate: 3600 },
    });
    const blogPosts = blogData.data || [];

    for (const post of blogPosts) {
        if (!post?.slug) continue;
        routes.push({
          url: `${siteUrl}/blog/${post.slug}`,
          lastModified: new Date(
            post.updatedAt || post.published_at || post.createdAt || Date.now(),
          ),
          changeFrequency: "monthly",
          priority: 0.6,
        });
    }

    // Rutas base públicas (no requieren credenciales)
    routes.push(
      {
        url: `${siteUrl}/`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${siteUrl}/products`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${siteUrl}/categories`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${siteUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      },
      {
        url: `${siteUrl}/contacto`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      },
    );

    // Agregar productos dinámicamente (primeras 500 URLs para evitar sitemap muy grande)
    type SitemapProduct = { slug?: string; updated_at?: string; createdAt?: string };
    const productsData = await apiClient.request<SitemapProduct[] | { products?: SitemapProduct[] }>(
      '/api/products?page=1&limit=500',
      { next: { revalidate: 600 } },
    );
    const products = Array.isArray(productsData)
      ? productsData
      : productsData.products || [];

    for (const product of products) {
      if (!product?.slug) continue;

      // Evitar duplicados si ya existe en configuraciones SEO
      const existingRoute = routes.find(
        (r) => r.url === `${siteUrl}/products/${product.slug}`,
      );
      if (!existingRoute) {
        routes.push({
          url: `${siteUrl}/products/${product.slug}`,
          lastModified: new Date(
            product.updated_at || product.createdAt || new Date(),
          ),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    console.error("Error generating sitemap:", error);

    // Fallback a rutas básicas en caso de error
    routes.push(
      {
        url: `${siteUrl}/`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${siteUrl}/products`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${siteUrl}/categories`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${siteUrl}/contacto`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      },
    );
  }

  // Remover duplicados y ordenar por prioridad
  const uniqueRoutes = routes.filter(
    (route, index, self) =>
      index === self.findIndex((r) => r.url === route.url),
  );

  return uniqueRoutes.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
