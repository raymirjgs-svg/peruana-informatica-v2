// ============================================
// 2. frontend/src/app/brands/page.tsx
// ============================================
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandService, Brand } from '@/services/BrandService';
import { Navigation } from '@/components/common/Navigation';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const loadBrands = async () => {
      const brandService = new BrandService();
      const data = await brandService.getBrands();
      setBrands(data);
      setLoading(false);
    };
    loadBrands();
  }, []);

  // Filtrar marcas por letra
  const filteredBrands = filter
    ? brands.filter((brand) => brand.name.toUpperCase().startsWith(filter))
    : brands;

  // Letras disponibles
  const availableLetters = Array.from(new Set(brands.map(b => b.name[0].toUpperCase()))).sort();

  // Logo placeholder según marca
  const getBrandLogo = (name: string) => {
    const firstLetter = name[0].toUpperCase();
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const colorIndex = firstLetter.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  return (
    <>
      <Navigation />
      <div>
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">Todas las Marcas</h1>
          <p className="text-gray-600 text-lg">
            Encuentra productos de {brands.length} marcas líderes en tecnología
          </p>
        </div>

        {/* Filtro alfabético */}
        <div className="mb-8 bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm font-semibold text-gray-600 mb-3">Filtrar por letra:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {availableLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => setFilter(letter)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === letter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Cargando marcas...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Mostrando {filteredBrands.length} de {brands.length} marcas
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${brand.slug}`}
                  className="group bg-white rounded-lg shadow-md hover:shadow-2xl transition-all overflow-hidden border-2 border-transparent hover:border-blue-500"
                >
                  <div className="p-4 text-center">
                    {/* Logo simulado */}
                    <div
                      className={`w-16 h-16 mx-auto mb-3 rounded-full ${getBrandLogo(
                        brand.name
                      )} flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform`}
                    >
                      {brand.name.substring(0, 2)}
                    </div>
                    
                    {/* Nombre */}
                    <h3 className="font-bold text-sm text-gray-800 group-hover:text-blue-600 transition">
                      {brand.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {filteredBrands.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">
              No hay marcas que comiencen con &quot;{filter}&quot;
            </p>
          </div>
        )}

        {/* Botón volver */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-block bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            ← Ver todos los productos
          </Link>
        </div>
      </div>
    </>
  );
}
