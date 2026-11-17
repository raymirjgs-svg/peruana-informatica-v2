"use client";

import React from "react";
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/admin/Button';
import { ProductImageManager } from '@/components/admin/products/ProductImageManager';

import type { useProductsData } from '../hooks/useProductsData';
import type { useProductsForms } from '../hooks/useProductsForms';

type Data = ReturnType<typeof useProductsData>;
type Forms = ReturnType<typeof useProductsForms>;

export function EditProductModal({ controller, forms }: { controller: Data; forms: Forms }) {
  const { categories, brands, error } = controller;
  const {
    showEditModal, cancelEdit, editingId,
    editForm, setEditForm, updatingId, onUpdate,
  } = forms;


  return (
        <Modal isOpen={showEditModal} onClose={cancelEdit} title="Editar Producto" size="lg">
          <form onSubmit={(e) => { e.preventDefault(); if (editingId) onUpdate(editingId); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Opcional" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.category_id ?? ''} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">-- Categoría --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.brand_id ?? ''} onChange={(e) => setEditForm({ ...editForm, brand_id: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">-- Marca --</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (URL)</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://..." value={editForm.image} onChange={(e) => setEditForm({ ...editForm, image: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta title (≤160)</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" maxLength={160} value={editForm.seo_title} onChange={(e) => setEditForm({ ...editForm, seo_title: e.target.value })} />
              </div>
              <div>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" maxLength={300} value={editForm.seo_description} onChange={(e) => setEditForm({ ...editForm, seo_description: e.target.value })} />
              </div>
            </div>

            {/* Flags de Producto */}
            <div className="flex flex-wrap gap-6 p-4 bg-gray-50 rounded-lg border mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_featured}
                  onChange={e => setEditForm({ ...editForm, is_featured: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="font-medium text-gray-700">⭐ Destacado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_new}
                  onChange={e => setEditForm({ ...editForm, is_new: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded"
                />
                <span className="font-medium text-gray-700">🆕 Nuevo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_clearance}
                  onChange={e => setEditForm({ ...editForm, is_clearance: e.target.checked })}
                  className="w-5 h-5 text-red-600 rounded"
                />
                <span className="font-medium text-gray-700">🔥 Remate</span>
              </label>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {/* Product Image Manager */}
            {editingId && (
              <div className="mt-6">
                <ProductImageManager productId={editingId} />
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="secondary" onClick={cancelEdit}>Cancelar</Button>
              <Button type="submit" isLoading={updatingId !== null}>Guardar Cambios</Button>
            </div>
          </form>
        </Modal>
  );
}
