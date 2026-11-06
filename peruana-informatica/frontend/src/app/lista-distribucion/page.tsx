// src/app/lista-distribucion/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/common/Navigation';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { Eye, X, ChevronUp, ChevronDown, Package, Filter } from 'lucide-react';
import Image from 'next/image';

export default function ListaDistribucionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'price' | 'stock'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset page on search change
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const productService = new ProductService();
        let result;

        if (debouncedSearchTerm) {
          const queryParams = new URLSearchParams({
            page: currentPage.toString(),
            limit: '100',
            search: debouncedSearchTerm
          });
          result = await productService.getProductsWithFilters(queryParams.toString());
        } else {
          result = await productService.getProducts(currentPage, 100);
        }

        setProducts(result.products);
        setTotalPages(result.totalPages);
        setTotalProducts(result.total);

        // Actualizar categorías y marcas basado en los productos cargados
        if (currentPage === 1 && !debouncedSearchTerm) {
          if (categories.length === 0) {
            const uniqueCategories = Array.from(
              new Set(result.products.map((p: Product) => p.category).filter(Boolean))
            ) as string[];
            setCategories(uniqueCategories.sort());
          }
          if (brands.length === 0) {
            const uniqueBrands = Array.from(
              new Set(result.products.map((p: Product) => p.brand).filter(Boolean))
            ) as string[];
            setBrands(uniqueBrands.sort());
          }
        }

      } catch (err) {
        console.error('Error loading products:', err);
        setError('Error al cargar los productos. Por favor, intenta de nuevo.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, debouncedSearchTerm]);

  // Filtrar productos localmente
  const filteredProducts = products
    .filter(product => {
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesBrand = brandFilter === 'all' || product.brand === brandFilter;
      const matchesStock = stockFilter === 'all'
        || (stockFilter === 'available' && product.stock > 0)
        || (stockFilter === 'low' && product.stock > 0 && product.stock <= 10)
        || (stockFilter === 'out' && product.stock === 0);
      return matchesCategory && matchesBrand && matchesStock;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'price') {
        comparison = Number(a.price) - Number(b.price);
      } else if (sortField === 'stock') {
        comparison = a.stock - b.stock;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Función para cambiar ordenamiento
  const handleSort = (field: 'name' | 'price' | 'stock') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Obtener imagen del producto
  const getProductImage = (product: Product) => {
    const p = product as any;
    // Current API base URL from env or default
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Remove /api if present for image base
    const baseUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

    // Helper to clean and build URL
    const buildImageUrl = (img: string) => {
      if (!img) return null;
      if (img.includes('placeholder')) return null;

      // If it's already a full URL
      if (img.startsWith('http')) {
        // Fix hardcoded internal IPs that are not accessible
        if (img.includes('192.168.1.122') || img.includes('localhost:3001')) {
          try {
            const urlObj = new URL(img);
            return `${baseUrl}${urlObj.pathname}`;
          } catch (e) {
            return `${baseUrl}/images/products/${img.split('/').pop()}`;
          }
        }
        return img;
      }

      // Handle relative paths - just get the filename
      const filename = img.split('/').pop() || img;

      // Product images are stored in /images/products/
      return `${baseUrl}/images/products/${filename}`;
    };

    // Priority: images array > image field
    if (p.images && p.images.length > 0) {
      const firstImage = p.images[0].imagen || p.images[0].url || p.images[0].image;
      return buildImageUrl(firstImage);
    }

    if (p.image) return buildImageUrl(p.image);

    return null;
  };

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Función para exportar a CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Nombre', 'Categoría', 'Precio', 'Stock'];
    const rows = filteredProducts.map(p => [
      p.id,
      p.name,
      p.category || 'Sin categoría',
      Number(p.price).toFixed(2),
      p.stock
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lista_distribucion_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Función para imprimir
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Navigation />
      <div className="w-full max-w-[95%] mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-black-800 mb-2">📋 Lista de Distribución</h1>
            <p className="text-sm md:text-base text-brand-gray-600">
              Gestión de inventario y precios en tiempo real
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 print:hidden">
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2 shadow-sm text-sm md:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-brand-red-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-brand-red-700 hover:shadow-brand-red transition font-medium flex items-center gap-2 shadow-sm text-sm md:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Imprimir</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 animate-fadeIn">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium text-sm md:text-base">{error}</p>
            </div>
          </div>
        )}

        {/* Botón de Filtros Mobile */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden w-full bg-brand-slate-800 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 mb-4 hover:bg-brand-slate-700 transition"
        >
          <Filter className="w-5 h-5" />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>

        {/* Filtros */}
        <div className={`bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 mb-6 print:hidden ${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre, código..."
                className="w-full px-4 py-2 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Categoría
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 focus:bg-white transition-all"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Marca
              </label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full px-4 py-2 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 focus:bg-white transition-all"
              >
                <option value="all">Todas las marcas</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Estado
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-4 py-2 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 focus:bg-white transition-all"
              >
                <option value="all">Todos los estados</option>
                <option value="available">En Stock</option>
                <option value="low">Stock Bajo</option>
                <option value="out">Agotado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de productos (Desktop) */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-600"></div>
          </div>
        ) : (
          <>
            {/* Vista Desktop - Tabla */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-brand-slate-900 border-b border-brand-slate-700">
                      <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-24 print:hidden">Img</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">SKU</th>
                      <th
                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:text-brand-red-400 transition"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Producto
                          {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Info</th>
                      <th
                        className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:text-brand-red-400 transition"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Precio
                          {sortField === 'price' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:text-brand-red-400 transition"
                        onClick={() => handleSort('stock')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Stock
                          {sortField === 'stock' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider print:hidden">Ver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product, index) => {
                        const imgUrl = getProductImage(product);
                        const hasSpecialPrice = (product as any).priceCot > 0;
                        return (
                          <tr
                            key={product.id}
                            className={`hover:bg-brand-red-50/30 transition group/row ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                          >
                            <td className="px-6 py-4 print:hidden">
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center group-hover/row:scale-110 transition-transform duration-300 shadow-sm">
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`absolute inset-0 flex items-center justify-center bg-gray-50 ${imgUrl ? 'hidden' : ''}`}>
                                  <Package className="w-6 h-6 text-gray-300" />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                              {product.codigo_interno || product.id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 line-clamp-2 leading-relaxed">
                                {product.name}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full w-fit">
                                  {product.category || 'General'}
                                </span>
                                {product.brand && (
                                  <span className="text-xs text-gray-400">
                                    {product.brand}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-bold text-gray-900">
                                  S/ {Number((product as any).priceCot || (product as any).priceWeb || product.price || 0).toFixed(2)}
                                </span>
                                {hasSpecialPrice && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 border border-green-200">
                                    Oferta
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${product.stock > 10
                                ? 'bg-green-50 text-green-700'
                                : product.stock > 0
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-red-50 text-red-700'
                                }`}>
                                {product.stock} u.
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center print:hidden">
                              <button
                                onClick={() => setSelectedProduct(product)}
                                className="p-2 rounded-full hover:bg-white hover:shadow-md text-gray-400 hover:text-brand-red-600 transition border border-transparent hover:border-gray-100"
                                title="Ver detalles"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-gray-50 rounded-full">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                            <p>No se encontraron productos con los filtros seleccionados</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vista Mobile - Cards */}
            <div className="md:hidden space-y-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const imgUrl = getProductImage(product);
                  const hasSpecialPrice = (product as any).priceCot > 0;
                  return (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4">
                        <div className="flex gap-4">
                          {/* Imagen */}
                          <div className="flex-shrink-0">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={product.name}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`absolute inset-0 flex items-center justify-center bg-gray-50 ${imgUrl ? 'hidden' : ''}`}>
                                <Package className="w-6 h-6 text-gray-300" />
                              </div>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-brand-black-800 line-clamp-2 mb-1">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono mb-2">
                              SKU: {product.codigo_interno || product.id}
                            </p>

                            {/* Categoría y Marca */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {product.category || 'General'}
                              </span>
                              {product.brand && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                  {product.brand}
                                </span>
                              )}
                            </div>

                            {/* Precio y Stock */}
                            <div className="flex items-center justify-between mt-2">
                              <div>
                                <div className="text-lg font-bold text-brand-black-800">
                                  S/ {Number((product as any).priceCot || (product as any).priceWeb || product.price || 0).toFixed(2)}
                                </div>
                                {hasSpecialPrice && (
                                  <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                    Oferta
                                  </span>
                                )}
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${product.stock > 10
                                ? 'bg-green-50 text-green-700'
                                : product.stock > 0
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-red-50 text-red-700'
                                }`}>
                                {product.stock} u.
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botón Ver */}
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="w-full mt-3 bg-brand-red-600 text-white py-2 rounded-lg font-medium hover:bg-brand-red-700 transition text-sm flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-xl p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-gray-50 rounded-full">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No se encontraron productos</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Controles de paginación */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:space-x-4 mt-6 print:hidden">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition text-sm ${currentPage === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-brand-red-600 text-white hover:bg-brand-red-700 hover:shadow-brand-red'
                }`}
            >
              ← Anterior
            </button>

            <div className="flex space-x-2 overflow-x-auto">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg font-medium transition text-sm ${currentPage === pageNum
                      ? 'bg-brand-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition text-sm ${currentPage === totalPages
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-brand-red-600 text-white hover:bg-brand-red-700 hover:shadow-brand-red'
                }`}
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* Resumen */}
        <div className="mt-6 bg-brand-slate-50 p-4 md:p-6 rounded-lg print:hidden">
          <h3 className="font-bold text-base md:text-lg mb-3">📊 Resumen</h3>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total</p>
              <p className="text-lg md:text-2xl font-bold text-brand-red-600">{filteredProducts.length}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Disponibles</p>
              <p className="text-lg md:text-2xl font-bold text-green-600">
                {filteredProducts.filter(p => p.stock > 0).length}
              </p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Agotados</p>
              <p className="text-lg md:text-2xl font-bold text-red-600">
                {filteredProducts.filter(p => p.stock === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalles del producto */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 md:px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Detalles del Producto</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Imagen */}
                <div className="w-full md:w-1/3">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center p-4">
                    {getProductImage(selectedProduct) ? (
                      <img
                        src={getProductImage(selectedProduct)!}
                        alt={selectedProduct.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Package className="w-20 h-20 text-gray-300" />
                    )}
                  </div>
                </div>
                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 font-mono">
                      Código: {selectedProduct.codigo_interno || selectedProduct.id}
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                      {selectedProduct.name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-2xl md:text-3xl font-bold text-brand-red-600">
                      S/ {Number((selectedProduct as any).priceCot || (selectedProduct as any).priceWeb || selectedProduct.price || 0).toFixed(2)}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedProduct.stock > 10 ? 'bg-green-100 text-green-800' :
                      selectedProduct.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {selectedProduct.stock > 0 ? `${selectedProduct.stock} en stock` : 'Agotado'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Categoría</p>
                      <p className="font-medium text-gray-900">{selectedProduct.category || 'Sin categoría'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Marca</p>
                      <p className="font-medium text-gray-900">
                        {selectedProduct.brand || 'Sin marca'}
                      </p>
                    </div>
                  </div>

                  {selectedProduct.description && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-gray-500 uppercase mb-2">Descripción</p>
                      <p className="text-sm text-gray-700 line-clamp-4">
                        {selectedProduct.description.replace(/<[^>]*>?/gm, '')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              >
                Cerrar
              </button>
              <a
                href={`/productos/${selectedProduct.slug || selectedProduct.id}`}
                target="_blank"
                className="w-full sm:w-auto px-4 py-2 bg-brand-red-600 hover:bg-brand-red-700 hover:shadow-brand-red text-white rounded-lg font-medium transition text-center"
              >
                Ver en tienda
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          nav, .print\\:hidden {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </>
  );
}
