'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Tag, Eye, EyeOff, LayoutTemplate, Upload, X, Save } from 'lucide-react';
import { PromoBanner } from '@/services/CouponService';
import { promoBannerService } from '@/services/PromoBannerService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { toast } from 'sonner';

function getApiBase() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const trimmed = baseUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const emptyForm = {
    title: '',
    description: '',
    image_url: '',
    coupon_code: '',
    show_as_popup: true,
    popup_delay: 3,
    priority: 0,
    is_active: true,
};

export default function PromoBannersPage() {
    const [token, setToken] = useState<string>('');
    const [banners, setBanners] = useState<PromoBanner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState<Partial<PromoBanner>>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken') || '';
        setToken(adminToken);
    }, []);

    useEffect(() => {
        if (token) fetchBanners();
    }, [token]);

    const fetchBanners = async () => {
        setIsLoading(true);
        try {
            const data = await promoBannerService.getAllBanners(token);
            setBanners(data);
        } catch {
            toast.error('No se pudieron cargar los banners');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch(`${getApiBase()}/admin/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const json = await res.json();
            if (json.url) {
                setFormData(f => ({ ...f, image_url: json.url }));
                toast.success('Imagen subida');
            } else {
                toast.error('Error al subir imagen');
            }
        } catch {
            toast.error('Error al subir imagen');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEdit = (banner: PromoBanner) => {
        setEditingId(banner.id);
        setFormData({
            title: banner.title,
            description: banner.description || '',
            image_url: banner.image_url,
            coupon_code: banner.coupon_code || '',
            show_as_popup: banner.show_as_popup,
            popup_delay: banner.popup_delay,
            priority: banner.priority || 0,
            is_active: banner.is_active,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData(emptyForm);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.image_url) {
            toast.error('Título e imagen son obligatorios');
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                await promoBannerService.updateBanner(editingId, formData, token);
                toast.success('Banner actualizado');
            } else {
                await promoBannerService.createBanner(formData, token);
                toast.success('Banner creado');
            }
            handleCancel();
            fetchBanners();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este banner?')) return;
        try {
            await promoBannerService.deleteBanner(id, token);
            toast.success('Banner eliminado');
            fetchBanners();
        } catch {
            toast.error('Error al eliminar');
        }
    };

    const handleToggle = async (banner: PromoBanner) => {
        try {
            await promoBannerService.toggleStatus(banner.id, token);
            toast.success(`Banner ${banner.is_active ? 'desactivado' : 'activado'}`);
            fetchBanners();
        } catch {
            toast.error('Error al cambiar estado');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <LayoutTemplate className="w-8 h-8 text-purple-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Banners Publicitarios</h1>
                        <p className="text-sm text-gray-500">Gestiona los popups y banners promocionales</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    {/* Form */}
                    <div className="xl:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                {editingId ? 'Editar Banner' : 'Nuevo Banner'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Título */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                        placeholder="Ej: Oferta de verano"
                                    />
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                                        rows={2}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                        placeholder="Detalles de la promoción..."
                                    />
                                </div>

                                {/* Imagen */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen *</label>
                                    {/* Preview */}
                                    {formData.image_url ? (
                                        <div className="relative mb-2 rounded-lg overflow-hidden border bg-gray-50 dark:bg-gray-700" style={{ aspectRatio: '16/7' }}>
                                            <img
                                                src={formData.image_url}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x300?text=Error'; }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(f => ({ ...f, image_url: '' }))}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="mb-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors"
                                            style={{ aspectRatio: '16/7' }}
                                        >
                                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm text-gray-500">Haz clic para subir imagen</p>
                                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · Máx 5MB</p>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {uploading ? 'Subiendo...' : 'Subir imagen'}
                                        </button>
                                    </div>
                                </div>

                                {/* Cupón */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código de cupón (opcional)</label>
                                    <input
                                        type="text"
                                        value={formData.coupon_code}
                                        onChange={e => setFormData(f => ({ ...f, coupon_code: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                        placeholder="Ej: VERANO20"
                                    />
                                </div>

                                {/* Opciones */}
                                <div className="flex flex-wrap gap-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.show_as_popup}
                                            onChange={e => setFormData(f => ({ ...f, show_as_popup: e.target.checked }))}
                                            className="w-4 h-4 text-purple-600 rounded"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar como popup</span>
                                    </label>
                                    {formData.show_as_popup && (
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-600 dark:text-gray-400">Retraso (seg):</label>
                                            <input
                                                type="number"
                                                min="0" max="30"
                                                value={formData.popup_delay}
                                                onChange={e => setFormData(f => ({ ...f, popup_delay: parseInt(e.target.value) || 0 }))}
                                                className="w-16 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Botones */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving || uploading}
                                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear banner'}
                                    </button>
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Lista */}
                    <div className="xl:col-span-3">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                                <h2 className="font-semibold text-gray-800 dark:text-white">
                                    Banners ({banners.length})
                                </h2>
                            </div>

                            {isLoading ? (
                                <div className="p-8 text-center text-gray-500">Cargando...</div>
                            ) : banners.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <LayoutTemplate className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No hay banners. Crea el primero.</p>
                                </div>
                            ) : (
                                <div className="divide-y dark:divide-gray-700">
                                    {banners.map(banner => (
                                        <div key={banner.id} className={`flex gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${editingId === banner.id ? 'bg-purple-50 dark:bg-purple-900/10' : ''}`}>
                                            {/* Thumbnail */}
                                            <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                                <img
                                                    src={banner.image_url}
                                                    alt={banner.title}
                                                    className="w-full h-full object-cover"
                                                    onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x120?text=Sin+imagen'; }}
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{banner.title}</p>
                                                {banner.coupon_code && (
                                                    <div className="flex items-center gap-1 text-xs text-purple-600 mt-0.5">
                                                        <Tag className="w-3 h-3" />
                                                        {banner.coupon_code}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${banner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {banner.is_active ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                    {banner.show_as_popup && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Popup</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => handleToggle(banner)}
                                                    className={`p-1.5 rounded-lg transition-colors ${banner.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                                    title={banner.is_active ? 'Desactivar' : 'Activar'}
                                                >
                                                    {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(banner)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(banner.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
