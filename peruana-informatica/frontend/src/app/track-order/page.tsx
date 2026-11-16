'use client';

import { TrackingUnavailableNotice } from '@/components/common/TrackingUnavailableNotice';

export default function TrackOrderPage() {
    return (
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
                        Estamos preparando un acceso seguro para que solo tú puedas consultar la información de tu compra.
                    </p>
                </div>

                <div className="mt-8">
                    <TrackingUnavailableNotice />
                </div>
            </div>
        </div>
    );
}
