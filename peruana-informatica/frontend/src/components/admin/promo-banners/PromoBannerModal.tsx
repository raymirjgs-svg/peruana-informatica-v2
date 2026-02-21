'use client';

import { useState, useEffect } from 'react';
import { X, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { PromoBanner, couponService, Coupon } from '@/services/CouponService';
import { toast } from 'sonner';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface PromoBannerModalProps {
    banner?: PromoBanner | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<PromoBanner>) => Promise<void>;
}

export function PromoBannerModal({ banner, isOpen, onClose, onSave }: PromoBannerModalProps) {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [coupons, setCoupons] = useState<Coupon[]>([]);

    const [formData, setFormData] = useState<Partial<PromoBanner>>({
        title: '',
        description: '',
        image_url: '',
        coupon_code: '',
        show_as_popup: true,
        popup_delay: 3,
        priority: 0
    });

    useEffect(() => {
        if (isOpen) {
            loadCoupons();
            if (banner) {
                setFormData({
                    title: banner.title,
                    description: banner.description || '',
                    image_url: banner.image_url,
                    coupon_code: banner.coupon_code || '',
                    show_as_popup: banner.show_as_popup,
                    popup_delay: banner.popup_delay,
                    priority: banner.priority || 0
                });
            } else {
                setFormData({
                    title: '',
                    description: '',
                    image_url: '',
                    coupon_code: '',
                    show_as_popup: true,
                    popup_delay: 3,
                    priority: 0
                });
            }
        }
    }, [isOpen, banner]);

    const loadCoupons = async () => {
        if ((session?.user as any)?.accessToken) {
            try {
                const data = await couponService.getAllCoupons((session!.user as any).accessToken);
                // Filter only active coupons
                setCoupons(data.filter(c => c.is_active));
            } catch (error) {
                console.error('Error loading coupons:', error);
                toast.error('Error al cargar cupones');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.image_url) {
            toast.error('Título e Imagen son obligatorios');
            return;
        }

        setIsLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Simple image upload handler (mock for now or basic input)
    // In a real app we'd use a file input and upload endpoint

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {banner ? 'Editar Banner' : 'Nuevo Banner Publicitario'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Título del Banner
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ej: Oferta de Verano"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descripción (Opcional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    rows={3}
                                    placeholder="Detalles de la promoción..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    URL de Imagen
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        required
                                        value={formData.image_url}
                                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="https://..."
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Recomendado: 800x600px o similar</p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            {/* Preview */}
                            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                                {formData.image_url ? (
                                    <img
                                        src={formData.image_url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/no-image.svg';
                                        }}
                                    />
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <span className="text-sm">Vista previa de imagen</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Asociar Cupón (Opcional)
                                </label>
                                <select
                                    value={formData.coupon_code}
                                    onChange={e => setFormData({ ...formData, coupon_code: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">-- Sin Cupón --</option>
                                    {coupons.map(coupon => (
                                        <option key={coupon.id} value={coupon.code}>
                                            {coupon.code} - {coupon.type === 'percentage' ? `${coupon.value}%` : `S/ ${coupon.value}`} OFF
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_as_popup}
                                        onChange={e => setFormData({ ...formData, show_as_popup: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Mostrar como Popup
                                    </span>
                                </label>

                                {formData.show_as_popup && (
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Retraso (seg)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="30"
                                            value={formData.popup_delay}
                                            onChange={e => setFormData({ ...formData, popup_delay: parseInt(e.target.value) || 0 })}
                                            className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2.5 text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {isLoading ? 'Guardando...' : 'Guardar Banner'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
