'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, Home, ShoppingCart } from 'lucide-react';
import { Suspense } from 'react';

function FailureContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 py-12 flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full m-4">
                <div className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative">
                        <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-xl mb-4">
                            <XCircle className="w-14 h-14 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Pago Fallido</h1>
                        <p className="text-red-100 text-lg">Hubo un problema procesando tu pago</p>
                    </div>
                </div>

                <div className="p-8 text-center">
                    <p className="text-gray-600 mb-8">
                        No pudimos procesar tu pago. Por favor, intenta nuevamente o selecciona otro método de pago.
                    </p>

                    <div className="flex flex-col gap-4">
                        <Link
                            href="/cart"
                            className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition font-semibold flex items-center justify-center gap-2"
                        >
                            <ShoppingCart className="w-5 h-5" /> Volver al Carrito
                        </Link>
                        <Link
                            href="/"
                            className="border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:border-red-500 hover:text-red-600 transition font-semibold flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" /> Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutFailurePage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <FailureContent />
        </Suspense>
    );
}
