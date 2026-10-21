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

  return (
    <ProductDetailClient
      key={slug}
      slug={slug}
      initialProduct={product}
      initialRelated={related}
      initialSettings={settings}
    />
  );
}
