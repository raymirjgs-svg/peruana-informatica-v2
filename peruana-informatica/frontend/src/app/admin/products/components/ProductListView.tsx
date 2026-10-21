"use client";

import React from "react";
import { Button } from '@/components/admin/Button';
import { getProductImageUrl } from '../utils';

import type { useProductsData } from '../hooks/useProductsData';
import type { useProductsForms } from '../hooks/useProductsForms';

type Data = ReturnType<typeof useProductsData>;
type Forms = ReturnType<typeof useProductsForms>;

export function ProductListView({ controller, forms }: { controller: Data; forms: Forms }) {
  const {
    data, selectedProducts, toggleProductSelection,
    setPreviewProduct, deletingId, toggleActive, onDelete,
  } = controller;
  const { duplicateProduct, startEdit } = forms;

  if (!data) return null;


  return (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {data.products.map((p) => {
                  const imgUrl = getProductImageUrl(p);
                  return (
                    <div key={`product-${p.slug}-${p.id}`} className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      {/* Checkbox */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p.id)}
                          onChange={() => toggleProductSelection(p.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                        />
                        {/* Miniatura */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {imgUrl ? (
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">📦</div>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <div className="font-semibold text-gray-800 text-sm line-clamp-1">{p.name}</div>
                        <div className="text-xs text-gray-500">{(p as any).codigo_interno || p.slug}</div>
                      </div>
                      <div className="text-sm font-medium">S/. {Number(p.price).toLocaleString()}</div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.stock > 10 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {p.stock}
                        </span>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.is_active ? '✓' : '○'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 truncate">{p.productCategory?.name || '-'}</div>
                      <div className="text-xs text-gray-600 truncate">{p.productBrand?.name || '-'}</div>
                      <div className="md:col-span-3 flex gap-1 justify-end flex-wrap">
                        <Button size="sm" variant="secondary" onClick={() => setPreviewProduct(p)} title="Vista previa">👁</Button>
                        <Button size="sm" variant="secondary" onClick={() => duplicateProduct(p)} title="Duplicar">📋</Button>
                        <Button size="sm" variant={p.is_active ? "secondary" : "success"} onClick={() => toggleActive(p.id)} title={p.is_active ? 'Desactivar' : 'Activar'}>
                          {p.is_active ? '🔒' : '✓'}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => startEdit(p)}>✏️</Button>
                        <Button size="sm" variant="danger" onClick={() => onDelete(p.id)} isLoading={deletingId === p.id}>🗑️</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
  );
}
