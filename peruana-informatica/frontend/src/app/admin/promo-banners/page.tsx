'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Edit, Trash2, Tag, Eye, EyeOff, LayoutTemplate } from 'lucide-react';
import { PromoBanner, couponService } from '@/services/CouponService';
import { promoBannerService } from '@/services/PromoBannerService';
import { PromoBannerModal } from '@/components/admin/promo-banners/PromoBannerModal';
import { toast } from 'sonner';
import Image from 'next/image';

export default function PromoBannersPage() {
    const { data: session } = useSession();
    const [banners, setBanners] = useState<PromoBanner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<PromoBanner | null>(null);

    useEffect(() => {
        if ((session?.user as any)?.accessToken) {
            fetchBanners();
        }
    }, [session]);

    const fetchBanners = async () => {
        setIsLoading(true);
        try {
            const data = await promoBannerService.getAllBanners((session!.user as any).accessToken);
            setBanners(data);
        } catch (error) {
            console.error('Error fetching banners:', error);
            toast.error('No se pudieron cargar los banners');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data: Partial<PromoBanner>) => {
        try {
            await promoBannerService.createBanner(data, (session!.user as any).accessToken);
            toast.success('Banner creado exitosamente');
            fetchBanners();
        } catch (error: any) {
            toast.error(error.message || 'Error al crear banner');
        }
    };

    const handleUpdate = async (data: Partial<PromoBanner>) => {
        if (!selectedBanner) return;
        try {
            await promoBannerService.updateBanner(selectedBanner.id, data, (session!.user as any).accessToken);
            toast.success('Banner actualizado exitosamente');
            fetchBanners();
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar banner');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este banner?')) return;
        try {
            await promoBannerService.deleteBanner(id, (session!.user as any).accessToken);
            toast.success('Banner eliminado');
            fetchBanners();
        } catch (error: any) {
            toast.error('Error al eliminar banner');
        }
    };

    const handleToggleStatus = async (banner: PromoBanner) => {
        try {
            await promoBannerService.toggleStatus(banner.id, (session!.user as any).accessToken);
            toast.success(`Banner ${!banner.is_active ? 'activado' : 'desactivado'}`);
            fetchBanners();
        } catch (error) {
            toast.error('Error al cambiar estado');
        }
    };

    const openCreateModal = () => {
        setSelectedBanner(null);
        setIsModalOpen(true);
    };

    const openEditModal = (banner: PromoBanner) => {
        setSelectedBanner(banner);
        setIsModalOpen(true);
    };

    const filteredBanners = banners.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <LayoutTemplate className="w-8 h-8 text-purple-600" />
                        Banners Publicitarios
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Gestiona los popups y banners promocionales de la tienda</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Banner
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por título..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
            </div>

            {/* Grid de Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    // Skeletons
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm h-64 animate-pulse"></div>
                    ))
                ) : filteredBanners.length > 0 ? (
                    filteredBanners.map((banner) => (
                        <div key={banner.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden group hover:shadow-md transition-all ${!banner.is_active ? 'opacity-60 grayscale' : ''}`}>
                            {/* Imagen */}
                            <div className="relative h-40 w-full bg-gray-100 dark:bg-gray-700">
                                <Image
                                    src={banner.image_url}
                                    alt={banner.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {banner.show_as_popup && (
                                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                            <Eye className="w-3 h-3" /> Popup
                                        </span>
                                    )}
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {banner.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-4">
                                <h3 className="font-bold text-gray-800 dark:text-white truncate" title={banner.title}>
                                    {banner.title}
                                </h3>

                                {banner.coupon_code && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
                                        <Tag className="w-4 h-4" />
                                        <span>Cupón: {banner.coupon_code}</span>
                                    </div>
                                )}

                                <div className="mt-4 flex justify-between items-center pt-3 border-t dark:border-gray-700">
                                    <button
                                        onClick={() => handleToggleStatus(banner)}
                                        className={`p-2 rounded-lg transition-colors ${banner.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                        title={banner.is_active ? 'Desactivar' : 'Activar'}
                                    >
                                        {banner.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(banner)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl">
                        <LayoutTemplate className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No hay banners creados</p>
                        <p className="text-sm">Crea el primero para promocionar tus ofertas</p>
                    </div>
                )}
            </div>

            <PromoBannerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={selectedBanner ? handleUpdate : handleCreate}
                banner={selectedBanner}
            />
        </div>
    );
}
