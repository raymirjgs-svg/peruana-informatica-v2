import { Product } from '@/models/Product';
import { getApiBase } from '@/lib/apiBase';

export const getProductImage = (product: Product) => {
  const apiBase = getApiBase();
  const baseUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

  const buildImageUrl = (img?: string) => {
    if (!img) return null;
    if (img.includes('placeholder')) return null;

    if (img.startsWith('http')) {
      if (img.includes('192.168.1.122') || img.includes('localhost:3001')) {
        try {
          const urlObj = new URL(img);
          if (urlObj.pathname.startsWith('/uploads/')) {
            return `${baseUrl}${urlObj.pathname}`;
          }
          return img.replace(/(http:\/\/)?(192\.168\.1\.122|localhost):3001/, baseUrl);
        } catch {
          return `${baseUrl}/uploads/${img.split('/').pop()}`;
        }
      }
      return img;
    }

    const cleanPath = img.startsWith('/') ? img.slice(1) : img;

    if (cleanPath.startsWith('uploads/')) {
      return `${baseUrl}/${cleanPath}`;
    }

    return `${baseUrl}/uploads/${cleanPath}`;
  };

  const images = product.images as Array<{ imagen?: string; url?: string; image?: string }> | undefined;

  if (images && images.length > 0) {
    const firstImage = images[0]?.imagen || images[0]?.url || images[0]?.image;
    return buildImageUrl(firstImage);
  }

  if (product.image) return buildImageUrl(product.image);

  return null;
};
