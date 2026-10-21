"use client";

import React from "react";

import type { useProductsData } from '../hooks/useProductsData';

type Data = ReturnType<typeof useProductsData>;

export function ProductsPagination({ controller }: { controller: Data }) {
  const { data, page, limit, loading, goToPage, setLimit, setPage, reloadProducts } = controller;

  if (!data) return null;


  return (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Total: {data.total} • Página {page} de {data.totalPages}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border rounded disabled:opacity-60" disabled={page <= 1 || loading} onClick={() => goToPage(page - 1)}>Anterior</button>
              <select className="px-2 py-1 border rounded" value={page} onChange={(e) => goToPage(Number(e.target.value))}>
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button className="px-3 py-1 border rounded disabled:opacity-60" disabled={page >= data.totalPages || loading} onClick={() => goToPage(page + 1)}>Siguiente</button>
              <select className="px-2 py-1 border rounded" value={limit} onChange={async (e) => { setLimit(Number(e.target.value)); setPage(1); await reloadProducts(); }}>
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/página</option>)}
              </select>
            </div>
          </div>
  );
}
