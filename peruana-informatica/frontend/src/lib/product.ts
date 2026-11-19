import type { Product } from '@/models/Product';

export const STOCK_DISPLAY_LIMIT = 10;

export function isProductAvailable(product: Pick<Product, 'stock'>): boolean {
  return product.stock > 0;
}

/**
 * Etiqueta de stock para el publico: si hay mas de 10 unidades se muestra
 * "10+" y nunca la cantidad exacta. Si la API ya envia la etiqueta
 * (`stock_display`) se respeta esa.
 */
export function formatStockLabel(
  stock?: number | string | null,
  display?: string | null
): string {
  if (display) return display;
  const units = Number(stock) || 0;
  return units > STOCK_DISPLAY_LIMIT ? `${STOCK_DISPLAY_LIMIT}+` : String(units);
}
