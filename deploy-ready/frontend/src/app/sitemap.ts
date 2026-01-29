import type { MetadataRoute } from "next";

function getApiBase() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  try {
    // Obtener configuraciones SEO para determinar las páginas y sus configuraciones
    const seoRes = await fetch(`${getApiBase()}/seo?is_active=true`, {
      next: { revalidate: 3600 },
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin"}:${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"}`).toString("base64")}`,
      },
    });

    if (seoRes.ok) {
      const seoData = await seoRes.json();
      const seoSettings = seoData.data || [];

      // Agregar rutas basadas en configuraciones SEO
      for (const setting of seoSettings) {
        let url = siteUrl;

        // Mapear tipos de página a URLs
        switch (setting.page_type) {
          case "home":
          case "global":
            url = `${siteUrl}/`;
            break;
          case "products":
            url = `${siteUrl}/products`;
            break;
          case "categories":
            url = `${siteUrl}/categories`;
            break;
          case "brands":
            url = `${siteUrl}/brands`;
            break;
          case "contact":
            url = `${siteUrl}/contacto`;
            break;
          case "blog":
            url = `${siteUrl}/blog`;
            break;
          case "product":
            if (setting.page_identifier) {
              url = `${siteUrl}/products/${setting.page_identifier}`;
            }
            break;
          case "category":
            if (setting.page_identifier) {
              url = `${siteUrl}/categories/${setting.page_identifier}`;
            }
            break;
          case "brand":
            if (setting.page_identifier) {
              url = `${siteUrl}/brands/${setting.page_identifier}`;
            }
            break;
          default:
            continue; // Skip unknown page types
        }

        routes.push({
          url,
          lastModified: new Date(setting.updatedAt || setting.createdAt),
          changeFrequency: setting.change_frequency as
            | "always"
            | "hourly"
            | "daily"
            | "weekly"
            | "monthly"
            | "yearly"
            | "never",
          priority: parseFloat(setting.priority.toString()) || 0.5,
        });
      }
    }

    // Si no hay configuraciones SEO, usar rutas por defecto
    if (routes.length === 0) {
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

    // Agregar productos dinámicamente (primeras 500 URLs para evitar sitemap muy grande)
    const productsRes = await fetch(
      `${getApiBase()}/products?page=1&limit=500`,
      {
        next: { revalidate: 600 },
      },
    );

    if (productsRes.ok) {
      const productsData = await productsRes.json();
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
