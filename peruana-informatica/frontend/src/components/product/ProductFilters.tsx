'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryService } from '@/services/CategoryService';
import { BrandService } from '@/services/BrandService';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Brand {
  id: number;
  name: string;
  slug: string;
}

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  // Cargar categorías y marcas
  useEffect(() => {
    const loadData = async () => {
      try {
        const categoryService = new CategoryService();
        const brandService = new BrandService();

        const [categoriesData, brandsData] = await Promise.all([
          categoryService.getCategories(),
          brandService.getBrands()
        ]);

        setCategories(categoriesData);
        setBrands(brandsData);
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };

    loadData();
  }, []);

  // Aplicar filtros
  const applyFilters = () => {
    const params = new URLSearchParams();

    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedBrand) params.set('brand', selectedBrand);
    if (sortBy) params.set('sort', sortBy);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    // Mantener la búsqueda si existe
    const search = searchParams.get('search');
    if (search) params.set('search', search);

    params.set('page', '1'); // Resetear a página 1

    router.push(`/products?${params.toString()}`);
    setShowFilters(false);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSortBy('');
    setMinPrice('');
    setMaxPrice('');

    const search = searchParams.get('search');
    if (search) {
      router.push(`/products?search=${search}&page=1`);
    } else {
      router.push('/products');
    }
    setShowFilters(false);
  };

  const hasActiveFilters = selectedCategory || selectedBrand || sortBy || minPrice || maxPrice;

  return (
    <>
      {/* Botón flotante para móvil */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="lg:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition z-40 flex items-center gap-2"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filtros
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {[selectedCategory, selectedBrand, sortBy, minPrice || maxPrice].filter(Boolean).length}
          </span>
        )}
      </button>

      {/* Overlay para móvil */}
      {showFilters && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Panel de filtros */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-screen lg:h-auto
        w-80 lg:w-full
        bg-white dark:bg-gray-900 lg:bg-transparent lg:dark:bg-transparent
        shadow-xl lg:shadow-none
        z-50 lg:z-0
        transform transition-transform duration-300
        ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto
        p-6 lg:p-0
      `}>
        {/* Header móvil */}
        <div className="lg:hidden flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Filtros</h2>
          <button
            onClick={() => setShowFilters(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido de filtros */}
        <div className="space-y-6">
          {/* Ordenar por */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Ordenar por
            </h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Relevancia</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="name_asc">Nombre: A-Z</option>
              <option value="name_desc">Nombre: Z-A</option>
              <option value="newest">Más Recientes</option>
            </select>
          </div>

          {/* Rango de precio */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rango de Precio
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Categorías */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categorías
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                  <input
                    type="radio"
                    name="category"
                    value={category.slug}
                    checked={selectedCategory === category.slug}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">{category.name}</span>
                </label>
              ))}
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory('')}
                  className="text-sm text-blue-600 hover:text-blue-800 underline w-full text-left pl-2"
                >
                  Limpiar categoría
                </button>
              )}
            </div>
          </div>

          {/* Marcas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Marcas
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brands.map((brand) => (
                <label key={brand.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                  <input
                    type="radio"
                    name="brand"
                    value={brand.slug}
                    checked={selectedBrand === brand.slug}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">{brand.name}</span>
                </label>
              ))}
              {selectedBrand && (
                <button
                  onClick={() => setSelectedBrand('')}
                  className="text-sm text-blue-600 hover:text-blue-800 underline w-full text-left pl-2"
                >
                  Limpiar marca
                </button>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 lg:dark:bg-transparent pt-4 pb-2 space-y-2 border-t dark:border-gray-700 lg:border-0">
            <button
              onClick={applyFilters}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Aplicar Filtros
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
