import { Product } from './types';

export function getApiBase() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export function isValidUrl(value: string) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function getProductImageUrl(product: Product) {
  if (!product.images || product.images.length === 0) return null;
  const img = product.images[0]?.imagen;
  if (!img) return null;
  if (img.startsWith("http")) return img;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/api\/?$/, "");
  return `${baseUrl}/uploads/${encodeURIComponent(img)}`;
}