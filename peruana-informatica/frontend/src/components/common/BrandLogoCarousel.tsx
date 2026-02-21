'use client';

import { useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';

interface BrandItem {
  id: number;
  name: string;
  slug: string;
  logo: string;
}

const BACKEND_URL = API_CONFIG.API_BASE_URL;

export function BrandLogoCarousel() {
  const [brands, setBrands] = useState<BrandItem[]>([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/brands/carousel`)
      .then((r) => r.json())
      .then((json) => {
        const list: BrandItem[] = Array.isArray(json) ? json : (json.data ?? []);
        if (list.length > 0) setBrands(list);
      })
      .catch(() => {/* silencioso si el backend no responde */});
  }, []);

  if (brands.length === 0) return null;

  const track = [...brands, ...brands];

  return (
    <section className="w-full py-6 overflow-hidden border-y border-gray-100 dark:border-white/5">
      <p className="text-center text-[10px] font-bold tracking-[0.25em] uppercase text-white/25 mb-5 select-none">
        Marcas que distribuimos
      </p>

      <div className="relative flex">
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-r from-white dark:from-gray-950 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-l from-white dark:from-gray-950 to-transparent" />

        <div
          className="flex items-center gap-12 animate-brand-ticker"
          style={{ width: 'max-content' }}
        >
          {track.map((brand, i) => (
            <a
              key={`${brand.id}-${i}`}
              href={`/products?brand=${brand.slug}`}
              className="flex-shrink-0 flex items-center justify-center transition-transform duration-300 ease-out hover:scale-125"
              title={brand.name}
              style={{ width: '100px', height: '48px' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logo}
                alt={brand.name}
                className="object-contain dark:invert"
                style={{ maxHeight: '48px', maxWidth: '100px', width: 'auto', height: 'auto' }}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
