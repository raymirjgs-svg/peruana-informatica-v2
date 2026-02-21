'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_CONFIG } from '@/config/api';

const API = API_CONFIG.API_BASE_URL;

interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  show_in_carousel?: boolean;
}

const getLogoSrc = (logo: string | null | undefined): string | null => {
  if (!logo) return null;
  if (logo.startsWith('http')) return logo;
  return logo.startsWith('/') ? logo : `/${logo}`;
};

const getBrandColor = (name: string) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
  return colors[(name?.[0] ?? 'A').toUpperCase().charCodeAt(0) % colors.length];
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch(`${API}/api/brands`)
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json) ? json : (json.data ?? []);
        setBrands(list);
      })
      .catch((err) => {
        console.error('Error cargando marcas:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredBrands = filter
    ? brands.filter((b) => b.name.toUpperCase().startsWith(filter))
    : brands;

  const availableLetters = Array.from(
    new Set(brands.map((b) => (b.name?.[0] ?? '').toUpperCase()).filter(Boolean))
  ).sort();

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Todas las Marcas</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {loading ? 'Cargando...' : `${brands.length} marcas tecnológicas`}
        </p>
      </div>

      {/* Filtro alfabético */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filtrar por letra:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              filter === '' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {availableLetters.map((letter) => (
            <button
              key={letter}
              onClick={() => setFilter(letter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                filter === letter ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mb-4" />
          <p className="text-gray-500">Cargando marcas...</p>
        </div>
      )}

      {/* Estado de error */}
      {!loading && error && (
        <div className="text-center py-16 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-red-700 dark:text-red-400 font-semibold mb-2">No se pudieron cargar las marcas</p>
          <p className="text-red-500 dark:text-red-500 text-sm mb-4">Verifica tu conexión e intenta de nuevo</p>
          <button
            onClick={() => { setError(false); setLoading(true); fetch(`${API}/api/brands`).then(r => r.json()).then(json => { setBrands(Array.isArray(json) ? json : (json.data ?? [])); }).catch(() => setError(true)).finally(() => setLoading(false)); }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Grid de marcas */}
      {!loading && !error && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Mostrando {filteredBrands.length} de {brands.length} marcas
          </p>

          {filteredBrands.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-gray-500">No hay marcas que comiencen con &quot;{filter}&quot;</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {filteredBrands.map((brand) => {
                const logo = getLogoSrc(brand.logo);
                return (
                  <Link
                    key={brand.id}
                    href={`/products?brand=${brand.slug}`}
                    className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 p-4 text-center"
                  >
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt={brand.name}
                        className="h-10 w-full object-contain mb-2 dark:invert group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 mx-auto mb-2 rounded-full ${getBrandColor(brand.name)} flex items-center justify-center text-white text-lg font-bold group-hover:scale-110 transition-transform`}
                      >
                        {brand.name.substring(0, 2)}
                      </div>
                    )}
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition leading-tight line-clamp-2">
                      {brand.name}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/products"
              className="inline-block bg-gray-800 dark:bg-gray-700 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 transition font-semibold text-sm"
            >
              ← Ver todos los productos
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
