"use client";

import React from "react";
import { Button } from '@/components/admin/Button';
import { Package } from 'lucide-react';
import { getProductImageUrl } from '../utils';

import type { useProductsData } from '../hooks/useProductsData';
import type { useProductsForms } from '../hooks/useProductsForms';

type Data = ReturnType<typeof useProductsData>;
type Forms = ReturnType<typeof useProductsForms>;

export function ProductGridView({ controller, forms }: { controller: Data; forms: Forms }) {
  const {
    data, selectedProducts, toggleProductSelection,
    setPreviewProduct, deletingId, onDelete,
  } = controller;
  const { startEdit } = forms;

  if (!data) return null;


  return (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.products.map((p) => {
                  const imgUrl = getProductImageUrl(p);
                  return (
                    <div key={`product-grid-${p.id}`} className="dark:bg-gray-900 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p.id)}
                          onChange={() => toggleProductSelection(p.id)}
                          className="absolute top-2 left-2 w-4 h-4 text-blue-600 rounded dark:border-gray-700 cursor-pointer z-10"
                        />
                        <div className="aspect-square dark:bg-gray-800">
                          {imgUrl ? (
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400 dark:text-gray-400" />
                          )}
                        </div>
                        <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${p.stock > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {p.stock}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-sm dark:text-gray-100 line-clamp-2 h-10">{p.name}</div>
                        <div className="text-xs dark:text-gray-400 mt-1">{p.codigo_interno || '-'}</div>
                        <div className="text-lg font-bold text-blue-600 mt-2">S/. {Number(p.price).toLocaleString()}</div>
                        <div className="flex gap-1 mt-3">
                          <Button size="sm" variant="secondary" onClick={() => setPreviewProduct(p)} className="flex-1">👁</Button>
                          <Button size="sm" variant="secondary" onClick={() => startEdit(p)} className="flex-1">✏️</Button>
                          <Button size="sm" variant="danger" onClick={() => onDelete(p.id)} isLoading={deletingId === p.id}>🗑️</Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
  );
}
