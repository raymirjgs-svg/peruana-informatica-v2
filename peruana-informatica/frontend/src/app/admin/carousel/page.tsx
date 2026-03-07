"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/admin/Button';
import { adminFetch } from '@/lib/adminApi';

type Slide = {
  id: number;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  backgroundColor?: string;
  imageUrl?: string;
  isActive: boolean;
  order: number;
};

export default function AdminCarouselPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    buttonText: 'Ver más',
    buttonUrl: '/products',
    backgroundColor: 'from-blue-500 to-blue-700',
    imageUrl: '',
    isActive: true,
    order: 0,
  });
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isValidUrl = (value: string) => {
    if (!value) return true;
    // Aceptar rutas relativas que empiezan con /
    if (value.startsWith('/')) return true;
    // Aceptar URLs absolutas válidas
    try {
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await adminFetch('/admin/carousel/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Error al subir imagen');

      if (isEdit) {
        setEditForm({ ...editForm, imageUrl: json.imageUrl });
      } else {
        setForm({ ...form, imageUrl: json.imageUrl });
      }
      showToast('Imagen subida correctamente');
    } catch (err: any) {
      showToast(err?.message || 'Error al subir imagen', 'error');
    } finally {
      setUploadingImage(false);
    }
  };
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    buttonText: 'Ver más',
    buttonUrl: '/products',
    backgroundColor: 'from-blue-500 to-blue-700',
    imageUrl: '',
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminFetch('/admin/carousel');
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
        setSlides(json as Slide[]);
      } catch (err: any) {
        setError(err?.message || "Error al cargar carrusel");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/admin/carousel');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      setSlides(json as Slide[]);
    } catch (err: any) {
      setError(err?.message || "Error al cargar carrusel");
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Validaciones básicas
    if (!form.title.trim() || !form.description.trim() || !form.buttonText.trim() || !form.buttonUrl.trim()) {
      setError('Completa título, descripción, texto y URL del botón');
      return;
    }
    if (!isValidUrl(form.buttonUrl)) {
      setError('La URL del botón no es válida');
      return;
    }
    if (form.imageUrl && !isValidUrl(form.imageUrl)) {
      setError('La URL de imagen no es válida');
      return;
    }
    if (form.order < 0) {
      setError('El orden debe ser 0 o mayor');
      return;
    }
    try {
      setCreating(true);
      const res = await adminFetch('/admin/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      setForm({ title: '', description: '', buttonText: 'Ver más', buttonUrl: '/products', backgroundColor: 'from-blue-500 to-blue-700', imageUrl: '', isActive: true, order: 0 });
      setShowCreateModal(false);
      await reload();
      showToast('Slide creado');
    } catch (err: any) {
      setError(err?.message || 'Error al crear slide');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (s: Slide) => {
    setEditingId(s.id);
    setEditForm({
      title: s.title,
      description: s.description,
      buttonText: s.buttonText,
      buttonUrl: s.buttonUrl,
      backgroundColor: s.backgroundColor || 'from-blue-500 to-blue-700',
      imageUrl: s.imageUrl || '',
      isActive: s.isActive,
      order: s.order,
    });
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowEditModal(false);
  };

  const onUpdate = async (id: number) => {
    setError(null);
    // Validaciones básicas
    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.buttonText.trim() || !editForm.buttonUrl.trim()) {
      setError('Completa título, descripción, texto y URL del botón');
      return;
    }
    if (!isValidUrl(editForm.buttonUrl)) {
      setError('La URL del botón no es válida');
      return;
    }
    if (editForm.imageUrl && !isValidUrl(editForm.imageUrl)) {
      setError('La URL de imagen no es válida');
      return;
    }
    if (editForm.order < 0) {
      setError('El orden debe ser 0 o mayor');
      return;
    }
    try {
      setUpdatingId(id);
      const res = await adminFetch(`/admin/carousel/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      setEditingId(null);
      setShowEditModal(false);
      await reload();
      showToast('Slide actualizado');
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar slide');
    } finally {
      setUpdatingId(null);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('¿Eliminar este slide?')) return;
    setError(null);
    try {
      setDeletingId(id);
      const res = await adminFetch(`/admin/carousel/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      await reload();
      showToast('Slide eliminado');
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar slide');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type==='success'?'bg-emerald-600':'bg-red-600'} flex items-center gap-2`}>
            <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
            <span>{toast.message}</span>
          </div>
        )}
        <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Carrusel</h1>
          <p className="text-gray-500 mt-1">Gestiona los banners principales de tu tienda</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="lg">
          <span className="text-xl">+</span>
          Nuevo Slide
        </Button>
      </div>

      {loading && <p className="text-center py-8 text-gray-500">Cargando slides...</p>}
      {error && <p className="text-red-600" role="alert">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {slides.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-500">No hay slides para mostrar</div>
        )}
        {slides.map((s) => (
          <div key={s.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="md:col-span-2">
              <div className="font-semibold text-gray-800">{s.title}</div>
              <div className="text-xs text-gray-500 mt-1">{s.description}</div>
            </div>
            <div className="text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {s.isActive ? '✓ Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Orden: {s.order}
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => startEdit(s)}>
                ✏️ Editar
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(s.id)} isLoading={deletingId === s.id}>
                🗑️ Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear Slide */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crear Nuevo Slide" size="lg">
        <form onSubmit={onCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texto del botón *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.buttonText} onChange={(e)=>setForm({...form, buttonText: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL del botón *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.buttonUrl} onChange={(e)=>setForm({...form, buttonUrl: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fondo (gradiente Tailwind)</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="from-blue-500 to-blue-700" value={form.backgroundColor} onChange={(e)=>setForm({...form, backgroundColor: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
              <div className="space-y-2">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                  disabled={uploadingImage}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="O ingresa una URL: https://..." value={form.imageUrl} onChange={(e)=>setForm({...form, imageUrl: e.target.value})} />
                {uploadingImage && <p className="text-xs text-gray-500">Subiendo imagen...</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" className="rounded" checked={form.isActive} onChange={(e)=>setForm({...form, isActive: e.target.checked})} />
                Activo
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                <input type="number" className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.order} onChange={(e)=>setForm({...form, order: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button type="submit" isLoading={creating}>Crear Slide</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Slide */}
      <Modal isOpen={showEditModal} onClose={cancelEdit} title="Editar Slide" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); if (editingId) onUpdate(editingId); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.title} onChange={(e)=>setEditForm({...editForm, title: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.description} onChange={(e)=>setEditForm({...editForm, description: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texto del botón *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.buttonText} onChange={(e)=>setEditForm({...editForm, buttonText: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL del botón *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.buttonUrl} onChange={(e)=>setEditForm({...editForm, buttonUrl: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fondo (gradiente Tailwind)</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="from-blue-500 to-blue-700" value={editForm.backgroundColor} onChange={(e)=>setEditForm({...editForm, backgroundColor: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
              <div className="space-y-2">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  disabled={uploadingImage}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="O ingresa una URL: https://..." value={editForm.imageUrl} onChange={(e)=>setEditForm({...editForm, imageUrl: e.target.value})} />
                {uploadingImage && <p className="text-xs text-gray-500">Subiendo imagen...</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" className="rounded" checked={editForm.isActive} onChange={(e)=>setEditForm({...editForm, isActive: e.target.checked})} />
                Activo
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                <input type="number" className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.order} onChange={(e)=>setEditForm({...editForm, order: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="secondary" onClick={cancelEdit}>Cancelar</Button>
            <Button type="submit" isLoading={updatingId !== null}>Guardar Cambios</Button>
          </div>
        </form>
      </Modal>
      </div>
    </AdminLayout>
  );
}
