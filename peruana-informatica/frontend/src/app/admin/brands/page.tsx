'use client';

import { useState, useEffect, useRef } from 'react';
import { Tag, Search, Upload, Trash2, Eye, EyeOff, ImageOff } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { toast } from 'sonner';

import { API_CONFIG } from '@/config/api';
const API = API_CONFIG.API_BASE_URL;

interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  show_in_carousel: boolean;
}

export default function BrandsAdminPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const token = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API}/api/admin/brands`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setBrands(json.data ?? json ?? []);
    } catch {
      toast.error('Error al cargar marcas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBrands();
  }, [token]);

  const handleToggleCarousel = async (brand: Brand) => {
    try {
      const res = await fetch(`${API}/api/admin/brands/${brand.id}/toggle-carousel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success(brand.show_in_carousel ? 'Quitada del carrusel' : 'Añadida al carrusel');
      fetchBrands();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleUploadLogo = async (brand: Brand, file: File) => {
    setUploading(brand.id);
    try {
      const form = new FormData();
      form.append('logo', file);
      const res = await fetch(`${API}/api/admin/brands/${brand.id}/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error();
      toast.success('Logo actualizado');
      fetchBrands();
    } catch {
      toast.error('Error al subir logo');
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveLogo = async (brand: Brand) => {
    if (!confirm(`¿Quitar el logo de ${brand.name}? También se quitará del carrusel.`)) return;
    try {
      const res = await fetch(`${API}/api/admin/brands/${brand.id}/logo`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success('Logo eliminado');
      fetchBrands();
    } catch {
      toast.error('Error al eliminar logo');
    }
  };

  const getLogoSrc = (logo: string | null) => {
    if (!logo) return null;
    // URL completa (logos subidos vía admin)
    if (logo.startsWith('http')) return logo;
    // Ruta relativa del frontend public (logos pre-cargados)
    const normalized = logo.startsWith('/') ? logo : `/${logo}`;
    return normalized;
  };

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const inCarousel = brands.filter((b) => b.show_in_carousel).length;
  const withLogo = brands.filter((b) => b.logo).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Marcas — Carrusel de Logos"
          description="Gestiona qué marcas aparecen en la tira de logos del inicio"
          icon={Tag}
          action={null}
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Total marcas</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{brands.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Con logo</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{withLogo}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">En carrusel</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{inCarousel}</p>
          </div>
        </div>

        {/* Vista previa mini del carrusel */}
        {inCarousel > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Vista previa del carrusel ({inCarousel} marcas)
            </p>
            <div className="flex flex-wrap gap-6 items-center">
              {brands.filter((b) => b.show_in_carousel && b.logo).map((b) => {
                const src = getLogoSrc(b.logo);
                return src ? (
                  <img key={b.id} src={src} alt={b.name} className="h-7 object-contain opacity-60" title={b.name} />
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Lista */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{filtered.length} marcas</p>
            <p className="text-xs text-gray-400">SVG, PNG, JPG o WebP · máx. 2 MB</p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-400">Cargando...</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((brand) => {
                const src = getLogoSrc(brand.logo);
                return (
                  <div key={brand.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">

                    {/* Logo preview */}
                    <div className="w-16 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shrink-0">
                      {src ? (
                        <img src={src} alt={brand.name} className="max-h-8 max-w-[56px] object-contain" />
                      ) : (
                        <ImageOff className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                      )}
                    </div>

                    {/* Nombre */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{brand.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{brand.slug}</p>
                    </div>

                    {/* Estado carrusel */}
                    <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${
                      brand.show_in_carousel
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {brand.show_in_carousel ? 'En carrusel' : 'Oculto'}
                    </span>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 flex-shrink-0">

                      {/* Toggle carrusel */}
                      <button
                        onClick={() => handleToggleCarousel(brand)}
                        disabled={!brand.logo}
                        title={!brand.logo ? 'Sube un logo primero' : brand.show_in_carousel ? 'Quitar del carrusel' : 'Mostrar en carrusel'}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          brand.show_in_carousel
                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {brand.show_in_carousel ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>

                      {/* Subir / cambiar logo */}
                      <input
                        type="file"
                        accept=".svg,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        ref={(el) => { fileRefs.current[brand.id] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadLogo(brand, file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        onClick={() => fileRefs.current[brand.id]?.click()}
                        disabled={uploading === brand.id}
                        title={brand.logo ? 'Cambiar logo' : 'Subir logo'}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {uploading === brand.id
                          ? <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          : <Upload className="h-4 w-4" />
                        }
                      </button>

                      {/* Quitar logo */}
                      {brand.logo && (
                        <button
                          onClick={() => handleRemoveLogo(brand)}
                          title="Quitar logo"
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

