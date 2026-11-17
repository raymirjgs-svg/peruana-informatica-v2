'use client';

import { useState } from 'react';
import { API_CONFIG } from '@/config/api';

export interface TrackingPaymentDetails {
    transferencia?: {
        holder?: string;
        bcp_account?: string;
        bcp_cci?: string;
        ibk_account?: string;
        ibk_cci?: string;
    };
    yape?: { phone?: string };
    plin?: { phone?: string };
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
    transferencia: 'Transferencia bancaria',
    yape: 'Yape',
    plin: 'Plin',
    efectivo: 'Efectivo en tienda',
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
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofMethod, setProofMethod] = useState<string>('transferencia');

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

    const handleProofUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proofFile) {
            setMessage({ type: 'error', text: 'Selecciona el archivo de tu comprobante.' });
            return;
        }

        setBusy('proof');
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('payment_proof', proofFile);
            formData.append('payment_method', proofMethod);

            const { response, payload } = await postToTracking('/payment-proof', formData);
            if (!response.ok) {
                setMessage({
                    type: 'error',
                    text: payload?.message || 'No pudimos registrar tu comprobante.',
                });
                return;
            }
            setMessage({ type: 'ok', text: payload?.message || 'Comprobante recibido.' });
            setProofFile(null);
            onUpdated();
        } catch {
            setMessage({ type: 'error', text: 'Error de conexión. Inténtalo nuevamente.' });
        } finally {
            setBusy(null);
        }
    };

    const hasMercadoPago = methods.includes('mercadopago') && details.mercadopago?.enabled !== false;
    const hasProofMethods = methods.some((method) =>
        ['transferencia', 'yape', 'plin'].includes(method)
    );
    const walletPhone =
        proofMethod === 'yape' ? details.yape?.phone : proofMethod === 'plin' ? details.plin?.phone : undefined;

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

                {hasProofMethods && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-sm font-semibold text-gray-800">Otherí pago por {methodLabels[proofMethod]}</p>

                        {proofMethod === 'transferencia' && details.transferencia && (
                            <dl className="mt-3 space-y-1 text-sm text-gray-700">
                                {details.transferencia.holder && (
                                    <div><dt className="inline font-semibold">Titular: </dt><dd className="inline">{details.transferencia.holder}</dd></div>
                                )}
                                {details.transferencia.bcp_account && (
                                    <div><dt className="inline font-semibold">BCP cuenta: </dt><dd className="inline">{details.transferencia.bcp_account}</dd></div>
                                )}
                                {details.transferencia.bcp_cci && (
                                    <div><dt className="inline font-semibold">BCP CCI: </dt><dd className="inline">{details.transferencia.bcp_cci}</dd></div>
                                )}
                                {details.transferencia.ibk_account && (
                                    <div><dt className="inline font-semibold">Interbank cuenta: </dt><dd className="inline">{details.transferencia.ibk_account}</dd></div>
                                )}
                                {details.transferencia.ibk_cci && (
                                    <div><dt className="inline font-semibold">Interbank CCI: </dt><dd className="inline">{details.transferencia.ibk_cci}</dd></div>
                                )}
                            </dl>
                        )}

                        {(proofMethod === 'yape' || proofMethod === 'plin') && walletPhone && (
                            <p className="mt-3 text-sm text-gray-700">
                                Número: <strong>{walletPhone}</strong>
                            </p>
                        )}

                        <form onSubmit={handleProofUpload} className="mt-4 space-y-3">
                            <select
                                value={proofMethod}
                                onChange={(e) => setProofMethod(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            >
                                {methods
                                    .filter((method) => ['transferencia', 'yape', 'plin'].includes(method))
                                    .map((method) => (
                                        <option key={method} value={method}>{methodLabels[method]}</option>
                                    ))}
                            </select>

                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-700"
                            />

                            <button
                                type="submit"
                                disabled={busy !== null}
                                className="w-full rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {busy === 'proof' ? 'Enviando...' : 'Enviar comprobante'}
                            </button>
                        </form>
                    </div>
                )}

                {methods.includes('efectivo') && (
                    <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                        Puedes pagar en efectivo en nuestra tienda. Te confirmaremos por WhatsApp la dirección exacta.
                    </p>
                )}

                {!hasMercadoPago && !hasProofMethods && !methods.includes('efectivo') && (
                    <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                        Por ahora el pago en línea no está disponible. Escríbenos por WhatsApp para coordinar tu pago.
                    </p>
                )}
            </div>
        </div>
    );
}
