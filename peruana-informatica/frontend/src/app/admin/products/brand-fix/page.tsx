'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminFetch } from '@/lib/adminApi';
import {
  Search,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Wand2,
  ChevronRight,
  Tag
} from 'lucide-react';

interface Inconsistency {
  cod_producto: number;
  name: string;
  current_brand_id: number | null;
  current_brand_name: string;
  suggested_brand_id: number;
  suggested_brand_name: string;
  selected: boolean;
}

export default function BrandFixPage() {
  const [items, setItems] = useState<Inconsistency[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');

  const runCheck = async () => {
    setLoading(true);
    setChecked(false);
    setMessage(null);
    setItems([]);
    try {
      const res = await adminFetch('/admin/products/brand-check');
      const data = await res.json();
      setItems((data.items || []).map((item: any) => ({ ...item, selected: true })));
      setChecked(true);
    } catch {
      setMessage({ type: 'error', text: 'Error al analizar productos' });
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = (val: boolean) => setItems(prev => prev.map(i => ({ ...i, selected: val })));
  const toggleItem = (cod: number) => setItems(prev => prev.map(i => i.cod_producto === cod ? { ...i, selected: !i.selected } : i));

  const applyFixes = async () => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) return;
    setApplying(true);
    setMessage(null);
    try {
      const res = await adminFetch('/admin/products/brand-fix', {
        method: 'POST',
        body: JSON.stringify({
          fixes: selected.map(i => ({ cod_producto: i.cod_producto, brand_id: i.suggested_brand_id }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setMessage({ type: 'success', text: `${data.updated} producto(s) actualizados correctamente` });
      // Remove fixed items from list
      const fixedIds = new Set(selected.map(i => i.cod_producto));
      setItems(prev => prev.filter(i => !fixedIds.has(i.cod_producto)));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al aplicar correcciones' });
    } finally {
      setApplying(false);
    }
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.current_brand_name.toLowerCase().includes(search.toLowerCase()) ||
    i.suggested_brand_name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCount = items.filter(i => i.selected).length;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shrink-0">
            <Wand2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Corrección Automática de Marcas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Detecta productos cuya marca asignada no coincide con el nombre del producto</p>
          </div>
        </div>

        {/* Scan button */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white mb-1">Analizar base de datos</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Busca en el nombre de cada producto las marcas registradas en el sistema. Si encuentra una marca diferente a la asignada, la sugiere como corrección.
              </p>
            </div>
            <button
              onClick={runCheck}
              disabled={loading}
              className="shrink-0 flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? 'Analizando...' : 'Analizar Productos'}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-800 dark:text-red-200'}`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Results */}
        {checked && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Results header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                {items.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">No se encontraron inconsistencias. ¡Todo está correcto!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full text-sm font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {items.length} inconsistencia(s) encontrada(s)
                    </span>
                    {selectedCount > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{selectedCount} seleccionada(s)</span>
                    )}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="flex-1 sm:w-48 px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm"
                  />
                  <button onClick={() => toggleAll(true)} className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap">Todo</button>
                  <button onClick={() => toggleAll(false)} className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap">Ninguno</button>
                </div>
              )}
            </div>

            {/* Table */}
            {filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left w-10">
                        <input type="checkbox"
                          checked={filtered.every(i => i.selected)}
                          onChange={e => toggleAll(e.target.checked)}
                          className="rounded" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Marca actual</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-8"></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Marca sugerida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filtered.map(item => (
                      <tr key={item.cod_producto}
                        onClick={() => toggleItem(item.cod_producto)}
                        className={`cursor-pointer transition-colors ${item.selected
                          ? 'bg-amber-50 dark:bg-amber-900/10'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={item.selected} onChange={() => toggleItem(item.cod_producto)} className="rounded" />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">#{item.cod_producto}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{item.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${item.current_brand_id
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                            <Tag className="h-3 w-3" />
                            {item.current_brand_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ChevronRight className="h-4 w-4 text-amber-500 mx-auto" />
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            <CheckCircle className="h-3 w-3" />
                            {item.suggested_brand_name}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Apply button */}
            {items.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Se aplicará la marca sugerida a los <strong>{selectedCount}</strong> producto(s) seleccionado(s).
                </p>
                <button
                  onClick={applyFixes}
                  disabled={applying || selectedCount === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {applying ? 'Aplicando...' : `Aplicar ${selectedCount} corrección(es)`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
