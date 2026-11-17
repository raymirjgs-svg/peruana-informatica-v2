import type { Product } from '@/models/Product';

export function isProductAvailable(product: Pick<Product, 'stock'>): boolean {
  return product.stock > 0;
}
