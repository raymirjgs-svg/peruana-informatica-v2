"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/admin/Button';
import { getAdminAuthHeaders } from '@/lib/adminAuth';
import apiClient from '@/utils/api';
import { AdminToast } from './components/AdminToast';
import { SlideList } from './components/SlideList';
import { SlideFormModal } from './components/SlideFormModal';
import type { Slide, SlideForm } from './components/types';

export default function AdminCarouselPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [form, setForm] = useState<SlideForm>({
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

      const json = await apiClient.request<{ imageUrl: string }>('/api/admin/carousel/upload', {
        method: 'POST',
        headers: { ...getAdminAuthHeaders() },
        body: formData,
      });

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
  const [editForm, setEditForm] = useState<SlideForm>({
    title: '',
    description: '',
    buttonText: 'Ver más',
    buttonUrl: '/products',
    backgroundColor: 'from-blue-500 to-blue-700',
    imageUrl: '',
    isActive: true,
    order: 0,
  });

  const loadSlides = async (targetPage: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiClient.request<{ data?: Slide[]; pagination?: { page: number; totalPages: number; total: number } }>(`/api/admin/carousel?page=${targetPage}&limit=${limit}`, {
        headers: { ...getAdminAuthHeaders() },
      });
      setSlides((json?.data ?? json) as Slide[]);
      if (json?.pagination) {
        setPage(json.pagination.page);
        setTotalPages(json.pagination.totalPages);
        setTotal(json.pagination.total);
      }
    } catch (err: any) {
      setError(err?.message || "Error al cargar carrusel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides(1);
  }, []);

  const reload = async () => {
    await loadSlides(page);
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
      await apiClient.request('/api/admin/carousel', {
        method: 'POST',
        headers: { ...getAdminAuthHeaders() },
        body: form,
      });
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
      await apiClient.request(`/api/admin/carousel/${id}`, {
        method: 'PUT',
        headers: { ...getAdminAuthHeaders() },
        body: editForm,
      });
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
      await apiClient.request(`/api/admin/carousel/${id}`, { method: 'DELETE', headers: { ...getAdminAuthHeaders() } });
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
        <AdminToast toast={toast} />
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

      <SlideList
        slides={slides}
        loading={loading}
        deletingId={deletingId}
        onEdit={startEdit}
        onDelete={onDelete}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={loadSlides}
      />

      <SlideFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Slide"
        form={form}
        onChange={setForm}
        onSubmit={onCreate}
        onImageUpload={handleImageUpload}
        uploadingImage={uploadingImage}
        submitting={creating}
        submitLabel="Crear Slide"
        error={error}
        isEdit={false}
      />

      <SlideFormModal
        isOpen={showEditModal}
        onClose={cancelEdit}
        title="Editar Slide"
        form={editForm}
        onChange={setEditForm}
        onSubmit={(e) => { e.preventDefault(); if (editingId) onUpdate(editingId); }}
        onImageUpload={handleImageUpload}
        uploadingImage={uploadingImage}
        submitting={updatingId !== null}
        submitLabel="Guardar Cambios"
        error={error}
        isEdit
      />
      </div>
    </AdminLayout>
  );
}
