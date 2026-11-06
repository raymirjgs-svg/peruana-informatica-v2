'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Home, Search } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full m-4">
                <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative">
                        <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-xl mb-4 animate-bounce">
                            <CheckCircle className="w-14 h-14 text-green-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">¡Pago Exitoso!</h1>
                        <p className="text-green-100 text-lg">Tu pedido ha sido procesado</p>
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
                        Hemos recibido la confirmación de tu pago. Te enviaremos los detalles a tu correo electrónico pronto.
                    </p>

                    <div className="flex flex-col gap-4">
                        <Link
                            href="/"
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" /> Volver al Inicio
                        </Link>
                        {orderId && (
                            <Link
                                href={`/orders/${orderId}`}
                                className="border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:border-blue-500 hover:text-blue-600 transition font-semibold flex items-center justify-center gap-2"
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

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
