"use client";

import React from "react";
import { Button } from '@/components/admin/Button';

import type { useProductsData } from '../hooks/useProductsData';

type Data = ReturnType<typeof useProductsData>;

export function BulkActionsBar({ controller, onOpenBulk }: { controller: Data; onOpenBulk: () => void }) {
  const { data, selectedProducts, toggleSelectAll } = controller;

  if (!data) return null;


  return (
          <div className="mb-4 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedProducts.length === data.products.length && data.products.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedProducts.length > 0
                  ? `${selectedProducts.length} producto(s) seleccionado(s)`
                  : 'Seleccionar todos'}
              </span>
            </div>
            {selectedProducts.length > 0 && (
              <Button onClick={onOpenBulk} size="sm">
                Acciones en Bloque
              </Button>
            )}
          </div>
  );
}
