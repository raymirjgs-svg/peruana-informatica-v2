"use client";

import React from "react";
import { Button } from '@/components/admin/Button';

import type { useProductsData } from '../hooks/useProductsData';
import type { useProductsForms } from '../hooks/useProductsForms';

type Data = ReturnType<typeof useProductsData>;
type Forms = ReturnType<typeof useProductsForms>;

export function ProductsHeader({ controller, onNew }: { controller: Data; onNew: () => void }) {
  const { data, exportToCSV, syncingAll, syncAllWithERP } = controller;


  return (
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
            <p className="text-gray-500 mt-1">Gestiona tu inventario completo {data && `(${data.total} productos)`}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportToCSV} disabled={!data || data.products.length === 0}>
              📥 Exportar CSV
            </Button>
            <Button variant="secondary" onClick={syncAllWithERP} disabled={syncingAll}>
              {syncingAll ? '⏳ Sincronizando...' : '🔄 Sync ERP'}
            </Button>
            <Button onClick={onNew} size="lg">
              <span className="text-xl">+</span>
              Nuevo Producto
            </Button>
          </div>
        </div>
  );
}
