'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_CONFIG } from '@/config/api';
import { TrackingUnavailableNotice } from '@/components/common/TrackingUnavailableNotice';
import PaymentPanel, { type TrackingPaymentDetails } from '@/components/tracking/PaymentPanel';

const TRACKING_CODE_PATTERN = /^PI-[2-9A-HJKMNP-TV-Z]{6}-[2-9A-HJKMNP-TV-Z]{6}$/;

interface TrackingItem {
    product_name: string;
    quantity: number;
}

interface TrackingOrder {
    tracking_code: string;
    status: string;
    payment_status: string;
    payment_method?: string;
    total_amount: number;
    items: TrackingItem[];
    created_at: string;
    updated_at: string;
    can_pay?: boolean;
    invoice_available?: boolean;
    payment_methods?: string[];
    payment_details?: TrackingPaymentDetails;
}

type TrackingError = 'not_found' | 'rate_limit' | 'unavailable' | null;

const orderStatusLabels: Record<string, string> = {
    pending: 'Pendiente',
    pending_approval: 'En revisión',
    processed: 'Aprobado',
    cancelled: 'Cancelado',
};

const paymentStatusLabels: Record<string, string> = {
    pending: 'Pendiente',
    verified: 'Verificado',
    rejected: 'Rechazado',
};

const paymentMethodLabels: Record<string, string> = {
    // Valores historicos de pedidos ya pagados.
    transferencia: 'Transferencia',
    yape: 'Yape',
    plin: 'Plin',
    tarjeta: 'Tarjeta',
    efectivo: 'Efectivo',
    mercadopago: 'Mercado Pago',
};

