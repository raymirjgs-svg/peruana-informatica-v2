// ============================================
// src/utils/seo.ts
// ============================================
import { Product } from '@/models/Product';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url: string;
  type?: 'website' | 'product' | 'article';
  author?: string;
}

export const generateMetadata = (seo: SEOMetadata) => {
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords?.join(', '),
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.url,
      type: seo.type || 'website',
      images: seo.image ? [{ url: seo.image }] : [],
      locale: 'es_ES',
      siteName: 'Peruana de Informática',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: seo.image ? [seo.image] : [],
    },
    alternates: {
      canonical: seo.url,
    },
  };
};

export const generateProductSchema = (product: Product, url: string) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    url: url,
    sku: product.id,
    price: {
      '@type': 'PriceSpecification',
      priceCurrency: 'PEN',
      price: product.price.toString(),
    },
    availability: product.stock > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
  };
};