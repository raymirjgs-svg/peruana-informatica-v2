'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, Home, Search } from 'lucide-react';
import { Suspense } from 'react';

function PendingContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-12 flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full m-4">
                <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative">
                        <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-xl mb-4 animate-pulse">
                            <Clock className="w-14 h-14 text-amber-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Pago Pendiente</h1>
                        <p className="text-amber-100 text-lg">Estamos procesando tu pago</p>
                    </div>
                </div>

                <div className="p-8 text-center">
                    {orderId && (
                        <div className="mb-6">
                            <p className="text-gray-500 mb-2">Número de Pedido</p>
                            <p className="text-4xl font-bold text-gray-800">#{orderId}</p>
                        </div>
                    )}

                    <p className="text-gray-600 mb-8">
                        Tu pago está siendo procesado. Te notificaremos por correo una vez que se confirme.
                    </p>

                    <div className="flex flex-col gap-4">
                        <Link
                            href="/"
                            className="bg-amber-600 text-white px-6 py-3 rounded-xl hover:bg-amber-700 transition font-semibold flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" /> Volver al Inicio
                        </Link>
                        {orderId && (
                            <Link
                                href={`/orders/${orderId}`}
                                className="border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:border-amber-500 hover:text-amber-600 transition font-semibold flex items-center justify-center gap-2"
                            >
                                <Search className="w-5 h-5" /> Ver Estado del Pedido
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPendingPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <PendingContent />
        </Suspense>
    );
}
