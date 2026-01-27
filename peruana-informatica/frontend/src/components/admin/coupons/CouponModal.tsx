import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { type Coupon, couponService } from '@/services/CouponService';
import { toast } from 'sonner';

interface CouponModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    couponToEdit?: Coupon | null;
    token: string;
}

export function CouponModal({ isOpen, onClose, onSuccess, couponToEdit, token }: CouponModalProps) {
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        value: 0,
        min_purchase: 0,
        max_uses: 0, // 0 means unlimited in UI logic if backend handles it, but typically we want null/undefined or a high number. Let's use logic.
        valid_until: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (couponToEdit) {
            setFormData({
                code: couponToEdit.code,
                type: couponToEdit.type,
                value: couponToEdit.value,
                min_purchase: couponToEdit.min_purchase || 0,
                max_uses: couponToEdit.max_uses || 0,
                valid_until: couponToEdit.valid_until ? new Date(couponToEdit.valid_until).toISOString().split('T')[0] : '',
                description: couponToEdit.description || ''
            });
        } else {
            setFormData({
                code: '',
                type: 'percentage',
                value: 0,
                min_purchase: 0,
                max_uses: 0,
                valid_until: '',
                description: ''
            });
        }
    }, [couponToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: any = {
                ...formData,
                max_uses: formData.max_uses > 0 ? formData.max_uses : null, // Convert 0 to null for unlimited if backend supports it or handle logic
                min_purchase: formData.min_purchase > 0 ? formData.min_purchase : 0,
                valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null
            };

            if (couponToEdit) {
                await couponService.updateCoupon(couponToEdit.id, payload, token);
                toast.success('Cupón actualizado correctamente');
            } else {
                await couponService.createCoupon(payload, token);
                toast.success('Cupón creado correctamente');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar cupón');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {couponToEdit ? 'Editar Cupón' : 'Nuevo Cupón'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                                placeholder="EJ: VERANO2024"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Descuento</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="percentage">Porcentaje (%)</option>
                                <option value="fixed">Monto Fijo (S/.)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.value}
                                onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mínimo de Compra</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.min_purchase}
                                onChange={e => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Límite Usos (0 = Infinito)</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.max_uses}
                                onChange={e => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Válido Hasta</label>
                            <input
                                type="date"
                                value={formData.valid_until}
                                onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none"
                                placeholder="Descripción interna o para el cliente..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/30 disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : (couponToEdit ? 'Actualizar Cupón' : 'Crear Cupón')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
