'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Edit, Power, GripVertical, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { toast } from 'sonner';

import { API_CONFIG } from '@/config/api';
const API = API_CONFIG.API_BASE_URL;

interface Announcement {
  id: number;
  icon: string;
  text: string;
  order: number;
  is_active: boolean;
}

const COMMON_ICONS = ['🚚', '✅', '📞', '🔥', '💳', '⚡', '🎁', '🏆', '💡', '📢', '🛡️', '⭐'];

function AnnouncementModal({
  item,
  onClose,
  onSave,
  token,
}: {
  item: Announcement | null;
  onClose: () => void;
  onSave: () => void;
  token: string;
}) {
  const [icon, setIcon] = useState(item?.icon ?? '📢');
  const [text, setText] = useState(item?.text ?? '');
  const [order, setOrder] = useState(item?.order ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) { toast.error('El texto es requerido'); return; }
    setSaving(true);
    try {
      const method = item ? 'PUT' : 'POST';
      const url = item
        ? `${API}/api/admin/announcements/${item.id}`
        : `${API}/api/admin/announcements`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ icon, text, order }),
      });
      if (!res.ok) throw new Error();
      toast.success(item ? 'Anuncio actualizado' : 'Anuncio creado');
      onSave();
      onClose();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {item ? 'Editar anuncio' : 'Nuevo anuncio'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Icono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icono</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMMON_ICONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`text-xl p-2 rounded-lg border-2 transition-all ${icon === e ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={2}
              placeholder="O escribe un emoji"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Texto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Texto del anuncio
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200}
              placeholder="Ej: Envío gratis en compras mayores a S/. 100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">{text.length}/200 caracteres</p>
          </div>

          {/* Orden */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Orden</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Vista previa */}
          <div className="bg-gradient-to-r from-red-800 to-red-600 rounded-lg px-4 py-2 flex items-center gap-2 text-white text-sm font-semibold">
            <span>{icon}</span>
            <span>{text || 'Vista previa del anuncio...'}</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<Announcement | null | undefined>(undefined);

  const token = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API}/api/admin/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setItems(json.data ?? []);
    } catch {
      toast.error('Error al cargar anuncios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleToggle = async (item: Announcement) => {
    try {
      await fetch(`${API}/api/admin/announcements/${item.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(item.is_active ? 'Anuncio desactivado' : 'Anuncio activado');
      fetchItems();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    try {
      await fetch(`${API}/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Anuncio eliminado');
      fetchItems();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const activeCount = items.filter((i) => i.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="Barra de Anuncios"
          description="Gestiona los mensajes que aparecen en la barra roja superior del sitio"
          icon={Megaphone}
          action={
            <button
              onClick={() => setModalItem(null)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Anuncio
            </button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Total</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{items.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Activos</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Inactivos</p>
            <p className="text-3xl font-bold text-gray-400 mt-1">{items.length - activeCount}</p>
          </div>
        </div>

        {/* Vista previa */}
        {activeCount > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Vista previa de la barra</p>
            <div
              className="relative bg-gradient-to-r from-red-800 to-red-600 text-white text-xs font-semibold rounded-lg"
              style={{ height: '30px', overflow: 'hidden' }}
            >
              <div
                className="absolute top-0 left-0 flex items-center h-full animate-ticker"
                style={{ width: 'max-content' }}
              >
                {[...items.filter(i => i.is_active), ...items.filter(i => i.is_active)].map((i, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 px-8 whitespace-nowrap">
                    <span>{i.icon}</span>
                    <span>{i.text}</span>
                    <span className="text-red-300/50 ml-8">◆</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white">Anuncios configurados</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay anuncios. Crea el primero.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors ${item.is_active ? '' : 'opacity-50'}`}
                >
                  <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />

                  <span className="text-2xl flex-shrink-0">{item.icon}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.text}</p>
                    <p className="text-xs text-gray-400">Orden: {item.order}</p>
                  </div>

                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${item.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                    {item.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {item.is_active ? 'Activo' : 'Inactivo'}
                  </span>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(item)}
                      className={`p-2 rounded-lg transition-colors ${item.is_active ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      title={item.is_active ? 'Desactivar' : 'Activar'}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setModalItem(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar"
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

      {modalItem !== undefined && (
        <AnnouncementModal
          item={modalItem}
          onClose={() => setModalItem(undefined)}
          onSave={fetchItems}
          token={token}
        />
      )}
    </AdminLayout>
  );
}
