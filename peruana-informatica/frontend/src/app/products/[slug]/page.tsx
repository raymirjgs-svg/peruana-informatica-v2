import Head from 'next/head';
import { ProductService } from '@/services/ProductService';
import { SettingsService, type CompanySettings } from '@/services/SettingsService';
import type { Product } from '@/models/Product';
import ProductDetailClient from './ProductDetailClient';

export const revalidate = 300;

async function loadProduct(slug: string): Promise<Product | null> {
  try {
    return await new ProductService().getProductBySlug(decodeURIComponent(slug));
  } catch {
    return null;
  }
}

async function loadRelated(product: Product | null, service: ProductService): Promise<Product[]> {
  if (!product) return [];

  try {
    if (product.category) {
      const params = new URLSearchParams({
        page: '1',
        limit: '4',
        category: product.category,
      }).toString();
      const result = await service.getProductsWithFilters(params);
      return result.products.filter((item) => item.id !== product.id).slice(0, 3);
    }

    const { products } = await service.getProducts(1, 4);
    return products.filter((item) => item.id !== product.id).slice(0, 3);
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = new ProductService();

  const [product, settings] = await Promise.all([
    loadProduct(slug),
    SettingsService.getPublicSettings().catch(() => null as CompanySettings | null),
  ]);

  const related = await loadRelated(product, service);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://peruanainformatica.com';
  const canonicalUrl = `${siteUrl}/products/${slug}`;

  const schemaLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': canonicalUrl,
        name: product.name,
        image: product.images?.[0]?.imagen ?? '',
        description: product.shortDescription,
        brand: { '@type': 'Brand', name: product.brand ?? '' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'PEN',
          price: product.price?.toString() ?? '0',
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          url: canonicalUrl,
        }
      }
    : null;

  return (
    <>
      <Head>
        <title>{product?.name ?? 'Producto no encontrado'} – Peruana Informática</title>
        <meta name="description" content={product?.shortDescription ?? ''} />
        <meta name="keywords" content={product ? `${product.name}, ${product.category}` : ''} />
        <link rel="canonical" href={canonicalUrl} />
        {schemaLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLd) }}
          />
        )}
      </Head>
      <div className="container mx-auto px-4 mt-2">
        <p className="text-sm text-gray-600">Venta y despacho en Lima. Envíos a todo el Perú.</p>
      </div>
      <ProductDetailClient
        key={slug}
        slug={slug}
        initialProduct={product}
        initialRelated={related}
        initialSettings={settings}
      />
    </>
  );
}
