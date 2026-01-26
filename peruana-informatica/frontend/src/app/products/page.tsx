'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Navigation } from '@/components/common/Navigation';
import { Pagination } from '@/components/common/Pagination';
import { ProductFilters } from '@/components/product/ProductFilters';
import Link from 'next/link';

const PRODUCTS_PER_PAGE = 12;

function ProductsContent() {
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1');
  const categoryFilter = searchParams.get('category') || '';
  const brandFilter = searchParams.get('brand') || '';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isNew = searchParams.get('new') === 'true';
  const isFeatured = searchParams.get('featured') === 'true';
  const isClearance = searchParams.get('clearance') === 'true';

  const queryParams = new URLSearchParams();
  queryParams.set('page', currentPage.toString());
  queryParams.set('limit', PRODUCTS_PER_PAGE.toString());
  if (categoryFilter) queryParams.set('category', categoryFilter);
  if (brandFilter) queryParams.set('brand', brandFilter);
  if (searchQuery) queryParams.set('search', searchQuery);
  if (sortBy) queryParams.set('sort', sortBy);
  if (minPrice) queryParams.set('minPrice', minPrice);
  if (maxPrice) queryParams.set('maxPrice', maxPrice);
  if (isNew) queryParams.set('new', 'true');
  if (isFeatured) queryParams.set('featured', 'true');
  if (isClearance) queryParams.set('clearance', 'true');

  const queryParamsString = queryParams.toString();

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      // Primero probar la conexión
      const productService = new ProductService();
      const connectionOk = await productService.testConnection();
      console.log('🔌 Connection test result:', connectionOk);

      if (!connectionOk) {
        setError('No se puede conectar con el servidor. Por favor, verifica que el backend esté corriendo.');
        setLoading(false);
        return;
      }

      try {
        const { products: productsData, total: totalData, totalPages: totalPagesData } =
          await productService.getProductsWithFilters(queryParamsString);
        setProducts(productsData);
        setTotal(totalData);
        setTotalPages(totalPagesData);
      } catch (err) {
        console.error('Error loading products:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar productos');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [queryParamsString]); // Usar queryParamsString en lugar de queryParams

  // Función para limpiar filtros
  const clearFilters = () => {
    window.location.href = '/products';
  };

  const hasFilters = categoryFilter || brandFilter || searchQuery;

  return (
    <>
      <Navigation />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar de filtros */}
        <aside className="lg:col-span-1">
          <ProductFilters />
        </aside>

        {/* Contenido principal */}
        <div className="lg:col-span-3">
          {/* Header con filtros activos */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Nuestros Productos</h1>

            {/* Filtros activos */}
            {hasFilters && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4 flex flex-wrap items-center gap-3">
                <span className="font-semibold text-gray-700">Filtros activos:</span>

                {categoryFilter && (
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Categoría: {categoryFilter}
                    <Link href={`/products?${new URLSearchParams({
                      ...(brandFilter && { brand: brandFilter }),
                      ...(searchQuery && { search: searchQuery }),
                      page: '1'
                    }).toString()}`}>
                      <button className="hover:text-red-200">✕</button>
                    </Link>
                  </span>
                )}

                {brandFilter && (
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Marca: {brandFilter}
                    <Link href={`/products?${new URLSearchParams({
                      ...(categoryFilter && { category: categoryFilter }),
                      ...(searchQuery && { search: searchQuery }),
                      page: '1'
                    }).toString()}`}>
                      <button className="hover:text-red-200">✕</button>
                    </Link>
                  </span>
                )}

                {searchQuery && (
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Búsqueda: {searchQuery}
                    <Link href={`/products?${new URLSearchParams({
                      ...(categoryFilter && { category: categoryFilter }),
                      ...(brandFilter && { brand: brandFilter }),
                      ...(isNew && { new: 'true' }),
                      ...(isFeatured && { featured: 'true' }),
                      ...(isClearance && { clearance: 'true' }),
                      page: '1'
                    }).toString()}`}>
                      <button className="hover:text-red-200">✕</button>
                    </Link>
                  </span>
                )}

                {isNew && (
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    ✨ Nuevos Ingresos
                    <Link href={`/products?${new URLSearchParams({
                      ...(categoryFilter && { category: categoryFilter }),
                      ...(brandFilter && { brand: brandFilter }),
                      ...(searchQuery && { search: searchQuery }),
                      ...(isFeatured && { featured: 'true' }),
                      ...(isClearance && { clearance: 'true' }),
                      page: '1'
                    }).toString()}`}>
                      <button className="hover:text-red-200">✕</button>
                    </Link>
                  </span>
                )}

                {isFeatured && (
                  <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    ⭐ Destacados
                    <Link href={`/products?${new URLSearchParams({
                      ...(categoryFilter && { category: categoryFilter }),
                      ...(brandFilter && { brand: brandFilter }),
                      ...(searchQuery && { search: searchQuery }),
                      ...(isNew && { new: 'true' }),
                      ...(isClearance && { clearance: 'true' }),
                      page: '1'
                    }).toString()}`}>
                      <button className="hover:text-red-200">✕</button>
                    </Link>
                  </span>
                )}

                {isClearance && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    🔥 Liquidación
                    <Link href={`/products?${new URLSearchParams({
                      ...(categoryFilter && { category: categoryFilter }),
                      ...(brandFilter && { brand: brandFilter }),
                      ...(searchQuery && { search: searchQuery }),
                      ...(isNew && { new: 'true' }),
                      ...(isFeatured && { featured: 'true' }),
                      page: '1'
                    }).toString()}`}>
                      <button className="hover:text-red-200">✕</button>
                    </Link>
                  </span>
                )}

                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm underline"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            )}

            <p className="text-gray-600">
              {total > 0 ? (
                <>Mostrando {products.length} de {total} productos</>
              ) : (
                <>No se encontraron productos con los filtros seleccionados</>
              )}
              {totalPages > 1 && <> (Página {currentPage} de {totalPages})</>}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">Cargando productos...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <ProductGrid products={products} />
              <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/products" />
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg mb-4">📦 No hay productos disponibles con estos filtros</p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Ver todos los productos
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 mt-4">Cargando...</p>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}