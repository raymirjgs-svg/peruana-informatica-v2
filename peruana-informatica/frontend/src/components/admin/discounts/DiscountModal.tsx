import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { type Discount, discountService } from '@/services/DiscountService';
import { toast } from 'sonner';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    discountToEdit?: Discount | null;
    token: string;
}

export function DiscountModal({ isOpen, onClose, onSuccess, discountToEdit, token }: DiscountModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        applies_to: 'all',
        valid_from: '',
        valid_until: '',
        is_active: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (discountToEdit) {
            setFormData({
                name: discountToEdit.name,
                description: discountToEdit.description,
                discount_type: discountToEdit.discount_type,
                discount_value: discountToEdit.discount_value,
                applies_to: discountToEdit.applies_to,
                valid_from: discountToEdit.valid_from ? (new Date(discountToEdit.valid_from).toISOString().split('T')[0] ?? '') : '',
                valid_until: discountToEdit.valid_until ? (new Date(discountToEdit.valid_until).toISOString().split('T')[0] ?? '') : '',
                is_active: discountToEdit.is_active
            });
        } else {
            setFormData({
                name: '',
                description: '',
                discount_type: 'percentage',
                discount_value: 0,
                applies_to: 'all',
                valid_from: '',
                valid_until: '',
                is_active: true
            });
        }
    }, [discountToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (discountToEdit) {
                await discountService.updateDiscount(discountToEdit.id, formData as any, token);
                toast.success('Descuento actualizado');
            } else {
                await discountService.createDiscount(formData as any, token);
                toast.success('Descuento creado');
            }
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Error al guardar descuento');
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
                        {discountToEdit ? 'Editar Descuento' : 'Nuevo Descuento'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre Promoción</label>
                        <input
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tipo</label>
                            <select
                                value={formData.discount_type}
                                onChange={e => setFormData({ ...formData, discount_type: e.target.value as any })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="percentage">Porcentaje (%)</option>
                                <option value="fixed">Monto Fijo (S/.)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Valor</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.discount_value}
                                onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Aplica A</label>
                        <select
                            value={formData.applies_to}
                            onChange={e => setFormData({ ...formData, applies_to: e.target.value as any })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="all">Todo el Catálogo</option>
                            <option value="category">Categoría Específica</option>
                            <option value="product">Producto Específico</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Desde</label>
                            <input
                                type="date"
                                required
                                value={formData.valid_from}
                                onChange={e => setFormData({ ...formData, valid_from: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Hasta</label>
                            <input
                                type="date"
                                required
                                value={formData.valid_until}
                                onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Descripción</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
