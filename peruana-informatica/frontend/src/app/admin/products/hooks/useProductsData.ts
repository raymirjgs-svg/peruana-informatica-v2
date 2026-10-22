"use client";

import React, { useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/adminAuth";
import type { Product, ProductsResponse } from "../types";
import apiClient from "@/utils/api";

export function useProductsData() {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const [search, setSearch] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>(undefined);
  const [filterBrandId, setFilterBrandId] = useState<number | undefined>(undefined);
  const [filterStock, setFilterStock] = useState<string>(""); // "all", "low", "out", "available"
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const reloadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search.trim()) params.set('search', search.trim());
      if (codeFilter.trim()) params.set('codigo', codeFilter.trim());
      if (filterCategoryId) params.set('category', String(filterCategoryId));
      if (filterBrandId) params.set('brand', String(filterBrandId));
      if (filterStock) params.set('stock_filter', filterStock);
      if (sortBy) params.set('sort', sortBy);
      if (sortOrder) params.set('order', sortOrder);
      const endpoint = `/api/admin/products?${params.toString()}`;
      const json = await apiClient.request<ProductsResponse>(endpoint, { headers: { ...getAdminAuthHeaders() } });
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data || data.products.length === 0) return;
    const headers = ['ID', 'Código', 'Nombre', 'Precio', 'Stock', 'Categoría', 'Marca', 'Estado'];
    const rows = data.products.map(p => [
      p.id,
      (p as any).codigo_interno || '',
      p.name,
      Number(p.price).toFixed(2),
      p.stock,
      p.productCategory?.name || '',
      p.productBrand?.name || '',
      p.is_active ? 'Activo' : 'Inactivo'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `productos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const syncAllWithERP = async () => {
    if (!confirm('¿Sincronizar precios y stock de TODOS los productos con el ERP? Esto puede tomar varios minutos.')) return;
    setSyncingAll(true);
    try {
      const json = await apiClient.request<{ updated?: number }>(
        '/api/admin/products/sync-all',
        { method: 'POST', headers: { ...getAdminAuthHeaders() } }
      );
      showToast(`Sincronización completada: ${json.updated || 0} productos actualizados`, 'success');
      await reloadProducts();
    } catch (err: any) {
      showToast(err.message || 'Error al sincronizar', 'error');
    } finally {
      setSyncingAll(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setError(null);
      try {
        await reloadProducts();
        // Cargar categorías y marcas desde admin
        const [cats, brs] = await Promise.all([
          apiClient.request<Array<{ id: number; name: string }>>('/api/admin/categories', { headers: { ...getAdminAuthHeaders() } }),
          apiClient.request<Array<{ id: number; name: string }>>('/api/admin/brands', { headers: { ...getAdminAuthHeaders() } })
        ]);
        setCategories(cats.map(c => ({ id: c.id, name: c.name })));
        setBrands(brs.map(b => ({ id: b.id, name: b.name })));
      } catch (err: any) {
        // ya se maneja en loaders individuales
      }
    };
    bootstrap();
  }, []);

  const applyFilters = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await reloadProducts();
  };

  const clearFilters = async () => {
    setSearch("");
    setCodeFilter("");
    setFilterCategoryId(undefined);
    setFilterBrandId(undefined);
    setFilterStock("");
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
    await reloadProducts();
  };

  const goToPage = async (newPage: number) => {
    if (!data) return;
    const totalPages = data.totalPages || 1;
    const target = Math.min(Math.max(1, newPage), totalPages);
    if (target === page) return;
    setPage(target);
    await reloadProducts();
  };

  const onDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setError(null);
    try {
      setDeletingId(id);
      await apiClient.request(`/api/admin/products/${id}`, { method: 'DELETE', headers: { ...getAdminAuthHeaders() } });
      await reloadProducts();
      showToast('Producto eliminado');
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar producto');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (id: number) => {
    try {
      const json = await apiClient.request<{ message?: string }>(`/api/admin/products/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { ...getAdminAuthHeaders() },
      });
      await reloadProducts();
      showToast(json.message || 'Estado actualizado');
    } catch (err: any) {
      showToast(err?.message || 'Error al cambiar estado', 'error');
    }
  };

  // Función para seleccionar/deseleccionar un producto
  const toggleProductSelection = (id: number) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  // Seleccionar/deseleccionar todos los productos visibles
  const toggleSelectAll = () => {
    if (!data) return;
    const allIds = data.products.map(p => p.id);
    if (selectedProducts.length === allIds.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(allIds);
    }
  };

  return {
    data,
    loading,
    error,
    setError,
    categories,
    brands,
    toast,
    showToast,
    search,
    setSearch,
    codeFilter,
    setCodeFilter,
    filterCategoryId,
    setFilterCategoryId,
    filterBrandId,
    setFilterBrandId,
    filterStock,
    setFilterStock,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    page,
    setPage,
    limit,
    setLimit,
    previewProduct,
    setPreviewProduct,
    syncingAll,
    reloadProducts,
    exportToCSV,
    syncAllWithERP,
    applyFilters,
    clearFilters,
    goToPage,
    onDelete,
    deletingId,
    toggleActive,
    selectedProducts,
    setSelectedProducts,
    toggleProductSelection,
    toggleSelectAll,
  };
}
