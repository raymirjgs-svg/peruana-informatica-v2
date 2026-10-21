"use client";

import React from "react";
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/admin/Button';

import type { useProductsData } from '../hooks/useProductsData';
import type { useProductsForms } from '../hooks/useProductsForms';

type Data = ReturnType<typeof useProductsData>;
type Forms = ReturnType<typeof useProductsForms>;

export function BulkEditModal({ controller, forms }: { controller: Data; forms: Forms }) {
  const { selectedProducts, categories, brands } = controller;
  const {
    showBulkPanel, setShowBulkPanel,
    bulkCategory, setBulkCategory,
    bulkSubcategories, setBulkSubcategories,
    bulkSubcategoryOptions, loadingBulkSubcategories,
    bulkBrand, setBulkBrand,
    bulkComponentType, setBulkComponentType,
    bulkSocketType, setBulkSocketType,
    bulkRamType, setBulkRamType,
    bulkFormFactor, setBulkFormFactor,
    applyingBulk, applyBulkUpdate,
  } = forms;


  return (
        <Modal isOpen={showBulkPanel} onClose={() => setShowBulkPanel(false)} title="Actualización en Bloque" size="md">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Aplicar cambios a <span className="font-bold text-blue-600">{selectedProducts.length}</span> producto(s) seleccionado(s)
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={bulkCategory ?? ''}
                onChange={(e) => setBulkCategory(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- Sin cambios --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Subcategorías - solo visible cuando hay categoría seleccionada */}
            {bulkCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategorías
                  {bulkSubcategories.length > 0 && (
                    <span className="ml-2 text-blue-600">({bulkSubcategories.length} seleccionadas)</span>
                  )}
                </label>
                {loadingBulkSubcategories ? (
                  <div className="text-sm text-gray-500 py-2">Cargando subcategorías...</div>
                ) : bulkSubcategoryOptions.length > 0 ? (
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      {bulkSubcategoryOptions.map(sub => (
                        <label key={sub.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-2 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={bulkSubcategories.includes(sub.id)}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...bulkSubcategories, sub.id]
                                : bulkSubcategories.filter(id => id !== sub.id);
                              setBulkSubcategories(newIds);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                    {bulkSubcategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setBulkSubcategories([])}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 py-2 italic">No hay subcategorías para esta categoría</div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={bulkBrand ?? ''}
                onChange={(e) => setBulkBrand(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- Sin cambios --</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Componente (Cotizador)</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={bulkComponentType ?? ''}
                onChange={(e) => setBulkComponentType(e.target.value || undefined)}
              >
                <option value="">-- Sin cambios --</option>
                <option value="motherboard">Placa Madre</option>
                <option value="processor">Procesador</option>
                <option value="ram">Memoria RAM</option>
                <option value="storage">Almacenamiento</option>
                <option value="gpu">Tarjeta de Video</option>
                <option value="case">Gabinete (Case)</option>
                <option value="power_supply">Fuente de Poder</option>
                <option value="monitor">Monitor</option>
                <option value="keyboard">Teclado</option>
                <option value="mouse">Mouse</option>
                <option value="headset">Audífonos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Socket Type</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ej: LGA1700, AM5, AM4"
                value={bulkSocketType ?? ''}
                onChange={(e) => setBulkSocketType(e.target.value || undefined)}
              />
              <p className="text-xs text-gray-500 mt-1">Para placas madre y procesadores</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RAM Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={bulkRamType ?? ''}
                onChange={(e) => setBulkRamType(e.target.value || undefined)}
              >
                <option value="">-- Sin cambios --</option>
                <option value="DDR4">DDR4</option>
                <option value="DDR5">DDR5</option>
                <option value="DDR3">DDR3</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Para placas madre y memorias RAM</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Factor</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={bulkFormFactor ?? ''}
                onChange={(e) => setBulkFormFactor(e.target.value || undefined)}
              >
                <option value="">-- Sin cambios --</option>
                <option value="ATX">ATX</option>
                <option value="M-ATX">Micro-ATX (M-ATX)</option>
                <option value="Mini-ITX">Mini-ITX</option>
                <option value="E-ATX">E-ATX</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Para placas madre y gabinetes</p>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => setShowBulkPanel(false)}>
                Cancelar
              </Button>
              <Button onClick={applyBulkUpdate} isLoading={applyingBulk}>
                Aplicar a {selectedProducts.length} producto(s)
              </Button>
            </div>
          </div>

        </Modal>
  );
}
