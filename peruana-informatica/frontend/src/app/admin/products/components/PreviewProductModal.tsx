"use client";

import React from "react";
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/admin/Button';
import { Package } from 'lucide-react';
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
              <div className="aspect-square dark:bg-gray-800 rounded-lg overflow-hidden">
                {getProductImageUrl(previewProduct) ? (
                  <img src={getProductImageUrl(previewProduct)!} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Package className="h-12 w-12 text-gray-400 dark:text-gray-400" />
                )}
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold dark:text-gray-100">{previewProduct.name}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="dark:text-gray-400">Código:</span> <span className="font-medium">{previewProduct.codigo_interno || '-'}</span></div>
                  <div><span className="dark:text-gray-400">Precio:</span> <span className="font-bold text-blue-600">S/. {Number(previewProduct.price).toLocaleString()}</span></div>
                  <div><span className="dark:text-gray-400">Stock:</span> <span className={`font-medium ${previewProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>{previewProduct.stock}</span></div>
                  <div><span className="dark:text-gray-400">Estado:</span> <span className={previewProduct.is_active ? 'text-green-600' : 'text-gray-600'}>{previewProduct.is_active ? 'Activo' : 'Inactivo'}</span></div>
                  <div><span className="dark:text-gray-400">Categoría:</span> <span className="font-medium">{previewProduct.productCategory?.name || '-'}</span></div>
                  <div><span className="dark:text-gray-400">Marca:</span> <span className="font-medium">{previewProduct.productBrand?.name || '-'}</span></div>
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
