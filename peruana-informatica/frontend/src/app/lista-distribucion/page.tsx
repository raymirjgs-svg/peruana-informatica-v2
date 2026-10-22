// src/app/lista-distribucion/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/common/Navigation';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { FiltersToolbar } from './components/FiltersToolbar';
import { ProductList } from './components/ProductList';
import { Pagination } from './components/Pagination';
import { Summary } from './components/Summary';
import { ProductDetailModal } from './components/ProductDetailModal';

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
        <FiltersToolbar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          brandFilter={brandFilter}
          onBrandFilterChange={setBrandFilter}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          categories={categories}
          brands={brands}
          error={error}
          onExportCSV={exportToCSV}
          onPrint={handlePrint}
        />

        <ProductList
          loading={loading}
          products={filteredProducts}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onSelectProduct={setSelectedProduct}
        />

        {!loading && !error && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
          />
        )}

        <Summary products={filteredProducts} />
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
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
