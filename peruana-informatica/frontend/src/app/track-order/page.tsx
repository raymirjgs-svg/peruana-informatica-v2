'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';

const TRACKING_CODE_PATTERN = /^PI-[2-9A-HJKMNP-TV-Z]{6}-[2-9A-HJKMNP-TV-Z]{6}$/;

export default function TrackOrderPage() {
    const router = useRouter();
    const { settings } = useSettings();
    const supportPhone = settings?.company_phone || '(054) 226796';
    const supportEmail = settings?.company_email || 'info@peruanainformatica.com.pe';
    const [trackingCode, setTrackingCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedCode = trackingCode.trim().toUpperCase();
        if (!TRACKING_CODE_PATTERN.test(normalizedCode)) {
            setError('Ingresa un código válido. Tiene el formato PI-XXXXXX-XXXXXX.');
            return;
        }

        setError(null);
        router.push(`/seguimiento/${encodeURIComponent(normalizedCode)}`);
    };

    return (
<<<<<<< HEAD
        <div className="min-h-screen bg-gray-50 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-2xl">
                <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-red-100 text-brand-red-700 shadow-lg">
                        <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Rastrea tu Pedido</h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
                        Ingresa el código de seguimiento que recibiste en el email de confirmación de tu pedido.
                    </p>
=======
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mx-auto h-16 w-16 brand-red-600 rounded-full flex items-center justify-center shadow-lg mb-6">
                    <span className="text-3xl">📦</span>
>>>>>>> fix/security-branding-20261118
                </div>

<<<<<<< HEAD
                <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <form onSubmit={handleSubmit} noValidate>
                        <label htmlFor="tracking-code" className="block text-sm font-semibold text-gray-800">
                            Código de seguimiento
                        </label>
                        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                            <input
                                id="tracking-code"
                                name="tracking-code"
                                type="text"
                                inputMode="text"
                                autoComplete="off"
                                autoCapitalize="characters"
                                spellCheck={false}
                                value={trackingCode}
                                onChange={(event) => {
                                    setTrackingCode(event.target.value.toUpperCase());
                                    if (error) setError(null);
                                }}
                                placeholder="PI-XXXXXX-XXXXXX"
                                aria-describedby={error ? 'tracking-code-error' : 'tracking-code-help'}
                                aria-invalid={Boolean(error)}
                                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 font-mono text-base uppercase tracking-wider text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-red-500 focus:ring-2 focus:ring-brand-red-100"
                            />
                            <button
                                type="submit"
                                className="rounded-lg bg-brand-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-700 focus:outline-none focus:ring-2 focus:ring-brand-red-300 focus:ring-offset-2"
=======
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSearch}>
                        <div>
                            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">
                                Número de Pedido
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input
                                    id="orderId"
                                    name="orderId"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-brand-red-500 focus:border-brand-red-500 sm:text-sm"
                                    placeholder="Ej: 1024"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white brand-red-600 hover:brand-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                disabled={!orderId.trim()}
>>>>>>> fix/security-branding-20261118
                            >
                                Consultar pedido
                            </button>
                        </div>
                        {error ? (
                            <p id="tracking-code-error" role="alert" className="mt-2 text-sm font-medium text-red-700">
                                {error}
                            </p>
                        ) : (
                            <p id="tracking-code-help" className="mt-2 text-xs text-gray-500">
                                El código contiene 12 caracteres y no incluye el número interno del pedido.
                            </p>
                        )}
                    </form>

                    <div className="mt-6 border-t border-gray-100 pt-5 text-sm text-gray-600">
                        <p>¿No encuentras el código? Escríbenos por WhatsApp al <strong>988 552 455</strong>, escribe a <strong>{supportEmail}</strong> o llámanos al <strong>{supportPhone}</strong>.</p>
                        <Link href="/contacto" className="mt-2 inline-block font-semibold text-brand-red-700 hover:text-brand-red-800">
                            Ver todos los contactos →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