export default function TrackingOrderPage() {
    const params = useParams();
    const rawCode = Array.isArray(params.code) ? params.code[0] : params.code;
    const trackingCode = (rawCode || '').trim().toUpperCase();

    const [order, setOrder] = useState<TrackingOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<TrackingError>(null);
    const [syncing, setSyncing] = useState(false);

    const loadTracking = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setError(null);
            setOrder(null);
        }

        if (!TRACKING_CODE_PATTERN.test(trackingCode)) {
            setError('not_found');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${API_CONFIG.API_BASE_URL}/api/orders/track/${encodeURIComponent(trackingCode)}`,
                { cache: 'no-store' }
            );

            if (response.status === 404) {
                setError('not_found');
                return;
            }
            if (response.status === 429) {
                setError('rate_limit');
                return;
            }
            if (!response.ok) {
                setError('unavailable');
                return;
            }

            const payload = await response.json();
            if (payload?.success && payload?.data) {
                setOrder(payload.data as TrackingOrder);
            }
        } catch {
            if (!silent) setError('unavailable');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const initialLoad = async () => {
            // Si el cliente vuelve de Mercado Pago (?pago=...), primero se
            // sincroniza el estado real del pago y luego se muestra la vista.
            const params = new URLSearchParams(window.location.search);
            if (params.get('pago')) {
                setSyncing(true);
                try {
                    await fetch(
                        `${API_CONFIG.API_BASE_URL}/api/orders/track/${encodeURIComponent(trackingCode)}/payment-status`,
                        { method: 'POST' }
                    );
                } catch {
                    // si falla la sincronizacion se muestra el estado guardado
                } finally {
                    if (!cancelled) setSyncing(false);
                }
            }

            if (!cancelled) await loadTracking(Boolean(params.get('pago')));
        };

        initialLoad();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackingCode]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-brand-red-600" />
                <p className="mt-4 text-gray-600">Consultando el estado de tu pedido...</p>
            </div>
        );
    }

    if (error === 'not_found') {
        return (
            <div className="container mx-auto max-w-2xl px-4 py-12 text-center sm:py-16">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
                    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">No encontramos ese pedido</h1>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-600 sm:text-base">
                    Verifica que el código esté completo y tenga el formato PI-XXXXXX-XXXXXX. Si el pedido es reciente, puede que el email aún esté en camino.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href="/track-order" className="rounded-lg bg-brand-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-700">
                        Intentar con otro código
                    </Link>
                    <Link href="/contacto" className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50">
                        Contactar soporte
                    </Link>
                </div>
            </div>
        );
    }

    if (error === 'rate_limit') {
        return (
            <div className="container mx-auto max-w-2xl px-4 py-12 text-center sm:py-16">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Demasiadas consultas</h1>
                <p className="mt-3 text-gray-600">Espera unos minutos antes de volver a intentar consultar el código.</p>
                <Link href="/track-order" className="mt-7 inline-block rounded-lg bg-brand-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-700">
                    Volver al rastreo
                </Link>
            </div>
        );
    }

    if (error === 'unavailable' || !order) {
        return (
            <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
                <TrackingUnavailableNotice />
            </div>
        );
    }

    const orderStatus = orderStatusLabels[order.status] || order.status;
    const paymentStatus = paymentStatusLabels[order.payment_status] || order.payment_status;
    const paymentMethod = order.payment_method ? paymentMethodLabels[order.payment_method] || order.payment_method : null;
    const showPaymentPanel = Boolean(order.can_pay);
    const awaitingConfirmation = Boolean(
        order.payment_method === 'mercadopago' && order.payment_status === 'pending' && !order.can_pay
    );

    return (
        <div className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
            <div className="mb-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-red-700">Seguimiento de pedido</p>
                <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Estado de tu compra</h1>
                <p className="mt-2 font-mono text-sm font-bold tracking-wider text-gray-700">{order.tracking_code}</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50 px-6 py-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estado del pedido</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{orderStatus}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estado del pago</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{paymentStatus}</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5">
                    <h2 className="text-lg font-bold text-gray-900">Artículos del pedido</h2>
                    {order.items.length > 0 ? (
                        <ul className="mt-4 divide-y divide-gray-100">
                            {order.items.map((item, index) => (
                                <li key={`${item.product_name}-${index}`} className="flex items-center justify-between gap-4 py-3">
                                    <span className="text-sm text-gray-700">{item.product_name}</span>
                                    <span className="shrink-0 text-sm font-semibold text-gray-900">x{item.quantity}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-3 text-sm text-gray-500">No hay artículos disponibles para mostrar.</p>
                    )}

                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-5">
                        <span className="font-semibold text-gray-700">Total</span>
                        <span className="text-xl font-extrabold text-gray-900">S/ {order.total_amount.toFixed(2)}</span>
                    </div>

                    <dl className="mt-5 grid gap-3 border-t border-gray-100 pt-5 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="text-gray-500">Realizado</dt>
                            <dd className="mt-1 font-medium text-gray-800">
                                {new Date(order.created_at).toLocaleDateString('es-PE', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </dd>
                        </div>
                        {paymentMethod && (
                            <div>
                                <dt className="text-gray-500">Método de pago</dt>
                                <dd className="mt-1 font-medium text-gray-800">{paymentMethod}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>

            {showPaymentPanel && (
                <PaymentPanel
                    trackingCode={order.tracking_code}
                    methods={order.payment_methods || []}
                    details={order.payment_details || {}}
                    totalAmount={order.total_amount}
                    onUpdated={() => loadTracking(true)}
                />
            )}

            {order.invoice_available && (
                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
                    <p className="text-sm font-semibold text-green-800">Tu comprobante está listo</p>
                    <p className="mt-1 text-sm text-green-700">
                        Descarga tu boleta o factura en PDF. Es tu sustento de la compra.
                    </p>
                    <a
                        href={`${API_CONFIG.API_BASE_URL}/api/orders/track/${encodeURIComponent(order.tracking_code)}/invoice`}
                        className="mt-4 inline-flex items-center justify-center rounded-lg bg-green-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800"
                    >
                        Descargar comprobante (PDF)
                    </a>
                </div>
            )}

            {awaitingConfirmation && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                    <p className="text-sm font-semibold text-amber-900">Estamos confirmando tu pago</p>
                    <p className="mt-1 text-sm text-amber-800">
                        Si ya pagaste, el estado se actualizará en unos minutos. También puedes refrescar esta página.
                    </p>
                    <button
                        type="button"
                        onClick={async () => {
                            setSyncing(true);
                            try {
                                await fetch(
                                    `${API_CONFIG.API_BASE_URL}/api/orders/track/${encodeURIComponent(order.tracking_code)}/payment-status`,
                                    { method: 'POST' }
                                );
                                await loadTracking(true);
                            } finally {
                                setSyncing(false);
                            }
                        }}
                        disabled={syncing}
                        className="mt-4 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-60"
                    >
                        {syncing ? 'Actualizando...' : 'Actualizar estado'}
                    </button>
                </div>
            )}

            <p className="mt-6 text-center text-xs leading-5 text-gray-500">
                Esta vista muestra únicamente la información necesaria para seguir tu pedido. No incluye datos personales ni de contacto.
            </p>

            <div className="mt-6 text-center">
                <Link href="/contacto" className="text-sm font-semibold text-brand-red-700 hover:text-brand-red-800">
                    ¿Necesitas ayuda? Contacta con soporte
                </Link>
            </div>
        </div>
    );
}
