"use client";

import React from "react";
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/admin/Button';

import type { useProductsData } from '../hooks/useProductsData';
import type { useProductsForms } from '../hooks/useProductsForms';

type Data = ReturnType<typeof useProductsData>;
type Forms = ReturnType<typeof useProductsForms>;

export function CreateProductModal({ controller, forms }: { controller: Data; forms: Forms }) {
  const { categories, brands, error } = controller;
  const {
    showCreateModal, resetCreateModal,
    createStep, setCreateStep,
    form, setForm, searchCode, setSearchCode,
    searchingCode, searchError, handleSearchCode,
    additionalImages, setAdditionalImages, uploadingImage, setUploadingImage, handleFileUpload,
    subcategories, loadingSubcategories,
    creating, onCreate,
  } = forms;


  return (
        <Modal isOpen={showCreateModal} onClose={resetCreateModal} title="Crear Nuevo Producto" size="lg">
          {createStep === 'search' ? (
            <div className="space-y-6 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ingrese Código Interno del Producto</label>
                <form onSubmit={handleSearchCode}>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 20363"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      autoFocus
                    />
                    <Button type="submit" isLoading={searchingCode}>Buscar</Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">El sistema buscará el producto en el sistema de ventas para cargar sus datos.</p>
                </form>

                <div className="mt-4 pt-4 border-t flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, codigo_interno: '', erp_name: '' }));
                      setCreateStep('form');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    O crear manualmente sin código ERP
                  </button>
                </div>

                {searchError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    {searchError}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={onCreate} className="space-y-4">
              {/* Info del ERP si viene de búsqueda */}
              {form.codigo_interno && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Código Interno</span>
                      <span className="font-mono font-bold text-gray-800">{form.codigo_interno}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Nombre ERP</span>
                      <span className="font-mono font-bold text-gray-800">{form.erp_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Precio (ERP)</span>
                      <span className="font-mono font-bold text-gray-800">S/. {form.price}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Stock (ERP)</span>
                      <span className="font-mono font-bold text-gray-800">{form.stock}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso si es creación manual */}
              {!form.codigo_interno && (
                <div className="bg-amber-50 p-4 rounded-lg mb-4 border border-amber-200">
                  <p className="text-amber-800 text-sm">
                    <strong>📝 Modo Manual:</strong> Ingresa todos los datos del producto. Puedes agregar un código interno opcional para referencia.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Código interno (editable solo en modo manual) */}
                {!form.erp_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno (opcional)</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: SKU-001"
                      value={form.codigo_interno}
                      onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })}
                    />
                  </div>
                )}

                <div className={form.erp_name ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  <p className="text-xs text-gray-500 mt-1">Nombre visible en la tienda online</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                  <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>

                {/* Precio y Stock - editables si es manual, readonly si viene del ERP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio (S/.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    readOnly={!!form.erp_name}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    readOnly={!!form.erp_name}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.category_id ?? ''} onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : undefined, subcategory_ids: [] })}>
                    <option value="">-- Seleccionar --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {form.category_id && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategorías</label>
                    {loadingSubcategories ? (
                      <div className="text-sm text-gray-500">Cargando subcategorías...</div>
                    ) : subcategories.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border p-3 rounded-lg max-h-40 overflow-y-auto">
                        {subcategories.map(sub => (
                          <label key={sub.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={form.subcategory_ids.includes(sub.id)}
                              onChange={(e) => {
                                const newIds = e.target.checked
                                  ? [...form.subcategory_ids, sub.id]
                                  : form.subcategory_ids.filter(id => id !== sub.id);
                                setForm({ ...form, subcategory_ids: newIds });
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {sub.name}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No hay subcategorías disponibles</div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.brand_id ?? ''} onChange={(e) => setForm({ ...form, brand_id: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">-- Seleccionar --</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagen Principal</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://..."
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadingImage(true);
                            const url = await handleFileUpload(e.target.files[0]);
                            setUploadingImage(false);
                            if (url) setForm({ ...form, image: url });
                          }
                        }}
                      />
                      <Button type="button" variant="secondary" isLoading={uploadingImage}>📂 Subir</Button>
                    </div>
                  </div>
                  {form.image && (
                    <div className="mt-2">
                      <img src={form.image} alt="Preview" className="h-20 w-20 object-cover rounded border" onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=Error'} />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes Adicionales</label>
                  <div className="space-y-2">
                    {additionalImages.map((url, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://..."
                          value={url}
                          onChange={(e) => {
                            const newImages = [...additionalImages];
                            newImages[idx] = e.target.value;
                            setAdditionalImages(newImages);
                          }}
                        />
                        {url && <img src={url} alt="Mini" className="h-8 w-8 object-cover rounded border" />}
                        <Button type="button" variant="danger" size="sm" onClick={() => {
                          const newImages = additionalImages.filter((_, i) => i !== idx);
                          setAdditionalImages(newImages);
                        }}>🗑️</Button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => setAdditionalImages([...additionalImages, ""])}>
                        + Agregar URL
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setUploadingImage(true);
                              const newUrls = [];
                              for (let i = 0; i < e.target.files.length; i++) {
                                const selectedFile = e.target.files[i];
                                if (!selectedFile) continue;
                                const url = await handleFileUpload(selectedFile);
                                if (url) newUrls.push(url);
                              }
                              setAdditionalImages([...additionalImages, ...newUrls]);
                              setUploadingImage(false);
                            }
                          }}
                        />
                        <Button type="button" variant="secondary" size="sm" isLoading={uploadingImage}>📂 Subir Archivos</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="separa por comas" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta title (≤160)</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" maxLength={160} value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta description (≤300)</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" maxLength={300} value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
                </div>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setCreateStep('search')}>Atrás</Button>
                <Button type="submit" isLoading={creating}>Crear Producto</Button>
              </div>
            </form>
          )}
        </Modal>
  );
}
