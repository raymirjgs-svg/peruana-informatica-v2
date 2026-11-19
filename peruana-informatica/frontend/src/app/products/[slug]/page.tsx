import { notFound } from 'next/navigation';
import { ProductService } from '@/services/ProductService';
import { SettingsService } from '@/services/SettingsService';
import ProductDetailClient from './ProductDetailClient';

export const revalidate = 300;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  if (!decodedSlug) {
    notFound();
  }

  const productService = new ProductService();
  const product = await productService.getProductBySlug(decodedSlug);

  if (!product) {
    notFound();
  }

  const [settings, relatedResult] = await Promise.all([
    SettingsService.getPublicSettings(),
    productService.getProductsWithFilters(
      new URLSearchParams({
        page: '1',
        limit: '4',
        category: product.category,
      }).toString()
    ),
  ]);

  let relatedProducts = relatedResult.products
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  if (relatedProducts.length === 0) {
    const fallback = await productService.getProducts(1, 4);
    relatedProducts = fallback.products
      .filter((item) => item.id !== product.id)
      .slice(0, 3);
  }

  return (
    <ProductDetailClient
      slug={decodedSlug}
      initialProduct={product}
      initialRelated={relatedProducts}
      initialSettings={settings}
    />
  );
}
