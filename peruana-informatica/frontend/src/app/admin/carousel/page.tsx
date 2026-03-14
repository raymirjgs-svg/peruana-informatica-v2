"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PageHeader } from '@/components/admin/PageHeader';
import { adminFetch } from '@/lib/adminApi';
import { Images, Plus, Edit, Trash2, Power, CheckCircle, XCircle, Save, X, Upload, Info } from 'lucide-react';
import { toast } from 'sonner';

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

const emptyForm = {
  title: '',
  description: '',
  buttonText: 'Ver más',
  buttonUrl: '/products',
  backgroundColor: 'from-blue-500 to-blue-700',
  imageUrl: '',
  isActive: true,
  order: 0,
};

const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";
const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

function SlideModal({
  open, onClose, title: modalTitle, form, setForm, onSubmit, submitting, uploadingImage, onUpload,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  onSubmit: () => void;
  submitting: boolean;
  uploadingImage: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{modalTitle}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Aviso tamaño */}
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span><strong>Tamaño recomendado para imágenes del banner:</strong> 1920 × 600 px (ratio 16:5). Formatos: JPG, PNG, WebP. Peso máximo: 5 MB.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Título *</label>
              <input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Laptops gaming desde S/. 999" />
            </div>
            <div>
              <label className={labelCls}>Descripción *</label>
              <input className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Breve texto del banner" />
            </div>
            <div>
              <label className={labelCls}>Texto del botón *</label>
              <input className={inputCls} value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })} placeholder="Ver más" />
            </div>
            <div>
              <label className={labelCls}>URL del botón *</label>
              <input className={inputCls} value={form.buttonUrl} onChange={e => setForm({ ...form, buttonUrl: e.target.value })} placeholder="/products?category=laptops" />
            </div>
            <div>
              <label className={labelCls}>Color de fondo (gradiente Tailwind)</label>
              <input className={inputCls} value={form.backgroundColor} onChange={e => setForm({ ...form, backgroundColor: e.target.value })} placeholder="from-blue-500 to-blue-700" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Solo aplica si no hay imagen</p>
            </div>
            <div>
              <label className={labelCls}>Orden</label>
              <input type="number" className={inputCls} value={form.order} min={0} onChange={e => setForm({ ...form, order: Number(e.target.value) })} />
            </div>
          </div>

          {/* Imagen */}
          <div>
            <label className={labelCls}>Imagen del banner</label>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 cursor-pointer px-4 py-3 border-2 border-dashed rounded-xl transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}>
                <Upload className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{uploadingImage ? 'Subiendo...' : 'Subir imagen'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG, WebP — máx. 5 MB — recomendado 1920×600 px</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploadingImage} />
              </label>
              {form.imageUrl && (
                <div className="relative rounded-xl overflow-hidden h-24 bg-gray-100 dark:bg-gray-800">
                  <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setForm({ ...form, imageUrl: '' })}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400">o pega una URL</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
              <input className={inputCls} placeholder="https://ejemplo.com/imagen.jpg" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
            </div>
          </div>

          {/* Activo */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{form.isActive ? 'Activo — se muestra en el carrusel' : 'Inactivo — oculto'}</span>
          </label>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
          <button onClick={onSubmit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
            <Save className="h-4 w-4" />
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCarouselPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isValidUrl = (v: string) => {
    if (!v) return true;
    if (v.startsWith('/')) return true;
    try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/admin/carousel');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      setSlides(Array.isArray(json) ? json : (json.data ?? []));
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar carrusel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await adminFetch('/admin/carousel/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Error al subir');
      if (isEdit) setEditForm(f => ({ ...f, imageUrl: json.imageUrl }));
      else setCreateForm(f => ({ ...f, imageUrl: json.imageUrl }));
      toast.success('Imagen subida');
    } catch (err: any) {
      toast.error(err?.message || 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const onCreate = async () => {
    if (!createForm.title.trim() || !createForm.description.trim() || !createForm.buttonText.trim() || !createForm.buttonUrl.trim()) {
      toast.error('Completa todos los campos obligatorios'); return;
    }
    if (!isValidUrl(createForm.buttonUrl)) { toast.error('URL del botón inválida'); return; }
    setSubmitting(true);
    try {
      const res = await adminFetch('/admin/carousel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      setShowCreate(false);
      setCreateForm({ ...emptyForm });
      await load();
      toast.success('Slide creado');
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear');
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdate = async () => {
    if (!editingId) return;
    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.buttonText.trim() || !editForm.buttonUrl.trim()) {
      toast.error('Completa todos los campos obligatorios'); return;
    }
    setSubmitting(true);
    try {
      const res = await adminFetch(`/admin/carousel/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      setShowEdit(false);
      setEditingId(null);
      await load();
      toast.success('Slide actualizado');
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar');
    } finally {
      setSubmitting(false);
    }
  };

  const onToggle = async (s: Slide) => {
    setTogglingId(s.id);
    try {
      const res = await adminFetch(`/admin/carousel/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...s, isActive: !s.isActive }),
      });
      if (!res.ok) throw new Error();
      await load();
      toast.success(s.isActive ? 'Slide desactivado' : 'Slide activado');
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setTogglingId(null);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('¿Eliminar este slide?')) return;
    setDeletingId(id);
    try {
      const res = await adminFetch(`/admin/carousel/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await load();
      toast.success('Slide eliminado');
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (s: Slide) => {
    setEditingId(s.id);
    setEditForm({ title: s.title, description: s.description, buttonText: s.buttonText, buttonUrl: s.buttonUrl, backgroundColor: s.backgroundColor || 'from-blue-500 to-blue-700', imageUrl: s.imageUrl || '', isActive: s.isActive, order: s.order });
    setShowEdit(true);
  };

  const activeCount = slides.filter(s => s.isActive).length;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="Carrusel de Banners"
          description="Gestiona los banners principales del inicio"
          icon={Images}
          action={
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors text-sm font-medium">
              <Plus className="h-4 w-4" />
              Nuevo Slide
            </button>
          }
        />

        {/* Aviso tamaño imágenes */}
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span><strong>Imágenes del carrusel:</strong> usar <strong>1920 × 600 px</strong> (ratio 16:5). Formatos: JPG, PNG o WebP. Peso máximo 5 MB. Imágenes más pequeñas pueden verse pixeladas.</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Total slides</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{slides.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Activos</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Inactivos</p>
            <p className="text-3xl font-bold text-gray-400 mt-1">{slides.length - activeCount}</p>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Slides configurados</p>
          </div>

          {loading ? (
            <div className="p-10 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : slides.length === 0 ? (
            <div className="p-10 text-center text-gray-400 dark:text-gray-500">
              <Images className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay slides. Crea el primero.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {slides.map(s => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-20 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-r ${s.backgroundColor || 'from-blue-500 to-blue-700'}`} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.title}</p>
                    <p className="text-xs text-gray-400 truncate">{s.description}</p>
                  </div>

                  {/* Orden */}
                  <span className="text-xs text-gray-400 shrink-0">#{s.order}</span>

                  {/* Badge estado */}
                  <span className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${s.isActive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    {s.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {s.isActive ? 'Activo' : 'Inactivo'}
                  </span>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onToggle(s)}
                      disabled={togglingId === s.id}
                      title={s.isActive ? 'Desactivar' : 'Activar'}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${s.isActive ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => startEdit(s)}
                      title="Editar"
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(s.id)}
                      disabled={deletingId === s.id}
                      title="Eliminar"
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SlideModal
        open={showCreate}
        onClose={() => { setShowCreate(false); setCreateForm({ ...emptyForm }); }}
        title="Nuevo Slide"
        form={createForm}
        setForm={setCreateForm}
        onSubmit={onCreate}
        submitting={submitting}
        uploadingImage={uploadingImage}
        onUpload={e => handleUpload(e, false)}
      />

      <SlideModal
        open={showEdit}
        onClose={() => { setShowEdit(false); setEditingId(null); }}
        title="Editar Slide"
        form={editForm}
        setForm={setEditForm}
        onSubmit={onUpdate}
        submitting={submitting}
        uploadingImage={uploadingImage}
        onUpload={e => handleUpload(e, true)}
      />
    </AdminLayout>
  );
}
