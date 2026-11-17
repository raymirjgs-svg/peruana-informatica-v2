"use client";

import React from "react";

import type { useProductsData } from '../hooks/useProductsData';

type Data = ReturnType<typeof useProductsData>;

export function ProductsFilters({ controller }: { controller: Data }) {
  const {
    codeFilter, setCodeFilter,
    search, setSearch,
    filterCategoryId, setFilterCategoryId,
    filterBrandId, setFilterBrandId,
    filterStock, setFilterStock,
    categories, brands, loading,
    applyFilters, clearFilters,
    viewMode, setViewMode,
  } = controller;


  return (
        <form onSubmit={applyFilters} className="mb-4 border rounded-lg p-4 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input className="w-full border rounded px-3 py-2" placeholder="Código interno" value={codeFilter} onChange={(e) => setCodeFilter(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input className="w-full border rounded px-3 py-2" placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select className="w-full border rounded px-3 py-2" value={filterCategoryId ?? ''} onChange={(e) => setFilterCategoryId(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">-- Todas --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <select className="w-full border rounded px-3 py-2" value={filterBrandId ?? ''} onChange={(e) => setFilterBrandId(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">-- Todas --</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <select className="w-full border rounded px-3 py-2" value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
                <option value="">-- Todos --</option>
                <option value="available">✓ Disponible (&gt;0)</option>
                <option value="low">⚠ Bajo (&lt;=10)</option>
                <option value="out">✕ Agotado (0)</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60" disabled={loading}>
                🔍 Buscar
              </button>
              <button type="button" onClick={clearFilters} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={loading}>
                Limpiar
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Vista:</span>
              <button type="button" onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`} title="Lista">
                ☰
              </button>
              <button type="button" onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`} title="Cuadrícula">
                ⊞
              </button>
            </div>
          </div>
        </form>
  );
}
