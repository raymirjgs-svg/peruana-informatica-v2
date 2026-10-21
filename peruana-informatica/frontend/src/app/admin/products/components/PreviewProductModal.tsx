"use client";

import React from "react";
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/admin/Button';
import { getProductImageUrl } from '../utils';

import type { useProductsData } from '../hooks/useProductsData';
import type { useProductsForms } from '../hooks/useProductsForms';

type Data = ReturnType<typeof useProductsData>;
type Forms = ReturnType<typeof useProductsForms>;

export function PreviewProductModal({ controller, forms }: { controller: Data; forms: Forms }) {
  const { previewProduct, setPreviewProduct } = controller;
  const { startEdit, duplicateProduct } = forms;


  return (
        <Modal isOpen={!!previewProduct} onClose={() => setPreviewProduct(null)} title="Vista Previa del Producto" size="lg">
          {previewProduct && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {getProductImageUrl(previewProduct) ? (
                  <img src={getProductImageUrl(previewProduct)!} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">📦</div>
                )}
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">{previewProduct.name}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Código:</span> <span className="font-medium">{(previewProduct as any).codigo_interno || '-'}</span></div>
                  <div><span className="text-gray-500">Precio:</span> <span className="font-bold text-blue-600">S/. {Number(previewProduct.price).toLocaleString()}</span></div>
                  <div><span className="text-gray-500">Stock:</span> <span className={`font-medium ${previewProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>{previewProduct.stock}</span></div>
                  <div><span className="text-gray-500">Estado:</span> <span className={previewProduct.is_active ? 'text-green-600' : 'text-gray-500'}>{previewProduct.is_active ? 'Activo' : 'Inactivo'}</span></div>
                  <div><span className="text-gray-500">Categoría:</span> <span className="font-medium">{previewProduct.productCategory?.name || '-'}</span></div>
                  <div><span className="text-gray-500">Marca:</span> <span className="font-medium">{previewProduct.productBrand?.name || '-'}</span></div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => { startEdit(previewProduct); setPreviewProduct(null); }}>✏️ Editar</Button>
                  <Button variant="secondary" onClick={() => { duplicateProduct(previewProduct); setPreviewProduct(null); }}>📋 Duplicar</Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
  );
}
