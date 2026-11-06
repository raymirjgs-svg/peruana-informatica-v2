'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MotionWrapper } from '@/components/ui/MotionWrapper';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { Package, AlertTriangle, TrendingDown, Search, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  cod_producto: string;
  name: string;
  stock: number;
  price: number;
  productBrand?: { name: string };
  productCategory?: { name: string };
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const headers: HeadersInit = {};

        const token = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/api/admin/products`, { headers });

        if (!response.ok) throw new Error('Failed to fetch inventory');

        const result = await response.json();
        setProducts(result.products || []);
      } catch (error) {
        toast.error('Error al cargar inventario');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cod_producto.includes(searchTerm);

    const matchesStock =
      filterStock === 'all' ? true :
        filterStock === 'low' ? p.stock > 0 && p.stock <= 10 :
          p.stock === 0;

    return matchesSearch && matchesStock;
  });

  // Stats
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.stock * Number(p.price || 0)), 0);

  const exportToCSV = () => {
    const headers = ['Código', 'Producto', 'Stock', 'Precio', 'Marca', 'Categoría', 'Valor Total'];
    const rows = filteredProducts.map(p => [
      p.cod_producto,
      p.name,
      p.stock,
      p.price,
      p.productBrand?.name || '',
      p.productCategory?.name || '',
      (p.stock * Number(p.price || 0)).toFixed(2)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Inventario exportado');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gestión de Inventario"
          description="Control de stock y valorización de productos"
          icon={Package}
          action={
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/30 transition-all hover:scale-105"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          }
        />

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatsCard title="Total Productos" value={totalProducts.toString()} description="En catálogo" icon={Package} color="blue" />
          <StatsCard title="Stock Bajo" value={lowStockCount.toString()} description="≤ 10 unidades" icon={AlertTriangle} color="yellow" />
          <StatsCard title="Agotados" value={outOfStockCount.toString()} description="Stock = 0" icon={TrendingDown} color="red" />
          <StatsCard title="Valor Inventario" value={`S/ ${totalValue.toFixed(0)}`} description="Valorización total" icon={Package} color="green" />
        </div>

        {/* Alerts */}
        {lowStockCount > 0 && (
          <MotionWrapper className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                ⚠️ {lowStockCount} productos con stock bajo requieren reabastecimiento
              </p>
            </div>
          </MotionWrapper>
        )}

        {/* Filters */}
        <MotionWrapper className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'low', label: 'Stock Bajo' },
                { value: 'out', label: 'Agotados' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterStock(f.value as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStock === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </MotionWrapper>

        {/* Products Table */}
        <MotionWrapper className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Código</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredProducts.map(product => (
                  <tr key={product.cod_producto} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-mono text-gray-400">{product.cod_producto}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{product.productBrand?.name} · {product.productCategory?.name}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.stock === 0 ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400' :
                        product.stock <= 10 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' :
                        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.stock === 0 ? 'bg-red-500' : product.stock <= 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-gray-700 dark:text-gray-300">
                      S/ {Number(product.price || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-bold text-gray-900 dark:text-white">
                      S/ {(product.stock * Number(product.price || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-3" />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        </MotionWrapper>
      </div>
    </AdminLayout>
  );
}
