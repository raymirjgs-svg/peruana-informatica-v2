'use client';

import { usePathname } from 'next/navigation';

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
  };
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
}

export function OrganizationSchema({
  name = 'Peruana Informática',
  url = 'https://peruanainformatica.com',
  logo = 'https://peruanainformatica.com/logo.png',
  description = 'Tienda líder en venta de laptops, computadoras, monitores y accesorios tecnológicos en Perú',
  contactPoint,
  address,
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    ...(contactPoint && { contactPoint }),
    ...(address && { address: { '@type': 'PostalAddress', ...address } }),
    sameAs: [
      'https://www.facebook.com/peruanainformatica',
      'https://www.instagram.com/peruanainformatica',
      'https://twitter.com/peruanainformatica',
      'https://www.youtube.com/peruanainformatica',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Peruana Informática',
    url: 'https://peruanainformatica.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://peruanainformatica.com/products?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductSchema({ product }: { product: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map((img: any) => img.imagen || img.url)?.filter(Boolean) || [],
    sku: product.codigo_interno || product.cod_producto?.toString(),
    brand: product.productBrand?.name || product.brand,
    offers: {
      '@type': 'Offer',
      price: product.price_web || product.price,
      priceCurrency: 'PEN',
      availability: product.stock > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Peruana Informática',
      },
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 0,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Peruana Informática',
    description: 'Tienda de tecnología y equipos informáticos',
    url: 'https://peruanainformatica.com',
    telephone: '+51-1-234-5678',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Principal 123',
      addressLocality: 'Lima',
      addressRegion: 'Lima',
      postalCode: '15001',
      addressCountry: 'PE',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday'],
        opens: '10:00',
        closes: '18:00',
      },
    ],
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -12.0464,
      longitude: -77.0428,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
