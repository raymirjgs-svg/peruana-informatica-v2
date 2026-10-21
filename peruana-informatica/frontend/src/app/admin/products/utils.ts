import type { Product } from './types';
import { getApiBase as getHostBase } from '@/lib/apiBase';

export function getApiBase() {
  return `${getHostBase()}/api`;
}

export function isValidUrl(value: string) {
    if (!value) return true;
    try {
      // allow absolute URLs only for now
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
}

export function getProductImageUrl(product: Product) {
    if (!product.images || product.images.length === 0) return null;
    const img = product.images[0]?.imagen;
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${getHostBase()}/uploads/${encodeURIComponent(img)}`;
}
