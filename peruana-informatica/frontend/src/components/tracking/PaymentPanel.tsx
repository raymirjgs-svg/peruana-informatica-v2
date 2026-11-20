'use client';

import { useState } from 'react';
import { API_CONFIG } from '@/config/api';

export interface TrackingPaymentDetails {
    mercadopago?: { enabled: boolean };
}

interface PaymentPanelProps {
    trackingCode: string;
    methods: string[];
    details: TrackingPaymentDetails;
    totalAmount: number;
    onUpdated: () => void;
}

const methodLabels: Record<string, string> = {
    mercadopago: 'Mercado Pago',
};

/**
 * Panel de pago del pedido aprobado.
 *
 * El codigo de seguimiento es la credencial: el cliente paga sin exponer su
 * id interno y sin compartir datos personales.
 */
export default function PaymentPanel({
    trackingCode,
    methods,
    details,
    totalAmount,
    onUpdated,
}: PaymentPanelProps) {
    const [busy, setBusy] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

    const postToTracking = async (path: string, body?: FormData) => {
        const response = await fetch(
            `${API_CONFIG.API_BASE_URL}/api/orders/track/${encodeURIComponent(trackingCode)}${path}`,
            body ? { method: 'POST', body } : { method: 'POST' }
        );
        let payload: any = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }
        return { response, payload };
    };

    const handleMercadoPago = async () => {
        setBusy('mercadopago');
        setMessage(null);
        try {
            const { response, payload } = await postToTracking('/payment-preference');
            if (response.ok && payload?.data?.init_point) {
                window.location.href = payload.data.init_point;
                return;
            }
            setMessage({
                type: 'error',
                text: payload?.message || 'No pudimos generar el link de pago. Inténtalo en unos minutos.',
            });
        } catch {
            setMessage({ type: 'error', text: 'Error de conexión. Inténtalo nuevamente.' });
        } finally {
            setBusy(null);
        }
    };

    const hasMercadoPago = methods.includes('mercadopago') && details.mercadopago?.enabled !== false;

    return (
        <div className="mt-6 rounded-2xl border-2 border-brand-red-200 bg-brand-red-50/40 p-6">
            <h2 className="text-lg font-extrabold text-gray-900">Pagar pedido</h2>
            <p className="mt-1 text-sm text-gray-600">
                Tu pedido fue aprobado. Completa el pago de <strong>S/ {totalAmount.toFixed(2)}</strong> para
                que preparemos el envío.
            </p>

            {message && (
                <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                        message.type === 'ok'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-red-200 bg-red-50 text-red-800'
                    }`}
                >
                    {message.text}
                </div>
            )}

            <div className="mt-5 space-y-4">
                {hasMercadoPago && (
                    <button
                        type="button"
                        onClick={handleMercadoPago}
                        disabled={busy !== null}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009BDE] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#0089c2] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.3 6.3c-.5-.3-1.1-.5-1.9-.5-1.1 0-1.8.5-1.8 1.2 0 .6.4 1 1.5 1.3 1.6.4 2.3 1 2.3 2.2 0 1.4-1.1 2.3-2.8 2.3-.9 0-1.7-.2-2.4-.6v1.7c.7.4 1.5.5 2.4.5 1.9 0 3.1-.9 3.1-2.4 0-1.1-.6-1.8-1.9-2.2-1.4-.4-1.9-.8-1.9-1.3 0-.5.5-.9 1.4-.9.7 0 1.3.2 1.9.4V6.3z" />
                        </svg>
                        {busy === 'mercadopago' ? 'Generando link de pago...' : 'Pagar con Mercado Pago'}
                    </button>
                )}

                {!hasMercadoPago && (
                    <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                        Por ahora el pago en línea no está disponible. Escríbenos por WhatsApp para coordinar tu pago.
                    </p>
                )}
            </div>
        </div>
    );
}
