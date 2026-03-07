'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Trash2, Edit, Power, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import { API_CONFIG } from '@/config/api';
const API = API_CONFIG.API_BASE_URL;

interface QuickCategory {
  id: number;
  icon: string;
  label: string;
  href: string;
  order: number;
  is_active: boolean;
}

const COMMON_ICONS = ['💻', '🖥️', '⚡', '🧠', '💾', '🖱️', '🔲', '🖨️', '📱', '🎮', '🔊', '📷', '🖲️', '⌨️', '🔋', '🛜'];

function CategoryModal({
  item,
  onClose,
  onSave,
  token,
}: {
  item: QuickCategory | null;
  onClose: () => void;
  onSave: () => void;
  token: string;
}) {
  const [icon, setIcon] = useState(item?.icon ?? '📦');
  const [label, setLabel] = useState(item?.label ?? '');
  const [href, setHref] = useState(item?.href ?? '/products?category=');
  const [order, setOrder] = useState(item?.order ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) { toast.error('La etiqueta es requerida'); return; }
    if (!href.trim()) { toast.error('El enlace es requerido'); return; }
    setSaving(true);
    try {
      const method = item ? 'PUT' : 'POST';
      const url = item
        ? `${API}/api/admin/quick-categories/${item.id}`
        : `${API}/api/admin/quick-categories`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ icon, label, href, order }),
      });
      if (!res.ok) throw new Error();
      toast.success(item ? 'Acceso rápido actualizado' : 'Acceso rápido creado');
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
            {item ? 'Editar acceso rápido' : 'Nuevo acceso rápido'}
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

          {/* Etiqueta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etiqueta</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={40}
              placeholder="Ej: Laptops"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Enlace */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enlace</label>
            <input
              type="text"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="Ej: /products?category=laptops"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
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
          <div>
            <p className="text-xs text-gray-500 mb-1">Vista previa</p>
            <div className="inline-flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <span className="text-xl">{icon}</span>
              <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {label || 'Etiqueta'}
              </span>
            </div>
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

export default function QuickCategoriesPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<QuickCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<QuickCategory | null | undefined>(undefined);

  const token = session?.accessToken ?? '';

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API}/api/admin/quick-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setItems(json.data ?? []);
    } catch {
      toast.error('Error al cargar accesos rápidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchItems();
  }, [token]);

  const handleToggle = async (item: QuickCategory) => {
    try {
      await fetch(`${API}/api/admin/quick-categories/${item.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(item.is_active ? 'Desactivado' : 'Activado');
      fetchItems();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este acceso rápido?')) return;
    try {
      await fetch(`${API}/api/admin/quick-categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Eliminado');
      fetchItems();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const activeItems = items.filter((i) => i.is_active);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="Accesos Rápidos"
          description="Gestiona los iconos de navegación rápida debajo del carrusel principal"
          icon={LayoutGrid}
          action={
            <button
              onClick={() => setModalItem(null)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Acceso
            </button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{items.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Activos</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{activeItems.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Inactivos</p>
            <p className="text-3xl font-bold text-gray-400 mt-1">{items.length - activeItems.length}</p>
          </div>
        </div>

        {/* Vista previa */}
        {activeItems.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Vista previa</p>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex gap-3 flex-wrap">
              {activeItems.map((cat) => (
                <div
                  key={cat.id}
                  className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 min-w-[70px]"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 text-center whitespace-nowrap">
                    {cat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white">Accesos configurados</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <LayoutGrid className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay accesos rápidos. Crea el primero.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors ${!item.is_active ? 'opacity-50' : ''}`}
                >
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-400 truncate">{item.href}</p>
                  </div>

                  <span className="text-xs text-gray-400 flex-shrink-0">Orden: {item.order}</span>

                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    item.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                  }`}>
                    {item.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {item.is_active ? 'Activo' : 'Inactivo'}
                  </span>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(item)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.is_active
                          ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
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
        <CategoryModal
          item={modalItem}
          onClose={() => setModalItem(undefined)}
          onSave={fetchItems}
          token={token}
        />
      )}
    </AdminLayout>
  );
}
