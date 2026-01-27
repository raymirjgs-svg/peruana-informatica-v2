'use client';

import { useState, useEffect } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { couponService, type Coupon } from '@/services/CouponService';
import { toast } from 'sonner';

interface CouponInputProps {
    subtotal: number;
    onCouponApplied: (coupon: Coupon | null) => void;
}

export function CouponInput({ subtotal, onCouponApplied }: CouponInputProps) {
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    // Re-validate coupon rules when subtotal changes
    useEffect(() => {
        if (appliedCoupon && appliedCoupon.min_purchase && subtotal < appliedCoupon.min_purchase) {
            toast.error(`El cupón requiere una compra mínima de S/. ${appliedCoupon.min_purchase}`);
            setAppliedCoupon(null);
            onCouponApplied(null);
        }
    }, [subtotal, appliedCoupon, onCouponApplied]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Ingresa un código de cupón');
            return;
        }

        setIsValidating(true);

        try {
            const result = await couponService.validateCoupon(couponCode, subtotal);

            if (result.success && result.data) {
                setAppliedCoupon(result.data);
                onCouponApplied(result.data);
                toast.success('¡Cupón aplicado exitosamente!');
                setCouponCode('');
            } else {
                toast.error(result.message || 'Cupón inválido');
                setAppliedCoupon(null);
                onCouponApplied(null);
            }
        } catch (error) {
            toast.error('Error al validar cupón');
            setAppliedCoupon(null);
            onCouponApplied(null);
        } finally {
            setIsValidating(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        onCouponApplied(null);
        setCouponCode('');
        toast.info('Cupón removido');
    };

    // Calculate current discount for display purposes
    const currentDiscountAmount = appliedCoupon
        ? (appliedCoupon.type === 'percentage'
            ? (subtotal * appliedCoupon.value) / 100
            : appliedCoupon.value)
        : 0;

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
                <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                    Código de Descuento
                </h3>
            </div>

            {appliedCoupon ? (
                // Applied coupon display
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full">
                                <Check className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-green-900 dark:text-green-100">
                                    {appliedCoupon.code}
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    {appliedCoupon.type === 'percentage'
                                        ? `${appliedCoupon.value}% de descuento`
                                        : `S/. ${appliedCoupon.value} de descuento`
                                    }
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    Ahorras: S/. {currentDiscountAmount.toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveCoupon}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            aria-label="Remover cupón"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            ) : (
                // Coupon input
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="Ej: PERUANA20"
                        disabled={isValidating}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    />
                    <button
                        onClick={handleApplyCoupon}
                        disabled={isValidating || !couponCode.trim()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {isValidating ? 'Validando...' : 'Aplicar'}
                    </button>
                </div>
            )}

            {appliedCoupon?.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {appliedCoupon.description}
                </p>
            )}
        </div>
    );
}
